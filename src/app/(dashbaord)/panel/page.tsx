import { getCategories, getTasks } from "@/actions";
import AddCategoryForm from "@/components/add-category-form";
import AddTaskForm from "@/components/add-task-form";
import ManageCategories from "@/components/manage-categoryies";
import ManageTasks from "@/components/manage-tasks";

export default async function Page() {
  const [categories, tasks] = await Promise.all([
    getCategories(),
    getTasks(),
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
    </div>
  );
}
