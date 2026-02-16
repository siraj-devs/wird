import { getCategories, getTasks } from "@/actions";
import AddCategoryForm from "@/components/add-category-form";
import AddTaskForm from "@/components/add-task-form";
import ManageCategories from "@/components/manage-categoryies";

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

        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody className="divide-y divide-gray-100">
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="transition-colors hover:bg-gray-50/50"
                >
                  <td className="w-2/3 px-6 py-4">
                    <span className="font-semibold text-gray-900">
                      {task.name}
                    </span>
                  </td>
                  <td className="w-1/3 px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {task.categories?.name ? (
                        <span className="inline-flex items-center rounded-lg bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                          {task.categories?.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-lg bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                          بدون تصنيف
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center rounded-lg px-3 py-1 text-sm font-medium ${task.is_regular ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}
                      >
                        {task.is_regular ? "مهمة منتظمة" : "مهمة غير منتظمة"}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
