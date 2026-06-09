import { getUsers, getWeeks } from "@/actions";
import { checkRole } from "@/lib/auth-server";
import { ROLES, getRoleLabel } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";

const ALL_ROLE_FILTERS = ["all", ...Object.values(ROLES)] as const;

const APP_DAY_IDS = [1, 2, 3, 4, 5, 6, 7] as const;

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

const getAppDayNumber = (date: Date): number => {
  return ((date.getDay() + 1) % 7) + 1;
};

const getWeekStartDateKey = (date: Date): string => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  const day = value.getDay();
  const diffToSaturday = (day + 1) % 7;
  value.setDate(value.getDate() - diffToSaturday);
  return toDateKey(value);
};

const getWeekDates = (startDate: string): Date[] => {
  const start = parseDateKey(startDate);
  if (!start) return [];

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
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

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; week?: string | string[] }>;
}) {
  await checkRole([ROLES.OWNER]);

  const [users, weeks, resolvedSearchParams] = await Promise.all([
    getUsers(),
    getWeeks(),
    searchParams,
  ]);

  const selectedRole = ALL_ROLE_FILTERS.includes(
    resolvedSearchParams.role as (typeof ALL_ROLE_FILTERS)[number],
  )
    ? (resolvedSearchParams.role as (typeof ALL_ROLE_FILTERS)[number])
    : "all";

  const weekParamIds = normalizeParam(resolvedSearchParams.week);
  const availableWeekIds = new Set(weeks.map((week) => week.id));
  const currentWeekStartKey = getWeekStartDateKey(new Date());
  const currentWeekId = weeks.find(
    (week) => week.start_date === currentWeekStartKey,
  )?.id;
  const selectedWeekId =
    weekParamIds.find((weekId) => availableWeekIds.has(weekId)) ??
    currentWeekId ??
    weeks[0]?.id;
  const selectedWeekIds = selectedWeekId ? [selectedWeekId] : [];

  const filteredUsers =
    selectedRole === "all"
      ? users
      : users.filter((user) => user.role === selectedRole);

  const selectedWeeks = weeks.filter((week) =>
    selectedWeekIds.includes(week.id),
  );

  const { data: weekTasks } = selectedWeekIds.length
    ? await supabaseAdmin
        .from("week_tasks")
        .select("id, week_id, task_days, sort_order")
        .in("week_id", selectedWeekIds)
        .order("sort_order", { ascending: true })
    : { data: [] as WeekTask[] };

  const { data: assignments } = (weekTasks ?? []).length
    ? await supabaseAdmin
        .from("week_task_assignments")
        .select("week_task_id, user_id")
        .in(
          "week_task_id",
          (weekTasks ?? []).map((weekTask) => weekTask.id),
        )
    : { data: [] as { week_task_id: string; user_id: string }[] };

  const assignmentMap = new Map<string, string[]>();

  for (const assignment of assignments ?? []) {
    const current = assignmentMap.get(assignment.week_task_id) ?? [];
    current.push(assignment.user_id);
    assignmentMap.set(assignment.week_task_id, current);
  }

  const selectedWeekDays = new Map(
    selectedWeeks.map((week) => [week.id, getWeekDates(week.start_date)]),
  );

  const weekTaskDaysById = new Map<string, Set<string>>();

  for (const weekTask of (weekTasks ?? []) as WeekTask[]) {
    const weekDays = selectedWeekDays.get(weekTask.week_id) ?? [];
    const taskDays =
      weekTask.task_days && weekTask.task_days.length > 0
        ? weekTask.task_days
        : [...APP_DAY_IDS];

    const assignedDateKeys = new Set(
      weekDays
        .filter((date) => taskDays.includes(getAppDayNumber(date)))
        .map((date) => toDateKey(date)),
    );

    weekTaskDaysById.set(weekTask.id, assignedDateKeys);
  }

  const { data: completions } = (weekTasks ?? []).length
    ? await supabaseAdmin
        .from("user_tasks")
        .select("user_id, week_task_id, completed_at")
        .in(
          "week_task_id",
          (weekTasks ?? []).map((weekTask) => weekTask.id),
        )
    : {
        data: [] as {
          user_id: string;
          week_task_id: string | null;
          completed_at: string;
        }[],
      };

  const userCompletionMap = new Map<string, Map<string, Set<string>>>();

  for (const completion of completions ?? []) {
    if (!completion.week_task_id) continue;
    const completedDateKey = toDateKey(new Date(completion.completed_at));

    if (!userCompletionMap.has(completion.user_id)) {
      userCompletionMap.set(completion.user_id, new Map());
    }

    const taskMap = userCompletionMap.get(completion.user_id)!;
    if (!taskMap.has(completion.week_task_id)) {
      taskMap.set(completion.week_task_id, new Set());
    }

    taskMap.get(completion.week_task_id)?.add(completedDateKey);
  }

  const rows = filteredUsers.map((user) => {
    const completionsForUser = userCompletionMap.get(user.id) ?? new Map();
    const visibleWeekTasks = (weekTasks ?? []).filter((weekTask) => {
      const assignedUserIds = assignmentMap.get(weekTask.id) ?? [];
      return assignedUserIds.length === 0 || assignedUserIds.includes(user.id);
    });

    let completedCount = 0;
    let possibleCount = 0;
    const perWeek = selectedWeeks.map((week) => {
      let weekPossible = 0;
      let weekCompleted = 0;

      for (const weekTask of visibleWeekTasks.filter(
        (task) => task.week_id === week.id,
      ) as WeekTask[]) {
        const assignedKeys = weekTaskDaysById.get(weekTask.id) ?? new Set();
        const completionKeys = completionsForUser.get(weekTask.id) ?? new Set();
        const taskCompleted = Array.from(assignedKeys).filter((key) =>
          completionKeys.has(key),
        ).length;

        weekPossible += assignedKeys.size;
        weekCompleted += taskCompleted;
      }

      possibleCount += weekPossible;
      completedCount += weekCompleted;

      return {
        weekId: week.id,
        label: toArabicRange(week.start_date),
        completed: weekCompleted,
        total: weekPossible,
      };
    });

    const percent =
      possibleCount > 0
        ? Math.round((completedCount / possibleCount) * 100)
        : 0;

    return {
      user,
      completedCount,
      possibleCount,
      percent,
      perWeek,
    };
  });

  rows.sort((left, right) => {
    if (right.percent !== left.percent) return right.percent - left.percent;
    if (right.completedCount !== left.completedCount)
      return right.completedCount - left.completedCount;
    return (left.user.full_name ?? left.user.username).localeCompare(
      right.user.full_name ?? right.user.username,
      "ar",
    );
  });

  const totalCompleted = rows.reduce((sum, row) => sum + row.completedCount, 0);
  const totalPossible = rows.reduce((sum, row) => sum + row.possibleCount, 0);
  const averagePercent =
    rows.length > 0
      ? Math.round(
          rows.reduce((sum, row) => sum + row.percent, 0) / rows.length,
        )
      : 0;

  return (
    <div className="ds-page" dir="rtl">
      <section className="ds-card space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="ds-title">إحصائيات المستخدمين</h2>
            <p className="ds-subtitle">
              راقب أداء الأعضاء عبر الأدوار والأسابيع المحددة.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">المستخدمون المعروضون</p>
              <p className="mt-1 text-lg font-bold text-gray-900">
                {rows.length}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">إجمالي الإنجاز</p>
              <p className="mt-1 text-lg font-bold text-gray-900">
                {totalCompleted}/{totalPossible}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">المتوسط العام</p>
              <p className="mt-1 text-lg font-bold text-gray-900">
                {averagePercent}%
              </p>
            </div>
          </div>
        </div>

        <form
          method="get"
          className="space-y-4 rounded-xl border border-gray-200 bg-white p-4"
        >
          <div className="grid items-end gap-4 lg:grid-cols-[1fr_2fr_auto]">
            <label className="space-y-2">
              <span className="block text-sm font-medium text-gray-700">
                فلترة حسب الدور
              </span>
              <select
                name="role"
                defaultValue={selectedRole}
                className="ds-select"
              >
                {ALL_ROLE_FILTERS.map((role) => (
                  <option key={role} value={role}>
                    {role === "all" ? "جميع الأدوار" : getRoleLabel(role)}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="block text-sm font-medium text-gray-700">
                اختيار الأسابيع
              </span>
              <select
                name="week"
                defaultValue={selectedWeekId}
                className="ds-select"
              >
                {weeks.map((week) => (
                  <option key={week.id} value={week.id}>
                    {toArabicRange(week.start_date)}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="ds-badge-primary flex px-4 py-2 text-center text-sm"
            >
              تطبيق الفلاتر
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                  المستخدم
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                  الدور
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                  الإكمال
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                  النسبة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    لا توجد بيانات مطابقة للفلاتر الحالية.
                  </td>
                </tr>
              ) : (
                rows.map(({ user, completedCount, possibleCount, percent }) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">
                          {user.full_name ?? user.username}
                        </span>
                        <span className="text-xs text-gray-500">
                          @{user.username}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="ds-badge">
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-700">
                      {completedCount}/{possibleCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-28 rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-primary-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {percent}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-700">
                      <Link
                        href={`/stats/${user.id}${selectedWeeks[0] ? `?week=${selectedWeeks[0].start_date}` : ""}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="size-4.5 mb-1"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                          />
                        </svg>
                        الإحصائيات
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
