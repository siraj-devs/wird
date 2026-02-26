"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "./ui/Button";

export default function ShowCategoriesWithTasks({
  categories,
  tasks,
}: {
  categories: Awaited<
    {
      name: string;
      completed: number;
      total: number;
      tasks: UserTask[];
    }[]
  >;
  tasks: Awaited<UserTask[]>;
}) {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const initialState = useMemo(
    () => new Map(tasks.map((task) => [task.id, !!task.completed_at])),
    [tasks],
  );

  const [checkedTasks, setCheckedTasks] = useState<Map<string, boolean>>(
    new Map(initialState),
  );

  const hasChanges = useMemo(() => {
    for (const [taskId, isChecked] of checkedTasks) {
      if (initialState.get(taskId) !== isChecked) {
        return true;
      }
    }
    return false;
  }, [checkedTasks, initialState]);

  const handleCheckboxChange = (taskId: string, checked: boolean) => {
    setCheckedTasks((prev) => {
      const newMap = new Map(prev);
      newMap.set(taskId, checked);
      return newMap;
    });
  };

  const resetHandler = () => {
    setCheckedTasks(new Map(initialState));
  };

  const saveHandler = async () => {
    setSaving(true);

    try {
      const checkedTaskIds = Array.from(checkedTasks.entries())
        .filter(([_, isChecked]) => isChecked)
        .map(([taskId, _]) => taskId);

      const response = await fetch("/api/user-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taskIds: checkedTaskIds }),
      });

      if (!response.ok) throw new Error("Failed to save tasks");

      router.refresh();
    } catch (error) {
      console.error("Error saving tasks:", error);
      resetHandler();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid flex-1 gap-8 pt-24 md:grid-cols-2">
      {categories.map((category, index) => (
        <div
          key={index}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg"
        >
          <div className="flex flex-col gap-2">
            {category.name && (
              <div className="flex items-center justify-between">
                <h5 className="text-lg font-semibold">{category.name}</h5>
                <h6
                  className={`rounded-xl px-3 py-0.5 text-xs ${
                    category.completed === category.total
                      ? "bg-yellow-100 text-yellow-900"
                      : category.completed >= category.total / 2
                        ? "bg-orange-100 text-orange-900"
                        : "bg-red-100 text-red-900"
                  }`}
                >
                  {category.completed}/{category.total}
                </h6>
              </div>
            )}
            <div className="flex flex-col gap-2 rounded-md p-1">
              {category.tasks.map((task, _) => (
                <label
                  key={task.id}
                  htmlFor={`check-${task.id}`}
                  className="inline-flex cursor-pointer items-center gap-4 rounded-lg border border-gray-100 bg-gray-50 px-2 py-3 hover:border-primary-200 has-checked:border-green-100 has-checked:bg-green-50 has-checked:text-green-900"
                >
                  <div className="relative flex items-center">
                    <input
                      checked={checkedTasks.get(task.id) || false}
                      type="checkbox"
                      className="peer size-5 appearance-none rounded border border-slate-300 transition-all checked:border-green-600 checked:bg-green-600"
                      id={`check-${task.id}`}
                      onChange={(e) =>
                        handleCheckboxChange(task.id, e.target.checked)
                      }
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
        </div>
      ))}

      {hasChanges && (
        <div className="fixed right-0 bottom-0 left-0 z-50 flex justify-center px-4 pb-6">
          <div className="flex w-1/2 items-center justify-between gap-4 rounded-lg border border-gray-200 px-6 py-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-full bg-amber-200 font-extrabold text-amber-800">
                !
              </span>
              <span className="font-medium">
                حذر — لديك تغييرات غير محفوظة!
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={resetHandler}
                disabled={saving}
                variant="ghost"
                className="text-sm"
              >
                إعادة تعيين
              </Button>
              <Button
                onClick={saveHandler}
                disabled={saving}
                variant="success"
                className="text-sm"
              >
                {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
