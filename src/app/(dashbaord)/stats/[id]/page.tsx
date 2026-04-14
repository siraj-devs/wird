import { checkRole } from "@/lib/auth-server";
import { ROLES } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase";
import Image from "next/image";
import { redirect } from "next/navigation";

const ALL_TASK_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

const dayNames = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
] as const;

function startOfWeek(date: Date): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  const day = value.getDay();
  const diffToSaturday = (day + 1) % 7;
  value.setDate(value.getDate() - diffToSaturday);
  return value;
}

function parseWeekDate(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function toDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getAppDayNumber(date: Date): number {
  return ((date.getDay() + 1) % 7) + 1;
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ week?: string; weekFrom?: string; weekTo?: string }>;
}) {
  const currentUser = await checkRole([ROLES.ADMIN, ROLES.OWNER, ROLES.MEMBER]);
  const [{ id }, { week, weekFrom, weekTo }] = await Promise.all([
    params,
    searchParams,
  ]);

  if (currentUser.role === ROLES.MEMBER) {
    const allowedIds = [currentUser.id, currentUser.friend_id].filter(Boolean);
    if (!allowedIds.includes(id)) redirect("/tasks");
  }

  const { data: viewedUser } = await supabaseAdmin
    .from("users")
    .select("id, username, full_name, avatar_url")
    .eq("id", id)
    .single();

  if (!viewedUser) redirect("/tasks");

  const today = new Date();
  const requestedFromWeek = parseWeekDate(weekFrom ?? week);
  const requestedToWeek = parseWeekDate(weekTo ?? week);
  const defaultWeekStart = startOfWeek(requestedFromWeek ?? today);

  const { data: allWeeks, error: allWeeksError } = await supabaseAdmin
    .from("weeks")
    .select("id, start_date")
    .order("start_date", { ascending: true });

  if (allWeeksError || !allWeeks || allWeeks.length === 0) redirect("/tasks");

  const availableWeekDates = allWeeks
    .map((weekItem) => parseWeekDate(weekItem.start_date))
    .filter((date): date is Date => date !== null);

  if (availableWeekDates.length === 0) redirect("/tasks");

  const getClosestWeek = (target: Date) =>
    availableWeekDates.reduce((best, candidate) => {
      const bestDistance = Math.abs(best.getTime() - target.getTime());
      const candidateDistance = Math.abs(
        candidate.getTime() - target.getTime(),
      );
      return candidateDistance < bestDistance ? candidate : best;
    }, availableWeekDates[0]);

  const requestedRangeStart = startOfWeek(defaultWeekStart);
  const requestedRangeEnd = startOfWeek(requestedToWeek ?? requestedRangeStart);

  const resolvedRangeStart = getClosestWeek(requestedRangeStart);
  const resolvedRangeEnd = getClosestWeek(requestedRangeEnd);

  let rangeStart = resolvedRangeStart;
  let rangeEnd = resolvedRangeEnd;

  if (rangeStart.getTime() > rangeEnd.getTime()) {
    const swap = rangeStart;
    rangeStart = rangeEnd;
    rangeEnd = swap;
  }

  const rangeStartKey = toDayKey(rangeStart);
  const rangeEndKey = toDayKey(rangeEnd);

  const selectedWeeks = allWeeks.filter(
    (weekItem) =>
      weekItem.start_date >= rangeStartKey &&
      weekItem.start_date <= rangeEndKey,
  );

  if (selectedWeeks.length === 0) redirect("/tasks");

  const selectedWeekIds = selectedWeeks.map((weekItem) => weekItem.id);
  const selectedWeekById = new Map(
    selectedWeeks.map((weekItem) => [weekItem.id, weekItem]),
  );

  const { data: weekTasks, error: weekTasksError } = await supabaseAdmin
    .from("week_tasks")
    .select("*")
    .in("week_id", selectedWeekIds)
    .order("week_id", { ascending: true })
    .order("sort_order", { ascending: true });

  if (weekTasksError || !weekTasks) redirect("/tasks");

  const { data: completions } = await supabaseAdmin
    .from("user_tasks")
    .select("*")
    .eq("user_id", id)
    .in(
      "week_task_id",
      weekTasks.map((wt) => wt.id),
    );

  const rangeDays = selectedWeeks.flatMap((weekItem) => {
    const weekStart = parseWeekDate(weekItem.start_date);
    if (!weekStart) return [] as Date[];

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return date;
    });
  });

  const completionByTask = new Map<string, Set<string>>();

  for (const completion of completions ?? []) {
    const taskId = completion.week_task_id;
    if (!taskId) continue;

    const completedDate = new Date(completion.completed_at);
    const key = toDayKey(completedDate);

    if (!completionByTask.has(taskId)) {
      completionByTask.set(taskId, new Set());
    }

    completionByTask.get(taskId)?.add(key);
  }

  const tasksWithStats = weekTasks.map((weekTask) => {
    const weekRow = selectedWeekById.get(weekTask.week_id);
    const weekStart = parseWeekDate(weekRow?.start_date);
    const weekDays = weekStart
      ? Array.from({ length: 7 }, (_, i) => {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + i);
          return date;
        })
      : [];

    const assignedDays =
      weekTask.task_days && weekTask.task_days.length > 0
        ? weekTask.task_days
        : [...ALL_TASK_DAYS];
    const assignedKeys = new Set(
      weekDays
        .filter((date) => assignedDays.includes(getAppDayNumber(date)))
        .map((date) => toDayKey(date)),
    );

    const completedKeys =
      completionByTask.get(weekTask.id) ?? new Set<string>();
    const completedCount = Array.from(assignedKeys).filter((key) =>
      completedKeys.has(key),
    ).length;

    const percent =
      assignedKeys.size > 0
        ? Math.round((completedCount / assignedKeys.size) * 100)
        : 0;

    return {
      weekTask,
      assignedKeys,
      completedKeys,
      assignedCount: assignedKeys.size,
      completedCount,
      percent,
    };
  });

  const totalPossible = tasksWithStats.reduce(
    (sum, taskStats) => sum + taskStats.assignedCount,
    0,
  );
  const totalCompleted = tasksWithStats.reduce(
    (sum, taskStats) => sum + taskStats.completedCount,
    0,
  );
  const achievementPercent =
    totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  const dayStats = rangeDays.map((date) => {
    const dateKey = toDayKey(date);
    const dayName = dayNames[date.getDay()];

    const assignedTasks = tasksWithStats.filter((taskStats) =>
      taskStats.assignedKeys.has(dateKey),
    );

    const completedTasks = assignedTasks.filter((taskStats) =>
      taskStats.completedKeys.has(dateKey),
    ).length;

    const completionPercent =
      assignedTasks.length > 0
        ? Math.round((completedTasks / assignedTasks.length) * 100)
        : 0;

    return {
      date,
      dateKey,
      dayName,
      assignedTasks: assignedTasks.length,
      completedTasks,
      completionPercent,
    };
  });

  const maxAssignedTasks = Math.max(
    ...dayStats.map((day) => day.assignedTasks),
    1,
  );

  const dayStatsByKey = new Map(dayStats.map((day) => [day.dateKey, day]));

  const topTasks = [...tasksWithStats]
    .sort((left, right) => {
      if (right.percent !== left.percent) return right.percent - left.percent;
      if (right.completedCount !== left.completedCount) {
        return right.completedCount - left.completedCount;
      }
      return left.weekTask.task_name.localeCompare(
        right.weekTask.task_name,
        "ar",
      );
    })
    .slice(0, 3);

  const busiestDay = [...dayStats].sort(
    (left, right) => right.completedTasks - left.completedTasks,
  )[0];

  const strongestTask = topTasks[0] ?? null;

  const rangeLabel = `${rangeDays[0].toLocaleDateString("ar-MA", {
    month: "short",
    day: "numeric",
  })} - ${rangeDays[rangeDays.length - 1].toLocaleDateString("ar-MA", {
    month: "short",
    day: "numeric",
  })}`;

  const formatWeekOptionLabel = (startDateKey: string) => {
    const weekStart = parseWeekDate(startDateKey);
    if (!weekStart) return startDateKey;
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return `${weekStart.toLocaleDateString("ar-MA", {
      month: "short",
      day: "numeric",
    })} - ${weekEnd.toLocaleDateString("ar-MA", {
      month: "short",
      day: "numeric",
    })}`;
  };

  const linkForRange = (targetStart: Date, targetEnd: Date) =>
    `/stats/${id}?weekFrom=${toDayKey(targetStart)}&weekTo=${toDayKey(targetEnd)}`;

  return (
    <div className="ds-page">
      <section className="ds-card space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">إحصائيات المستخدم</p>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {viewedUser.avatar_url ? (
                  <Image
                    src={viewedUser.avatar_url}
                    alt={viewedUser.username}
                    width={36}
                    height={36}
                    className="size-9 rounded-full"
                  />
                ) : (
                  <div className="flex size-9 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-700">
                    {viewedUser.username.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-gray-900">
                    {viewedUser.full_name ?? viewedUser.username}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    @{viewedUser.username}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="mt-1 text-end text-lg font-bold text-gray-900">
              {rangeLabel}
            </h1>

            <form method="get" className="flex flex-wrap items-end gap-2">
              <label className="flex min-w-44 flex-col gap-1 text-xs font-medium text-gray-600">
                من أسبوع
                <select
                  name="weekFrom"
                  defaultValue={rangeStartKey}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-primary-300 focus:outline-none"
                >
                  {[...allWeeks].reverse().map((weekItem) => (
                    <option
                      key={`from-${weekItem.id}`}
                      value={weekItem.start_date}
                    >
                      {formatWeekOptionLabel(weekItem.start_date)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex min-w-44 flex-col gap-1 text-xs font-medium text-gray-600">
                إلى أسبوع
                <select
                  name="weekTo"
                  defaultValue={rangeEndKey}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-primary-300 focus:outline-none"
                >
                  {[...allWeeks].reverse().map((weekItem) => (
                    <option
                      key={`to-${weekItem.id}`}
                      value={weekItem.start_date}
                    >
                      {formatWeekOptionLabel(weekItem.start_date)}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
              >
                عرض النطاق
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_55%)]" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-gray-500">
                نسبة الإكمال للنطاق
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {achievementPercent}%
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {totalCompleted} من أصل {totalPossible}
              </p>
            </div>

            <div
              className="grid size-16 place-items-center rounded-full"
              style={{
                background: `conic-gradient(var(--color-primary-500) ${achievementPercent}%, #e5e7eb 0)`,
              }}
            >
              <div className="grid size-11 place-items-center rounded-full bg-white text-sm font-bold text-gray-900">
                {achievementPercent}%
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">أقوى يوم</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-bold text-gray-900">
                {busiestDay?.dayName ?? "-"}
              </p>
              <p className="text-sm text-gray-500">
                {busiestDay
                  ? `${busiestDay.assignedTasks} مهمة`
                  : "لا توجد بيانات"}
              </p>
            </div>
            <div className="rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-700">
              {busiestDay
                ? `${
                    busiestDay.assignedTasks > 0
                      ? Math.round(
                          (busiestDay.completedTasks /
                            busiestDay.assignedTasks) *
                            100,
                        )
                      : 0
                  }%`
                : "0%"}
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">أفضل مهمة</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-gray-900">
                {strongestTask?.weekTask.task_name ?? "-"}
              </p>
              <p className="text-sm text-gray-500">
                {strongestTask
                  ? `${strongestTask.assignedCount} أيام`
                  : "لا توجد بيانات"}
              </p>
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
              {strongestTask ? `${strongestTask.percent}%` : "0%"}
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <article className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                حمولة المهام حسب الأيام
              </p>
              <p className="text-xs text-gray-500">
                ارتفاع العمود يعكس عدد المهام المخصصة لذلك اليوم.
              </p>
            </div>
          </div>

          <div className="max-w-full overflow-x-auto">
            <div
              className="grid w-max min-w-full gap-2 sm:gap-3"
              style={{
                gridTemplateColumns: `repeat(${Math.max(dayStats.length, 1)}, minmax(64px, 1fr))`,
              }}
            >
              {dayStats.map((day) => {
                const softBarHeight =
                  (day.assignedTasks / maxAssignedTasks) * 100;
                const barHeight =
                  day.assignedTasks > 0
                    ? (day.completedTasks / day.assignedTasks) * 100
                    : 0;
                const isCompleted =
                  day.assignedTasks > 0 &&
                  day.completedTasks === day.assignedTasks;

                return (
                  <div
                    key={day.dateKey}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="flex h-48 w-full items-end rounded-2xl bg-gray-50 sm:h-56">
                      <div
                        className="flex h-full w-full items-end justify-center rounded-2xl bg-[linear-gradient(180deg,rgba(59,130,246,0.06),rgba(59,130,246,0.01))] p-1"
                        style={{ height: `${softBarHeight}%` }}
                      >
                        <div
                          className={`relative w-full rounded-2xl bg-linear-to-t shadow-sm transition-all ${
                            isCompleted
                              ? "from-amber-500 to-amber-300"
                              : "from-primary-600 to-primary-400"
                          }`}
                          style={{ height: `${barHeight}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-xs font-medium text-gray-600">
                        {day.dayName}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {day.date.getDate()}
                      </p>
                    </div>

                    <div className="rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold text-primary-700">
                      {day.completedTasks}/{day.assignedTasks}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </article>

        <article className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-900">
              أعلى المهام التزامًا
            </p>
            <p className="text-xs text-gray-500">
              أفضل الأداءات خلال النطاق المحدد.
            </p>
          </div>

          <div className="space-y-3">
            {topTasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">
                لا توجد مهام للعرض.
              </p>
            ) : (
              topTasks.map((task, index) => (
                <div
                  key={task.weekTask.id}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex gap-2">
                        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                          {index + 1}
                        </span>

                        <div>
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {task.weekTask.task_name}
                          </p>
                          <p className="mt- text-xs text-gray-500">
                            {task.completedCount}/{task.assignedCount} إنجازات
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm">
                      {task.percent}%
                    </span>
                  </div>

                  <div className="mt-3 h-2 rounded-full bg-white">
                    <div
                      className="h-2 rounded-full bg-linear-to-r from-primary-600 to-primary-400"
                      style={{ width: `${task.percent}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
