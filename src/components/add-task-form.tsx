"use client";

import { useRouter } from "next/navigation";
import React, { Activity, useState } from "react";

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
  const [taskIsRegular, setTaskIsRegular] = useState(false);
  const [taskStartDate, setTaskStartDate] = useState("");
  const [taskEndDate, setTaskEndDate] = useState("");
  // const [taskAssignedUsers, setTaskAssignedUsers] = useState<string[]>([]);
  // const [categoryName, setCategoryName] = useState("");

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
      is_regular: taskIsRegular,
      start_date: taskStartDate || null,
      end_date: taskEndDate || null,
      // assigned_user_ids: taskAssignedUsers,
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
      setTaskIsRegular(false);
      setTaskStartDate("");
      setTaskEndDate("");
      // setTaskAssignedUsers([]);
      setIsOpen(false);
    } catch {
      setFormError("حدث خطأ. الرجاء المحاولة مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 md:w-fit"
      >
        مهمة جديدة
      </button>

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
                  الفئة <span className="text-red-500">*</span>
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
                <label className="flex items-center bg-indigo-50 px-4 py-2 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={taskIsRegular}
                    onChange={(e) => setTaskIsRegular(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 focus:outline-none focus:ring-blue-"
                  />
                  <span className="mr-2 text- font-medium text-gray-700">
                    مهمة دورية
                  </span>
                </label>
              </div>

              {/* {!taskIsRegular && (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={taskStartDate}
                      onChange={(e) => setTaskStartDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={taskEndDate}
                      onChange={(e) => setTaskEndDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </>
              )} */}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 cursor-pointer rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "جاري الإنشاء..." : "إنشاء مهمة"}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setIsOpen(false);
                    setFormError("");
                    setTaskName("");
                    setTaskCategoryId("");
                    setTaskIsRegular(false);
                    setTaskStartDate("");
                    setTaskEndDate("");
                    // setTaskAssignedUsers([]);
                  }}
                  className="cursor-pointer rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      </Activity>
    </>
  );
}
