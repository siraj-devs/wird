"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
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
  const [isActive, setIsActive] = useState(true);
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "specific">(
    "daily",
  );
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [taskStartDate, setTaskStartDate] = useState("");
  const [taskEndDate, setTaskEndDate] = useState("");

  const daysOfWeek = [
    { id: 0, name: "الأحد", short: "أحد" },
    { id: 1, name: "الإثنين", short: "إثنين" },
    { id: 2, name: "الثلاثاء", short: "ثلاثاء" },
    { id: 3, name: "الأربعاء", short: "أربعاء" },
    { id: 4, name: "الخميس", short: "خميس" },
    { id: 5, name: "الجمعة", short: "جمعة" },
    { id: 6, name: "السبت", short: "سبت" },
  ];

  const toggleDay = (dayId: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayId)
        ? prev.filter((id) => id !== dayId)
        : [...prev, dayId],
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

    setSubmitting(true);

    const taskData = {
      name: taskName,
      category_id: taskCategoryId || null,
      is_active: isActive,
      frequency: frequency,
      weekly_days: frequency === "weekly" ? selectedDays : null,
      start_date: taskStartDate || null,
      end_date: taskEndDate || null,
    };

    try {
      const response = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
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
            setIsActive(task.is_active);
            setFrequency(task.frequency);
            setSelectedDays(task.weekly_days || []);
            setTaskStartDate(
              task.start_date ? task.start_date.split("T")[0] : "",
            );
            setTaskEndDate(task.end_date ? task.end_date.split("T")[0] : "");
          }}
          className="flex cursor-pointer items-center gap-2 rounded-lg bg-gray-50 px-4 py-2 hover:bg-gray-100"
        >
          <div className="flex flex-col items-start">
            <h3 className="font-medium text-gray-900">{task.name}</h3>
            <div className="mt-1 flex gap-2">
              {task.categories?.name && (
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">
                  {task.categories.name}
                </span>
              )}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  task.frequency === "daily"
                    ? "bg-purple-100 text-purple-700"
                    : task.frequency === "weekly"
                      ? "bg-violet-100 text-violet-700"
                      : "bg-indigo-100 text-indigo-700"
                }`}
              >
                {task.frequency === "daily"
                  ? "يومي"
                  : task.frequency === "weekly"
                    ? "أسبوعي"
                    : "أيام محددة"}
              </span>
              {task.is_active ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                  نشط
                </span>
              ) : (
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700">
                  غير نشط
                </span>
              )}
            </div>
          </div>
        </button>
      ))}

      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex justify-between">
              <h3 className="text-xl font-bold text-gray-900">تعديل المهمة</h3>

              <button
                className="text-red-600"
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  الفئة
                </label>
                <select
                  value={taskCategoryId}
                  onChange={(e) => setTaskCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">لا توجد فئة</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <hr className="text-gray-100" />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  التكرار <span className="text-red-500">*</span>
                </label>
                <div className="flex overflow-hidden rounded-lg border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setFrequency("daily")}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      frequency === "daily"
                        ? "bg-purple-50 text-purple-700"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    } relative border-r border-gray-200`}
                  >
                    {frequency === "daily" && (
                      <span className="absolute top-1/2 left-3 -translate-y-1/2">
                        <svg
                          className="h-4 w-4 text-purple-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                    <span className={frequency === "daily" ? "ml-5" : ""}>
                      يومي
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFrequency("weekly")}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      frequency === "weekly"
                        ? "bg-violet-50 text-violet-700"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    } relative border-r border-gray-200`}
                  >
                    {frequency === "weekly" && (
                      <span className="absolute top-1/2 left-3 -translate-y-1/2">
                        <svg
                          className="h-4 w-4 text-violet-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                    <span className={frequency === "weekly" ? "ml-5" : ""}>
                      أسبوعي
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFrequency("specific")}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      frequency === "specific"
                        ? "bg-indigo-50 text-indigo-700"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    } relative`}
                  >
                    {frequency === "specific" && (
                      <span className="absolute top-1/2 left-3 -translate-y-1/2">
                        <svg
                          className="h-4 w-4 text-indigo-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                    <span className={frequency === "specific" ? "ml-5" : ""}>
                      أيام محددة
                    </span>
                  </button>
                </div>
              </div>

              {frequency === "weekly" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    اختر أيام الأسبوع
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {daysOfWeek.map((day) => (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => toggleDay(day.id)}
                        className={`rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                          selectedDays.includes(day.id)
                            ? "bg-violet-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {day.short}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {frequency === "specific" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900">
                      تاريخ البداية
                    </label>
                    <input
                      type="date"
                      value={taskStartDate}
                      onChange={(e) => setTaskStartDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900">
                      تاريخ النهاية
                    </label>
                    <input
                      type="date"
                      value={taskEndDate}
                      onChange={(e) => setTaskEndDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg bg-white py-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">
                    تفعيل المهمة
                  </h4>
                  <p className="mt-0.5 text-xs text-gray-500">
                    عندما تكون المهمة نشطة، يمكن للأعضاء مشاهدته
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                    isActive ? "bg-green-500" : "bg-gray-300"
                  }`}
                  role="switch"
                  aria-checked={isActive}
                >
                  <span
                    className={`inline-block size-5 transform rounded-full bg-white shadow-sm transition-transform ${
                      isActive ? "-translate-x-5.5" : "-translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {formError && (
                <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-red-800">
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
                  type="reset"
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
