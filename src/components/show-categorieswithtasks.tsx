"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/Button";

type CategoryGroup = {
  name: string;
  completed: number;
  total: number;
  tasks: UserTask[];
};

type ProgramSection = {
  programId: string;
  programName: string;
  weekNumber: number | null;
  hasActiveWeek: boolean;
  categories: CategoryGroup[];
  friendProgress?: UserProgramFriendProgress[];
};

export default function ShowCategoriesWithTasks({
  categories,
  programSections,
  tasks,
  selectedDateKey,
  canEditSelectedDate,
  isPastSelectedDate,
  hasProgramBanner = false,
}: {
  categories?: CategoryGroup[];
  programSections?: ProgramSection[];
  tasks: UserTask[];
  selectedDateKey: string;
  canEditSelectedDate: boolean;
  isPastSelectedDate: boolean;
  hasProgramBanner?: boolean;
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

  useEffect(() => {
    setCheckedTasks(new Map(initialState));
  }, [initialState, selectedDateKey]);

  const hasChanges = useMemo(() => {
    if (!canEditSelectedDate) return false;

    for (const [taskId, isChecked] of checkedTasks) {
      if (initialState.get(taskId) !== isChecked) {
        return true;
      }
    }
    return false;
  }, [canEditSelectedDate, checkedTasks, initialState]);

  const handleCheckboxChange = (taskId: string, checked: boolean) => {
    if (!canEditSelectedDate) return;

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
      const completedTasks = Array.from(checkedTasks.entries())
        .filter(([, isChecked]) => isChecked)
        .map(([programTaskId]) => {
          return {
            program_task_id: programTaskId,
          };
        });

      const response = await fetch("/api/program-task-completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tasks: completedTasks,
          target_date: selectedDateKey,
        }),
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

  const renderCategoryCards = (categoryList: CategoryGroup[]) =>
    categoryList.map((category, index) => (
      <div
        key={`${category.name}-${index}`}
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
            {category.tasks.map((task) => (
              <label
                key={task.id}
                htmlFor={`check-${task.id}`}
                className={`inline-flex items-center gap-4 rounded-lg border border-gray-100 bg-gray-50 px-2 py-3 has-checked:border-green-100 has-checked:bg-green-50 has-checked:text-green-900 ${
                  isPastSelectedDate
                    ? "cursor-default"
                    : "cursor-pointer hover:border-primary-200"
                }`}
              >
                <div className="relative flex items-center">
                  <input
                    checked={checkedTasks.get(task.id) || false}
                    type="checkbox"
                    disabled={!canEditSelectedDate}
                    className="peer size-5 appearance-none rounded border border-slate-300 transition-all checked:border-green-600 checked:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
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
                {task.task_name}
              </label>
            ))}
          </div>
        </div>
      </div>
    ));

  const sectionsToRender =
    programSections ??
    (categories
      ? [
          {
            programId: "default",
            programName: "",
            weekNumber: null,
            hasActiveWeek: true,
            categories,
          },
        ]
      : []);

  const isEmpty = sectionsToRender.length === 0;

  return (
    <div
      className={`flex flex-1 flex-col gap-8 ${hasProgramBanner ? "pt-4" : "pt-24"}`}
    >
      {!canEditSelectedDate && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          هذا اليوم للعرض فقط. يمكن تسجيل المهام لليوم الحالي أو يوم أمس فقط.
        </div>
      )}

      {isEmpty ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500">لا توجد مهام لهذا اليوم.</p>
        </div>
      ) : (
        sectionsToRender.map((section) => {
          const sectionCompleted = section.categories.reduce(
            (sum, category) => sum + category.completed,
            0,
          );
          const sectionTotal = section.categories.reduce(
            (sum, category) => sum + category.total,
            0,
          );

          return (
            <section key={section.programId} className="space-y-4">
              {section.programName && (
                <div className="rounded-xl border border-primary-200 bg-linear-to-l from-primary-50 to-white px-4 py-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-primary-900">
                        {section.programName}
                      </h2>
                      {section.weekNumber != null && (
                        <p className="mt-0.5 text-xs text-primary-700">
                          الأسبوع {section.weekNumber}
                        </p>
                      )}
                    </div>
                    {sectionTotal > 0 && (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          sectionCompleted === sectionTotal
                            ? "bg-yellow-100 text-yellow-900"
                            : sectionCompleted >= sectionTotal / 2
                              ? "bg-orange-100 text-orange-900"
                              : "bg-red-100 text-red-900"
                        }`}
                      >
                        {sectionCompleted}/{sectionTotal}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {section.categories.length > 0 && (
                <div className="grid gap-6 md:grid-cols-2">
                  {renderCategoryCards(section.categories)}
                </div>
              )}
            </section>
          );
        })
      )}

      {hasChanges && (
        <div className="fixed right-0 bottom-0 left-0 z-50 mx-auto mb-4 flex max-w-3xl justify-center sm:mb-6">
          <div className="w-full rounded-lg border border-gray-200 bg-white p-3 shadow-xs sm:px-6 sm:py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-full bg-amber-200 font-extrabold text-amber-800">
                  !
                </span>
                <span className="font-medium">لديك تغييرات غير محفوظة!</span>
              </div>

              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-3">
                <Button
                  onClick={resetHandler}
                  disabled={saving}
                  variant="ghost"
                  className="w-full text-sm sm:w-auto"
                >
                  إعادة تعيين
                </Button>
                <Button
                  onClick={saveHandler}
                  disabled={saving}
                  variant="success"
                  className="w-full text-sm sm:w-auto"
                >
                  {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
