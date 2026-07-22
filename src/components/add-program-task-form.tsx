"use client";

import { ALL_DAYS, DAYS_OF_WEEK } from "@/lib";
import { useRouter } from "next/navigation";
import React, { Activity, useState } from "react";
import { Button } from "./ui/Button";

export default function AddProgramTaskForm({
  programId,
  categories,
}: {
  programId: string;
  categories: ProgramCategory[];
}) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [taskName, setTaskName] = useState("");
  const [taskCategoryId, setTaskCategoryId] = useState("");
  const [scheduleType, setScheduleType] = useState<"recurring" | "dated">(
    "recurring",
  );
  const [selectedDays, setSelectedDays] = useState<number[]>([...ALL_DAYS]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const toggleDay = (dayId: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayId)
        ? prev.filter((id) => id !== dayId)
        : [...prev, dayId].sort((a, b) => a - b),
    );
  };

  const resetForm = () => {
    setFormError("");
    setTaskName("");
    setTaskCategoryId("");
    setScheduleType("recurring");
    setSelectedDays([...ALL_DAYS]);
    setStartDate("");
    setEndDate("");
  };

  const validateArabicText = (text: string) => {
    const arabicRegex = /[\u0600-\u06FF]/;
    return arabicRegex.test(text) && text.trim().length > 0;
  };

  const handleCreate = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    if (!validateArabicText(taskName)) {
      setFormError("الرجاء إدخال اسم المهمة بالعربية");
      return;
    }

    if (scheduleType === "recurring" && selectedDays.length === 0) {
      setFormError("الرجاء اختيار يوم واحد على الأقل");
      return;
    }

    if (scheduleType === "dated" && (!startDate || !endDate)) {
      setFormError("الرجاء اختيار تاريخ البداية والنهاية");
      return;
    }

    setSubmitting(true);
    try {
      const body =
        scheduleType === "recurring"
          ? {
              name: taskName,
              category_id: taskCategoryId || null,
              schedule_type: "recurring",
              days: selectedDays,
            }
          : {
              name: taskName,
              category_id: taskCategoryId || null,
              schedule_type: "dated",
              start_date: startDate,
              end_date: endDate,
            };

      const response = await fetch(`/api/programs/${programId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed");

      router.refresh();
      resetForm();
      setIsOpen(false);
    } catch {
      setFormError("حدث خطأ. الرجاء المحاولة مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="p-2!">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="size-4.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      </Button>

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

            <form onSubmit={handleCreate} className="space-y-4">
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
                  نوع الجدولة <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setScheduleType("recurring")}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      scheduleType === "recurring"
                        ? "bg-primary-100 text-primary-900"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    متكررة (أيام الأسبوع)
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleType("dated")}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      scheduleType === "dated"
                        ? "bg-primary-100 text-primary-900"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    فترة زمنية
                  </button>
                </div>
              </div>

              {scheduleType === "recurring" ? (
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
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      من تاريخ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="ds-input"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      إلى تاريخ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      className="ds-input"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? "جاري الإنشاء..." : "إنشاء مهمة"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={submitting}
                  onClick={() => {
                    setIsOpen(false);
                    resetForm();
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
