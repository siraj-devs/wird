import { getTasks } from "@/actions";
import { checkRole } from "@/lib/auth-server";
import { ROLES } from "@/lib/roles";

export default async function Page() {
  await checkRole([ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER]);

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

  const tasks = await getTasks();

  const groups = Object.fromEntries(
    Object.entries(
      tasks.reduce((groups: Record<string, typeof tasks>, task) => {
        const category = task.categories?.name || "";
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(task);
        return groups;
      }, {}),
    ).sort(([keyA], [keyB]) => {
      if (keyA === "") return 1;
      if (keyB === "") return -1;
      return 0;
    }),
  );

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
                day.isToday ? "text-indigo-500" : "text-neutral-400"
              }`}
            >
              {day.day}
            </span>
            <span
              className={`flex flex-col items-center justify-center rounded-md px-7 py-1 text-lg font-bold ${
                day.isToday
                  ? "border-2 border-white bg-indigo-500 text-white outline-2 outline-indigo-500"
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
      <div className="flex flex-1 flex-col gap-8 pt-24">
        {Object.entries(groups).map(([category, tasks], index) => (
          <div key={index} className="flex flex-col gap-2">
            {category && (
              <div className="flex items-center justify-between">
                <h5 className="text-lg font-semibold">{category}</h5>
                {/* <h6
                  className={`text-xs px-4 py-0.5 rounded-xl ${
                    tasks.filter(({ completed }) => completed).length ===
                    tasks.length
                      ? "bg-yellow-100 text-yellow-900"
                      : tasks.filter(({ completed }) => completed).length === 3
                        ? "bg-orange-100 text-orange-900"
                        : "bg-red-100 text-red-900"
                  }`}
                >
                  {tasks.filter(({ completed }) => completed).length}/
                  {tasks.length}
                </h6> */}
              </div>
            )}
            <div className="flex flex-col gap-2 rounded-md p-1">
              {tasks.map((task, _) => (
                <label
                  key={task.id}
                  htmlFor={`check-${task.id}`}
                  className="inline-flex cursor-pointer items-center gap-4 rounded-lg border border-neutral-100 bg-neutral-50 px-2 py-3 hover:bg-neutral-100 has-checked:border-green-100 has-checked:bg-green-50 has-checked:text-green-900"
                >
                  <div className="relative flex items-center">
                    <input
                      // checked={completed}
                      type="checkbox"
                      className="peer size-5 appearance-none rounded border border-slate-300 transition-all checked:border-green-600 checked:bg-green-600"
                      id={`check-${task.id}`}
                      // onChange={() => {
                      //   console.log(`Task ${task.id} toggled`);
                      // setTasks((prevTasks) =>
                      //   prevTasks.map((group) => ({
                      //     ...group,
                      //     tasks: group.tasks.map((task) =>
                      //       task.id === id
                      //         ? { ...task, completed: !task.completed }
                      //         : task
                      //     ),
                      //   }))
                      // );
                      // }}
                    />
                    <span className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 transform text-white opacity-0 peer-checked:opacity-100">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="size-3.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="1"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </span>
                  </div>
                  {task.name}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
