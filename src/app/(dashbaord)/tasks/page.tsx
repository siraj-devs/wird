import { getUserTasks } from "@/actions";
import ShowCategoriesWithTasks from "@/components/show-categorieswithtasks";
import { checkRole } from "@/lib/auth-server";
import { ROLES } from "@/lib/roles";

export default async function Page() {
  const user = await checkRole([ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER]);

  const today = new Date();
  const currentDate = today.getDate();

  const daysToShow = Array.from({ length: 7 }, (_, i) => {
    const dayOffset = i - 3;
    const date = new Date(today);
    date.setDate(currentDate + dayOffset);

    return {
      date: date.getDate(),
      day: date.toLocaleDateString("ar-EG", { weekday: "short" }),
      isToday: dayOffset === 0,
      isFuture: date > today,
    };
  });

  const tasks = await getUserTasks(user.id);

  const categories = Object.entries(
    tasks.reduce((groups: Record<string, typeof tasks>, task) => {
      const category = task.category ?? "";
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
      completed: tasks.filter((task) => task.completed_at !== null).length,
      total: tasks.length,
      tasks: tasks,
    }));

  return (
    <div className="flex w-full flex-1 flex-col gap-8">
      <div className="fixed top-16 left-0 z-30 mx-auto flex w-full justify-center gap-2 bg-white/95 py-6 shadow-2xs">
        {daysToShow.map((day, id) => (
          <div
            key={id}
            className="flex flex-col items-center justify-center gap-1"
          >
            <span
              className={`text-sm ${
                day.isToday ? "text-primary-500" : "text-neutral-400"
              }`}
            >
              {day.day}
            </span>
            <span
              className={`flex flex-col items-center justify-center rounded-md px-7 py-1 text-lg font-bold ${
                day.isToday
                  ? "border-2 border-white bg-primary-500 text-white outline-2 outline-primary-500"
                  : "bg-gray-50"
              } ${
                day.isFuture
                  ? "text-neutral-300"
                  : day.isToday
                    ? "text-white"
                    : "text-neutral-500"
              }`}
            >
              {day.date}
            </span>
          </div>
        ))}
      </div>

      <ShowCategoriesWithTasks categories={categories} tasks={tasks} />
    </div>
  );
}
