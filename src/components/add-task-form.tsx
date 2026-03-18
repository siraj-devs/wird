"use client";

import { ALL_DAYS, DAYS_OF_WEEK } from "@/lib";
import { useRouter } from "next/navigation";
import React, { Activity, useState } from "react";
import { Button } from "./ui/Button";

export default function AddTaskForm({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [taskName, setTaskName] = useState("");
  const [taskCategoryId, setTaskCategoryId] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([...ALL_DAYS]);

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

  const handleCreateTask = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

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
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: taskName,
          category_id: taskCategoryId || null,
          days: selectedDays,
        }),
      });

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Failed to submit request");

      router.refresh();
      setTaskName("");
      setTaskCategoryId("");
      setSelectedDays([...ALL_DAYS]);
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
        <div className="ds-modal-overlay">
          <div className="ds-modal ds-modal-scroll">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              إنشاء مهمة جديدة
            </h3>

            {formError && (
              <div className="ds-error mb-4">
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
                  className="ds-input"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
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
                    setSelectedDays([...ALL_DAYS]);
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
