"use client";

import { useRouter } from "next/navigation";
import React, { Activity, useState } from "react";
import { Button } from "./ui/Button";

export default function AddTaskForm({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

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

  const handleCreateTask = async (e: React.SubmitEvent) => {
    e.preventDefault();
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
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Failed to submit request");

      router.refresh();
      setTaskName("");
      setTaskCategoryId("");
      setIsActive(true);
      setFrequency("daily");
      setSelectedDays([]);
      setTaskStartDate("");
      setTaskEndDate("");
      setIsOpen(false);
    } catch {
      setFormError("حدث خطأ. الرجاء المحاولة مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>مهمة جديدة</Button>

      <Activity mode={isOpen ? "visible" : "hidden"}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              إنشاء مهمة جديدة
            </h3>

            {formError && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-800">
                <p className="text-sm">{formError}</p>
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  الفئة <span className="text-red-500">*</span>
                </label>
                <select
                  value={taskCategoryId}
                  onChange={(e) => setTaskCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:outline-none"
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
                  التكرار
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
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
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
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      تاريخ البداية
                    </label>
                    <input
                      type="date"
                      lang="ar"
                      dir="rtl"
                      value={taskStartDate}
                      onChange={(e) => setTaskStartDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      تاريخ النهاية
                    </label>
                    <input
                      type="date"
                      value={taskEndDate}
                      onChange={(e) => setTaskEndDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                <input type="checkbox" name="is_active" />
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

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? "جاري الإنشاء..." : "إنشاء مهمة"}
                </Button>
                <Button
                  type="reset"
                  variant="secondary"
                  disabled={submitting}
                  onClick={() => {
                    setIsOpen(false);
                    setFormError("");
                    setTaskName("");
                    setTaskCategoryId("");
                    setIsActive(true);
                    setFrequency("daily");
                    setSelectedDays([]);
                    setTaskStartDate("");
                    setTaskEndDate("");
                  }}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Activity>
    </>
  );
}
