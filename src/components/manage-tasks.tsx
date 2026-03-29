"use client";

import { ALL_DAYS, DAYS_OF_WEEK } from "@/lib";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import { Button } from "./ui/Button";

export default function ManageTasks({
  tasks,
  categories,
}: {
  tasks: Task[];
  categories: Category[];
}) {
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskName, setTaskName] = useState("");
  const [taskCategoryId, setTaskCategoryId] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([...ALL_DAYS]);

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const toggleDay = (dayId: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayId)
        ? prev.filter((id) => id !== dayId)
        : [...prev, dayId].sort((a, b) => a - b),
    );
  };

  const validateArabicText = (text: string) => {
    const arabicRegex = /[\u0600-\u06FF]/;
    return arabicRegex.test(text) && text.trim().length > 0;
  };

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setFormError("");

    if (!validateArabicText(taskName)) {
      setFormError("الرجاء إدخال اسم المهمة بالعربية");
      return;
    }

    if (selectedDays.length === 0) {
      setFormError("الرجاء اختيار يوم واحد على الأقل");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: taskName,
          category_id: taskCategoryId || null,
          days: selectedDays,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update task");

      router.refresh();
      setSelectedTask(null);
    } catch {
      setFormError("حدث خطأ. الرجاء المحاولة مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    setFormError("");
    setSubmitting(true);

    try {
      const response = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete task");

      router.refresh();
      setSelectedTask(null);
    } catch {
      setFormError("حدث خطأ. الرجاء المحاولة مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-4">
      {tasks.map((task) => (
        <button
          key={task.id}
          onClick={() => {
            setSelectedTask(task);
            setTaskName(task.name);
            setTaskCategoryId(task.category_id || "");
            setSelectedDays(
              task.days && task.days.length > 0 ? task.days : [...ALL_DAYS],
            );
          }}
          className="ds-card-soft flex cursor-pointer items-center gap-2 px-4 py-2"
        >
          <div className="flex flex-col items-start">
            <h3 className="font-medium text-gray-900">{task.name}</h3>
            <div className="mt-1 flex gap-2">
              {task.category_id && categoryById.get(task.category_id) && (
                <span className="ds-badge">
                  {categoryById.get(task.category_id)}
                </span>
              )}
              <span className="ds-badge-primary">
                {task.days.length === ALL_DAYS.length
                  ? "يوميا"
                  : task.days
                      .map(
                        (dayId) =>
                          DAYS_OF_WEEK.find((d) => d.id === dayId)?.name,
                      )
                      .filter(Boolean)
                      .join(", ")}
              </span>
            </div>
          </div>
        </button>
      ))}

      {selectedTask && (
        <div className="ds-modal-overlay">
          <div className="ds-modal ds-modal-scroll">
            <div className="mb-4 flex justify-between">
              <h3 className="text-xl font-bold text-gray-900">تعديل المهمة</h3>

              <button
                className="rounded-md p-1 text-red-600 hover:bg-red-50"
                onClick={() => handleDeleteTask()}
                disabled={submitting}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditTask} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  اسم المهمة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^[\u0600-\u06FF\s]*$/.test(value)) {
                      setTaskName(value);
                    }
                  }}
                  placeholder="أدخل اسم المهمة بالعربية"
                  required
                  className="ds-input"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  الفئة
                </label>
                <select
                  value={taskCategoryId}
                  onChange={(e) => setTaskCategoryId(e.target.value)}
                  className="ds-select"
                >
                  <option value="">لا توجد فئة</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  أيام التنفيذ <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleDay(day.id)}
                      className={`rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                        selectedDays.includes(day.id)
                          ? "bg-primary-100 text-primary-900 hover:bg-primary-200"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {day.name}
                    </button>
                  ))}
                </div>
              </div>

              {formError && (
                <div className="ds-error mb-4">
                  <p className="text-sm">{formError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={submitting || !selectedTask}
                  className="flex-1"
                >
                  {submitting ? "جاري التعديل..." : "تعديل المهمة"}
                </Button>
                <Button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setSelectedTask(null);
                    setFormError("");
                  }}
                  variant="secondary"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
