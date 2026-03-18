"use client";

import { ALL_DAYS } from "@/lib";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "./ui/Button";

export default function ManageWeekTasks({
  weeks,
  tasks,
  categories,
}: {
  weeks: {
    label: string;
    week: Week;
    tasks: WeekTask[];
  }[];
  tasks: Task[];
  categories: Category[];
}) {
  const router = useRouter();
  const [selectedTaskByWeek, setSelectedTaskByWeek] = useState<
    Record<string, string>
  >({});
  const [savingWeekId, setSavingWeekId] = useState<string | null>(null);
  const [errorByWeek, setErrorByWeek] = useState<Record<string, string>>({});

  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

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

  const setSelectedTask = (weekId: string, taskId: string) => {
    setSelectedTaskByWeek((prev) => ({
      ...prev,
      [weekId]: taskId,
    }));

    setErrorByWeek((prev) => ({
      ...prev,
      [weekId]: "",
    }));
  };

  const handleAddTask = async (weekData: {
    label: string;
    week: Week;
    tasks: WeekTask[];
  }) => {
    const selectedTaskId = selectedTaskByWeek[weekData.week.id];

    if (!selectedTaskId) {
      setErrorByWeek((prev) => ({
        ...prev,
        [weekData.week.id]: "الرجاء اختيار مهمة أولاً",
      }));
      return;
    }

    const selectedTask = tasks.find((task) => task.id === selectedTaskId);
    if (!selectedTask) {
      setErrorByWeek((prev) => ({
        ...prev,
        [weekData.week.id]: "المهمة المختارة غير موجودة",
      }));
      return;
    }

    setSavingWeekId(weekData.week.id);
    setErrorByWeek((prev) => ({
      ...prev,
      [weekData.week.id]: "",
    }));

    try {
      const response = await fetch("/api/week-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          week_id: weekData.week.id,
          task_id: selectedTask.id,
          task_name: selectedTask.name,
          category_id: selectedTask.category_id,
          category_name: selectedTask.category_id
            ? categoryNameById.get(selectedTask.category_id) || null
            : null,
          task_days:
            selectedTask.days && selectedTask.days.length > 0
              ? selectedTask.days
              : ALL_DAYS,
          sort_order: weekData.tasks.length,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "فشل في إضافة المهمة");
      }

      setSelectedTaskByWeek((prev) => ({
        ...prev,
        [weekData.week.id]: "",
      }));

      router.refresh();
    } catch (error) {
      setErrorByWeek((prev) => ({
        ...prev,
        [weekData.week.id]:
          error instanceof Error ? error.message : "حدث خطأ أثناء الإضافة",
      }));
    } finally {
      setSavingWeekId(null);
    }
  };

  return (
    <section className="ds-card">
      <div className="ds-section-header">
        <div>
          <h2 className="ds-title">برنامج الأسابيع</h2>
          <p className="ds-subtitle">
            البرنامج عبارة عن مجموعة من الأسابيع، وكل أسبوع يحتوي على مهامه
            التنفيذية.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="ds-badge">{weeks.length} أسابيع</span>
          <span className="ds-badge-primary">
            {weeks.reduce(
              (total, weekData) => total + weekData.tasks.length,
              0,
            )}{" "}
            مهام
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {weeks.map((weekData, index) => {
          const usedTaskIds = new Set(
            weekData.tasks.map((weekTask) => weekTask.task_id).filter(Boolean),
          );

          const availableTasks = tasks.filter(
            (task) => !usedTaskIds.has(task.id),
          );

          return (
            <article key={weekData.week.id} className="ds-card-soft space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {weekData.label}
                  </h3>
                  <p className="ds-subtitle">
                    {toArabicRange(weekData.week.start_date)}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="ds-badge-primary">
                    {weekData.tasks.length} مهمة
                  </span>
                  <span className="ds-subtitle">
                    {index === 0 ? "الأسبوع الجاري" : "الأسبوع التالي"}
                  </span>
                </div>
              </div>

              {weekData.tasks.length === 0 ? (
                <p className="text-sm text-gray-500">
                  لا توجد مهام لهذا الأسبوع.
                </p>
              ) : (
                <ul className="space-y-2">
                  {weekData.tasks.map((weekTask) => (
                    <li
                      key={weekTask.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2"
                    >
                      <span className="text-sm font-medium text-gray-800">
                        {weekTask.task_name}
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="ds-badge">
                          {weekTask.category_name || "بدون فئة"}
                        </span>
                        <span className="ds-badge-primary">
                          {weekTask.task_days?.length ?? ALL_DAYS.length} أيام
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex items-center gap-2">
                <select
                  value={selectedTaskByWeek[weekData.week.id] || ""}
                  onChange={(e) =>
                    setSelectedTask(weekData.week.id, e.target.value)
                  }
                  className="ds-select"
                  disabled={
                    availableTasks.length === 0 ||
                    savingWeekId === weekData.week.id
                  }
                >
                  <option value="">اختر مهمة لإضافتها</option>
                  {availableTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.name}
                    </option>
                  ))}
                </select>

                <Button
                  onClick={() => handleAddTask(weekData)}
                  disabled={
                    savingWeekId === weekData.week.id ||
                    availableTasks.length === 0
                  }
                >
                  {savingWeekId === weekData.week.id ? "جاري..." : "إضافة"}
                </Button>
              </div>

              {availableTasks.length === 0 && (
                <p className="text-xs text-gray-500">
                  كل المهام مضافة لهذا الأسبوع.
                </p>
              )}

              {errorByWeek[weekData.week.id] && (
                <p className="text-xs text-red-600">
                  {errorByWeek[weekData.week.id]}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
