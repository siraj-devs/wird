import {
  getCategories,
  getCurrentAndNextWeeksTasks,
  getTasks,
  getUsers,
} from "@/actions";
import AddCategoryForm from "@/components/add-category-form";
import AddTaskForm from "@/components/add-task-form";
import ManageCategories from "@/components/manage-categoryies";
import ManageTasks from "@/components/manage-tasks";
import ManageUsers from "@/components/manage-users";
import ManageWeekTasks from "@/components/manage-week-tasks";
import { checkRole } from "@/lib/auth-server";
import { ROLES } from "@/lib/roles";

export default async function Page() {
  const { id } = await checkRole([ROLES.OWNER, ROLES.ADMIN]);

  const [categories, tasks, users, weeksWithTasks] = await Promise.all([
    getCategories(),
    getTasks(),
    getUsers(),
    getCurrentAndNextWeeksTasks(),
  ]);

  return (
    <div className="ds-page">
      <ManageWeekTasks
        weeks={weeksWithTasks}
        tasks={tasks}
        categories={categories}
      />

      <div className="grid grid-cols-5 gap-6">
        <section className="ds-card col-span-full lg:col-span-2">
          <div className="ds-section-header flex-row">
            <div>
              <h2 className="ds-title">الفئات</h2>
              <p className="ds-subtitle">
                تعريف مجموعات المهام المستخدمة داخل البرنامج.
              </p>
            </div>
            <AddCategoryForm />
          </div>
          <ManageCategories categories={categories} />
        </section>

        <section className="ds-card col-span-full lg:col-span-3">
          <div className="ds-section-header flex-row">
            <div>
              <h2 className="ds-title">المهام</h2>
              <p className="ds-subtitle">
                إدارة مكتبة المهام التي يتم توزيعها على أسابيع البرنامج.
              </p>
            </div>
            <AddTaskForm categories={categories} />
          </div>

          <ManageTasks tasks={tasks} categories={categories} />
        </section>
      </div>

      <section className="ds-card">
        <h2 className="ds-title mb-1">المستخدمون</h2>
        <p className="ds-subtitle mb-6">
          مراقبة الأعضاء وتعديل الأدوار داخل البرنامج. يتم تعيين الصديق من خلال
          لوحة الإدارة.
        </p>
        <ManageUsers id={id} users={users} />
      </section>
    </div>
  );
}
