import { getAllWeeksWithTasks } from "@/actions";
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

  const weeksWithTasks = await getAllWeeksWithTasks();

  return (
    <div className="ds-page">
      <section className="ds-card">
        <div className="ds-section-header mb-0">
          <div>
            <h1 className="ds-title">كل أسابيع البرنامج</h1>
            <p className="ds-subtitle">
              عرض جميع الأسابيع مع المهام المرتبطة بكل أسبوع.
            </p>
          </div>

          <p className="flex items-start">
            <span className="ds-badge-primary text-nowrap">
              {weeksWithTasks.length} أسابيع
            </span>
          </p>
        </div>
      </section>

      {weeksWithTasks.length === 0 ? (
        <section className="ds-card">
          <p className="text-sm text-gray-500">لا توجد أسابيع حتى الآن.</p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {weeksWithTasks.map(({ week, tasks }) => (
            <article key={week.id} className="ds-card-soft space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    أسبوع يبدأ من{" "}
                    {new Date(`${week.start_date}T00:00:00`).toLocaleDateString(
                      "ar-MA",
                    )}
                  </h2>
                  <p className="ds-subtitle">
                    {toArabicRange(week.start_date)}
                  </p>
                </div>
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
                        <span className="ds-badge">
                          {task.category_name || "بدون فئة"}
                        </span>
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
