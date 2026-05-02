import { getOrCreateWeek, getUsers, getWeeks } from "@/actions";
import MeetingAttendanceForm from "@/components/meeting-attendance-form";
import { checkRole } from "@/lib/auth-server";
import { ROLES } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase";

const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateKey = (value: string): Date | null => {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

const toArabicRange = (startDate: string) => {
  const start = parseDateKey(startDate);
  if (!start) return startDate;
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return `${start.toLocaleDateString("ar-MA", {
    month: "short",
    day: "numeric",
  })} - ${end.toLocaleDateString("ar-MA", {
    month: "short",
    day: "numeric",
  })}`;
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  await checkRole([ROLES.ADMIN, ROLES.OWNER]);

  const [weeks, users, currentWeek, resolvedParams] = await Promise.all([
    getWeeks(),
    getUsers(),
    getOrCreateWeek(new Date()),
    searchParams,
  ]);

  const weekIdFromQuery = resolvedParams.week;
  const selectedWeek =
    weeks.find((week) => week.id === weekIdFromQuery) ??
    weeks.find((week) => week.id === currentWeek?.id) ??
    weeks[0];

  if (!selectedWeek) {
    return (
      <div className="ds-page" dir="rtl">
        <section className="ds-card">
          <h2 className="ds-title">حضور الاجتماع الأسبوعي</h2>
          <p className="ds-subtitle mt-1">لا توجد أسابيع متاحة حتى الآن.</p>
        </section>
      </div>
    );
  }

  const weekStart = parseDateKey(selectedWeek.start_date);
  const meetingDate = new Date(weekStart ?? new Date());
  meetingDate.setDate(meetingDate.getDate() + 5); // Thursday in app week (Saturday start)
  const meetingDateKey = toDateKey(meetingDate);

  const trackedUsers = users.filter((user) =>
    [ROLES.MEMBER, ROLES.ADMIN, ROLES.OWNER].includes(user.role),
  );

  const { data: attendanceRows } = await supabaseAdmin
    .from("meeting_attendance")
    .select("*")
    .eq("meeting_date", meetingDateKey);

  const records = (attendanceRows ?? []) as MeetingAttendance[];

  const recordByUserId = new Map(
    records
      .filter((record) => record.user_id)
      .map((record) => [record.user_id as string, record]),
  );

  const appUsers = trackedUsers.map((user) => ({
    user_id: user.id,
    full_name: user.full_name ?? null,
    username: user.username || "user",
  }));

  const appAttendees = trackedUsers
    .map((user) => {
      const record = recordByUserId.get(user.id);
      if (!record) return null;

      return {
        user_id: user.id,
        full_name: user.full_name,
        username: user.username,
        status: record.status as "present" | "absent" | "appeal",
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const guestAttendees = records
    .filter((record) => !record.user_id && record.guest_name)
    .map((record) => ({
      guest_name: record.guest_name as string,
      status: record.status as "present" | "absent" | "appeal",
    }));

  return (
    <div className="ds-page" dir="rtl">
      <section className="ds-card space-y-4">
        <div className="ds-section-header">
          <div className="space-y-2">
            <h2 className="ds-title">حضور الاجتماع الأسبوعي</h2>
            <p className="ds-subtitle">
              تسجيل حضور اجتماع يوم الخميس للأعضاء والأشخاص من خارج التطبيق.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="ds-badge">اجتماع الخميس</span>
              <span className="ds-badge-primary">
                تاريخ الاجتماع: {meetingDate.toLocaleDateString("ar-MA")}
              </span>
            </div>
          </div>

          <form method="get" className="flex flex-wrap items-end gap-2">
            <label className="flex min-w-64 flex-col gap-1 text-xs font-medium text-gray-600">
              اختيار الأسبوع
              <select name="week" defaultValue={selectedWeek.id} className="ds-select">
                {weeks.map((week) => (
                  <option key={week.id} value={week.id}>
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
      </section>

      <section className="ds-card">
        <MeetingAttendanceForm
          meetingDate={meetingDateKey}
          appUsers={appUsers}
          appAttendees={appAttendees}
          guestAttendees={guestAttendees}
        />
      </section>
    </div>
  );
}
