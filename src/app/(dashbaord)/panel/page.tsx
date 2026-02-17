import { getCategories, getTasks } from "@/actions";
import AddCategoryForm from "@/components/add-category-form";
import AddTaskForm from "@/components/add-task-form";
import ManageCategories from "@/components/manage-categoryies";
import ManageTasks from "@/components/manage-tasks";

export default async function Page() {
  const [categories, tasks] = await Promise.all([getCategories(), getTasks()]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="mb-6 flex flex-col items-center justify-between gap-4 md:flex-row">
          <h2 className="text-2xl font-bold text-gray-900">الفئات</h2>
          <AddCategoryForm />
        </div>
        <ManageCategories categories={categories} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="mb-6 flex flex-col items-center justify-between gap-4 md:flex-row">
          <h2 className="text-2xl font-bold text-gray-900">المهام</h2>
          <AddTaskForm categories={categories} />
        </div>

        <ManageTasks tasks={tasks} categories={categories} />
      </div>
    </div>
  );
}
