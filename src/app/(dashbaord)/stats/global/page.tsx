import { getUsers, getWeeks } from "@/actions";
import { checkRole } from "@/lib/auth-server";
import { ROLES, getRoleLabel } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase";

const parseDateKey = (value: string): Date | null => {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toArabicRange = (startDate: string) => {
  const start = parseDateKey(startDate);
  if (!start) return startDate;

  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  return `${start.toLocaleDateString("ar-MA", {
    month: "short",
    day: "numeric",
  })} - ${end.toLocaleDateString("ar-MA", {
    month: "short",
    day: "numeric",
  })}`;
};

const normalizeParam = (value?: string | string[]) => {
  if (!value) return [] as string[];
  return Array.isArray(value) ? value : [value];
};

const STATUS_SCORE: Record<MeetingAttendance["status"], number> = {
  present: 1,
  appeal: 0,
  absent: -1,
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ weekFrom?: string; weekTo?: string }>;
}) {
  await checkRole([ROLES.ADMIN, ROLES.OWNER]);

  const [users, weeks, resolvedParams] = await Promise.all([
    getUsers(),
    getWeeks(),
    searchParams,
  ]);

  if (weeks.length === 0) {
    return (
      <div className="ds-page" dir="rtl">
        <section className="ds-card">
          <h1 className="ds-title">إحصائيات الحضور</h1>
          <p className="ds-subtitle">لا توجد أسابيع متاحة حتى الآن.</p>
        </section>
      </div>
    );
  }

  const weekFromParam = normalizeParam(resolvedParams.weekFrom)[0];
  const weekToParam = normalizeParam(resolvedParams.weekTo)[0];

  const availableWeekIds = new Set(weeks.map((week) => week.id));
  const defaultWeekId = weeks[0]?.id;

  const fromWeekId =
    (weekFromParam && availableWeekIds.has(weekFromParam)
      ? weekFromParam
      : defaultWeekId) ?? defaultWeekId;
  const toWeekId =
    (weekToParam && availableWeekIds.has(weekToParam)
      ? weekToParam
      : fromWeekId) ?? fromWeekId;

  const fromWeek = weeks.find((week) => week.id === fromWeekId) ?? weeks[0];
  const toWeek = weeks.find((week) => week.id === toWeekId) ?? weeks[0];

  const rangeStart = parseDateKey(fromWeek.start_date) ?? new Date();
  const rangeEndStart = parseDateKey(toWeek.start_date) ?? rangeStart;

  const startDateKey = toDateKey(rangeStart);
  const endRangeDate = new Date(rangeEndStart);
  endRangeDate.setDate(endRangeDate.getDate() + 6);
  const endDateKey = toDateKey(endRangeDate);

  const { data: attendanceRows } = await supabaseAdmin
    .from("meeting_attendance")
    .select("*")
    .gte("meeting_date", startDateKey)
    .lte("meeting_date", endDateKey)
    .order("meeting_date", { ascending: true });

  const records = (attendanceRows ?? []) as MeetingAttendance[];
  const userMap = new Map(users.map((user) => [user.id, user]));

  const uniqueMeetingDates = new Set(
    records.map((record) => record.meeting_date),
  );

  const summary = {
    present: 0,
    appeal: 0,
    absent: 0,
    score: 0,
  };

  const attendeeMap = new Map<
    string,
    {
      id: string;
      name: string;
      roleLabel: string;
      present: number;
      appeal: number;
      absent: number;
      score: number;
    }
  >();

  for (const record of records) {
    const status = record.status;
    summary[status] += 1;
    summary.score += STATUS_SCORE[status];

    const isGuest = !record.user_id;
    if (isGuest) continue;
    const attendeeKey = isGuest
      ? `guest:${record.guest_name ?? ""}`
      : `user:${record.user_id}`;

    if (!attendeeMap.has(attendeeKey)) {
      const user = record.user_id ? userMap.get(record.user_id) : null;
      attendeeMap.set(attendeeKey, {
        id: attendeeKey,
        name: isGuest
          ? record.guest_name ?? "ضيف"
          : user?.full_name ?? user?.username ?? "عضو",
        roleLabel: isGuest ? "ضيف" : getRoleLabel(user?.role ?? "member"),
        present: 0,
        appeal: 0,
        absent: 0,
        score: 0,
      });
    }

    const attendee = attendeeMap.get(attendeeKey)!;
    attendee[status] += 1;
    attendee.score += STATUS_SCORE[status];
  }

  const attendeeRows = Array.from(attendeeMap.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name, "ar");
  });

  const totalRecords = records.length;
  const averageScore = totalRecords
    ? (summary.score / totalRecords).toFixed(2)
    : "0.00";

  return (
    <div className="ds-page" dir="rtl">
      <section className="ds-card space-y-6">
        <div className="ds-section-header">
          <div>
            <h1 className="ds-title">إحصائيات الحضور العامة</h1>
            <p className="ds-subtitle">
              تحليل حضور الاجتماعات للأعضاء والضيوف ضمن النطاق الزمني المحدد.
            </p>
          </div>

          <form method="get" className="flex flex-wrap items-end gap-2">
            <label className="flex min-w-56 flex-col gap-1 text-xs font-medium text-gray-600">
              من أسبوع
              <select name="weekFrom" defaultValue={fromWeek.id} className="ds-select">
                {weeks.map((week) => (
                  <option key={`from-${week.id}`} value={week.id}>
                    {toArabicRange(week.start_date)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-w-56 flex-col gap-1 text-xs font-medium text-gray-600">
              إلى أسبوع
              <select name="weekTo" defaultValue={toWeek.id} className="ds-select">
                {weeks.map((week) => (
                  <option key={`to-${week.id}`} value={week.id}>
                    {toArabicRange(week.start_date)}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              عرض
            </button>
          </form>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs text-gray-500">عدد الاجتماعات</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {uniqueMeetingDates.size}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs text-gray-500">إجمالي السجل</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {summary.score}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs text-gray-500">متوسط النقاط لكل حضور</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {averageScore}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs text-gray-500">إجمالي التسجيلات</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {totalRecords}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="ds-badge">حاضر: {summary.present}</span>
          <span className="ds-badge">اعتذار: {summary.appeal}</span>
          <span className="ds-badge">غائب: {summary.absent}</span>
        </div>
      </section>

      <section className="ds-card">
        <div className="ds-section-header">
          <div>
            <h2 className="ds-title">تفاصيل الحضور</h2>
            <p className="ds-subtitle">
              ترتيب الأعضاء والضيوف حسب مجموع النقاط خلال الفترة.
            </p>
          </div>
          <span className="ds-badge-primary">
            {attendeeRows.length} مشارك
          </span>
        </div>

        {attendeeRows.length === 0 ? (
          <p className="text-sm text-gray-500">لا توجد بيانات في هذا النطاق.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="text-right text-xs text-gray-500">
                  <th className="px-3">الاسم</th>
                  <th className="px-3">الصفة</th>
                  <th className="px-3">حاضر</th>
                  <th className="px-3">اعتذار</th>
                  <th className="px-3">غائب</th>
                  <th className="px-3">المجموع</th>
                </tr>
              </thead>
              <tbody>
                {attendeeRows.map((row) => (
                  <tr key={row.id} className="rounded-lg bg-gray-50">
                    <td className="px-3 py-3 font-semibold text-gray-900">
                      {row.name}
                    </td>
                    <td className="px-3 py-3">
                      <span className="ds-badge">{row.roleLabel}</span>
                    </td>
                    <td className="px-3 py-3 text-gray-700">{row.present}</td>
                    <td className="px-3 py-3 text-gray-700">{row.appeal}</td>
                    <td className="px-3 py-3 text-gray-700">{row.absent}</td>
                    <td className="px-3 py-3">
                      <span
                        className={
                          row.score >= 0
                            ? "ds-badge-primary"
                            : "ds-badge bg-red-100 text-red-700"
                        }
                      >
                        {row.score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
