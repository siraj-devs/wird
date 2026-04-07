import { checkRole } from "@/lib/auth-server";
import { ROLES } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { redirect } from "next/navigation";

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

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ week?: string }>;
}) {
  const currentUser = await checkRole([ROLES.ADMIN, ROLES.OWNER, ROLES.MEMBER]);
  const [{ id }, { week }] = await Promise.all([params, searchParams]);

  if (currentUser.role === ROLES.MEMBER) {
    const allowedIds = [currentUser.id, currentUser.friend_id].filter(Boolean);
    if (!allowedIds.includes(id)) redirect("/tasks");
  }

  const today = new Date();
  const requestedWeek = parseWeekDate(week);
  const weekStart = startOfWeek(requestedWeek ?? today);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // Get or create the week
  const { data: weekData } = await supabaseAdmin
    .from("weeks")
    .select("*")
    .eq("start_date", toDayKey(weekStart))
    .single();

  if (!weekData) redirect("/panel");

  // Get week tasks
  const { data: weekTasks, error: weekTasksError } = await supabaseAdmin
    .from("week_tasks")
    .select("*")
    .eq("week_id", weekData.id)
    .order("sort_order", { ascending: true });

  if (weekTasksError || !weekTasks) redirect("/panel");

  // Get user completions for this week
  const { data: completions } = await supabaseAdmin
    .from("user_tasks")
    .select("*")
    .eq("user_id", id)
    .in(
      "week_task_id",
      weekTasks.map((wt) => wt.id),
    );

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return date;
  });

  // Group completions by week_task_id and date
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

  const totalPossible = weekTasks.length * 7;
  const totalCompleted = Array.from(completionByTask.values()).reduce(
    (sum, days) => sum + days.size,
    0,
  );
  const achievementPercent =
    totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  const prevWeek = new Date(weekStart);
  prevWeek.setDate(prevWeek.getDate() - 7);
  const nextWeek = new Date(weekStart);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return (
    <div className="mx-auto space-y-6 p-6" dir="rtl">
      <div className="mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">
              {weekDays[0].toLocaleDateString("ar-MA", {
                month: "short",
                day: "numeric",
              })}{" "}
              -{" "}
              {weekDays[6].toLocaleDateString("ar-MA", {
                month: "short",
                day: "numeric",
              })}
            </h1>
            <p className="text-sm text-gray-500">ملخص المهام في أسبوع محدد</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">
              تم تحقيق {achievementPercent}%
            </div>
          </div>
        </div>

        <div className="h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-primary-500 transition-all"
            style={{ width: `${achievementPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <Link
            href={`/tasks/${id}?week=${toDayKey(nextWeek)}`}
            className="rounded-md border border-primary-200 px-3 py-1 text-sm text-primary-700 hover:bg-primary-50"
          >
            الأسبوع التالي
          </Link>
          <Link
            href={`/tasks/${id}?week=${toDayKey(prevWeek)}`}
            className="rounded-md border border-primary-200 px-3 py-1 text-sm text-primary-700 hover:bg-primary-50"
          >
            الأسبوع السابق
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="grid grid-cols-10 gap-2 border-b border-gray-200 bg-gray-50 p-4">
          <div className="col-span-2 text-sm font-medium text-gray-600"></div>
          {weekDays.map((date, index) => {
            const dayIndex = date.getDay();
            return (
              <div key={index} className="col-span-1 text-center">
                <div className="text-xs font-medium text-gray-600">
                  {dayNames[dayIndex]}
                </div>
                <div className="text-xs text-gray-500">{date.getDate()}</div>
              </div>
            );
          })}
        </div>

        <div className="divide-y divide-gray-100">
          {weekTasks.length === 0 && (
            <p className="p-6 text-center text-sm text-gray-500">
              لا توجد مهام في هذا الأسبوع.
            </p>
          )}

          {weekTasks.map((weekTask) => {
            const completedDays =
              completionByTask.get(weekTask.id) ?? new Set();

            return (
              <div
                key={weekTask.id}
                className="grid grid-cols-10 gap-2 p-4 transition-colors"
              >
                <div className="col-span-2 flex items-center">
                  <span className="truncate text-sm font-medium">
                    {weekTask.task_name}
                  </span>
                </div>

                {weekDays.map((date, dayIndex) => {
                  const dateKey = toDayKey(date);
                  const isCompleted = completedDays.has(dateKey);

                  return (
                    <div
                      key={dayIndex}
                      className="col-span-1 flex items-center justify-center"
                    >
                      <div
                        className={`h-8 w-8 rounded transition-all ${
                          isCompleted
                            ? "bg-primary-500 hover:bg-primary-600"
                            : "bg-primary-100"
                        }`}
                      />
                    </div>
                  );
                })}

                <div className="col-span-1 flex items-center justify-center">
                  <span className="text-xs text-gray-500">
                    {completedDays.size}/{7}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center text-sm text-gray-600">
        أكملت {totalCompleted} من أصل {totalPossible} خلال هذا الأسبوع
      </div>
    </div>
  );
}
