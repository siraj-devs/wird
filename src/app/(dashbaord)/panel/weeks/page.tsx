import {
  getAllWeeksWithTasks,
  getCategories,
  getCurrentAndNextWeeksTasks,
  getTasks,
  getUsers,
} from "@/actions";
import ManageWeekTasks from "@/components/manage-week-tasks";
import { ALL_DAYS } from "@/lib";
import { checkRole } from "@/lib/auth-server";
import { ROLES } from "@/lib/roles";

const toArabicRange = (startDate: string) => {
  const start = new Date(`${startDate}T00:00:00`);
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

export default async function Page() {
  await checkRole([ROLES.OWNER]);

  const [categories, tasks, weeksWithTasks, weeks, users] = await Promise.all([
    getCategories(),
    getTasks(),
    getAllWeeksWithTasks(),
    getCurrentAndNextWeeksTasks(),
    getUsers(),
  ]);

  return (
    <div className="ds-page">
      <ManageWeekTasks
        weeks={weeks}
        tasks={tasks}
        categories={categories}
        users={users}
      />

      {weeksWithTasks.length === 0 ? (
        <section className="ds-card">
          <p className="text-sm text-gray-500">لا توجد أسابيع حتى الآن.</p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {weeksWithTasks.map(({ week, tasks }) => (
            <article key={week.id} className="ds-card-soft space-y-3">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-gray-900">
                  {toArabicRange(week.start_date)}
                </p>
                <span className="ds-badge-primary">{tasks.length} مهمة</span>
              </div>

              {tasks.length === 0 ? (
                <p className="text-sm text-gray-500">
                  لا توجد مهام لهذا الأسبوع.
                </p>
              ) : (
                <ul className="space-y-2">
                  {tasks.map((task) => (
                    <li
                      key={task.id}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-gray-800">
                          {task.task_name}
                        </span>
                        {task.category_name && (
                          <span className="ds-badge">{task.category_name}</span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {task.task_days?.length ?? ALL_DAYS.length} أيام
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
