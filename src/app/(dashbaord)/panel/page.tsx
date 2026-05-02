import { getCategories, getTasks, getUsers } from "@/actions";
import AddCategoryForm from "@/components/add-category-form";
import AddTaskForm from "@/components/add-task-form";
import ManageCategories from "@/components/manage-categoryies";
import ManageTasks from "@/components/manage-tasks";
import ManageUsers from "@/components/manage-users";
import { checkRole } from "@/lib/auth-server";
import { ROLES } from "@/lib/roles";
import Link from "next/link";

export default async function Page() {
  const { id } = await checkRole([ROLES.OWNER]);

  const [categories, tasks, users] = await Promise.all([
    getCategories(),
    getTasks(),
    getUsers(),
  ]);

  return (
    <div className="ds-page">
      <div className="grid grid-cols-7 gap-6">
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

        <section className="ds-card col-span-full lg:col-span-5">
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

      <section className="ds-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="ds-title mb-1">حضور الاجتماعات</h2>
            <p className="ds-subtitle">
              سجل حضور اجتماع الخميس الأسبوعي للأعضاء والأشخاص من خارج التطبيق.
            </p>
          </div>

          <Link
            href="/panel/meeting-attendance"
            className="inline-flex items-center rounded-lg border border-primary-200 px-3 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50"
          >
            فتح صفحة الحضور
          </Link>
        </div>
      </section>
    </div>
  );
}
