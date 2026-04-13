import { getUserTasks } from "@/actions";
import ShowCategoriesWithTasks from "@/components/show-categorieswithtasks";
import { checkRole } from "@/lib/auth-server";
import { ROLES } from "@/lib/roles";
import Link from "next/link";

const isDateKey = (value?: string): value is string => {
  if (!value) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
};

const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await checkRole([ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER]);
  const { date } = await searchParams;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDateKey = toDateKey(today);

  const daysToShow = Array.from({ length: 7 }, (_, i) => {
    const dayOffset = i - 3;
    const value = new Date(today);
    value.setDate(value.getDate() + dayOffset);

    return {
      date: value.getDate(),
      day: value.toLocaleDateString("ar-EG", { weekday: "short" }),
      dateKey: toDateKey(value),
      value,
      isToday: dayOffset === 0,
      isFuture: dayOffset > 0,
    };
  });

  const allowedDateKeys = new Set(
    daysToShow.filter((day) => !day.isFuture).map((day) => day.dateKey),
  );
  const selectedDateKey =
    isDateKey(date) && allowedDateKeys.has(date) ? date : todayDateKey;
  const selectedDate =
    daysToShow.find((day) => day.dateKey === selectedDateKey)?.value ?? today;

  const diffInDays = Math.round(
    (today.getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const isPastSelectedDate = diffInDays > 1;
  const canEditSelectedDate = diffInDays === 0 || diffInDays === 1;

  const tasks = await getUserTasks(user.id, selectedDate);

  const categories = Object.entries(
    tasks.reduce((groups: Record<string, typeof tasks>, task) => {
      const category = task.category_name || "";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(task);
      return groups;
    }, {}),
  )
    .sort(([keyA], [keyB]) => {
      if (keyA === "") return 1;
      if (keyB === "") return -1;
      return 0;
    })
    .map(([name, tasks]) => ({
      name,
      completed: tasks.filter((task) => task.completed_at !== null && task.completed_at !== "").length,
      total: tasks.length,
      tasks: tasks,
    }));

  return (
    <div className="flex w-full flex-1 flex-col gap-8">
      <div className="fixed top-16 left-0 z-30 mx-auto flex w-full justify-center gap-2 bg-white/95 py-6 shadow-2xs">
        {daysToShow.map((day, id) => (
          day.isFuture ? (
            <div
              key={id}
              aria-disabled="true"
              className="flex cursor-not-allowed flex-col items-center justify-center gap-1 opacity-70"
            >
              <span className="text-sm text-neutral-300">{day.day}</span>
              <span className="flex flex-col items-center justify-center rounded-md bg-gray-50 px-7 py-1 text-lg font-bold text-neutral-300">
                {day.date}
              </span>
            </div>
          ) : (
            <Link
              key={id}
              href={day.isToday ? "/tasks" : `/tasks?date=${day.dateKey}`}
              className="flex flex-col items-center justify-center gap-1"
            >
              <span
                className={`text-sm ${
                  day.dateKey === selectedDateKey
                    ? "text-primary-500"
                    : "text-neutral-400"
                }`}
              >
                {day.day}
              </span>
              <span
                className={`flex flex-col items-center justify-center rounded-md px-7 py-1 text-lg font-bold ${
                  day.dateKey === selectedDateKey
                    ? "border-2 border-white bg-primary-500 text-white outline-2 outline-primary-500"
                    : "bg-gray-50"
                }`}
              >
                {day.date}
              </span>
            </Link>
          )
        ))}
      </div>

      <ShowCategoriesWithTasks
        categories={categories}
        tasks={tasks}
        selectedDateKey={selectedDateKey}
        canEditSelectedDate={canEditSelectedDate}
        isPastSelectedDate={isPastSelectedDate}
      />
    </div>
  );
}
