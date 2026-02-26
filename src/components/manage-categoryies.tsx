"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function ManageCategories({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [categoryNewName, setCategoryNewName] = useState("");

  const validateArabicText = (text: string) => {
    const arabicRegex = /[\u0600-\u06FF]/;
    return arabicRegex.test(text) && text.trim().length > 0;
  };

  const handleEditCategory = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    setFormError("");

    if (!validateArabicText(categoryNewName)) {
      setFormError("الرجاء إدخال اسم الفئة بالعربية");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryNewName }),
      });

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Failed to submit request");

      router.refresh();
      setSelectedCategory(null);
    } catch {
      setFormError("حدث خطأ. الرجاء المحاولة مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    setFormError("");
    setSubmitting(true);

    try {
      const response = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Failed to submit request");

      router.refresh();
      setSelectedCategory(null);
    } catch {
      setFormError("حدث خطأ. الرجاء المحاولة مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-4 divide-gray-100">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => {
            setSelectedCategory(category);
            setCategoryNewName(category.name);
          }}
          className="flex cursor-pointer justify-between rounded-lg bg-gray-50 px-4 py-1.5 hover:bg-gray-100"
        >
          <h3>
            {category.name}
            {category.tasks > 0 && (
              <span className="mr-6 rounded-full bg-primary-100 px-1.5 py-0.5 text-center text-xs font-semibold text-primary-900">
                {category.tasks}
              </span>
            )}
          </h3>
        </button>
      ))}

      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex justify-between">
              <h3 className="text-xl font-bold text-gray-900">تعديل الفئة</h3>

              <button className="text-red-600" onClick={() => handleDeleteCategory()}>
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

            <form onSubmit={handleEditCategory} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  اسم الفئة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={categoryNewName}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^[\u0600-\u06FF\s]*$/.test(value)) {
                      setCategoryNewName(value);
                    }
                  }}
                  placeholder="أدخل اسم الفئة بالعربية"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {formError && (
                <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-red-800">
                  <p className="text-sm">{formError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting || !selectedCategory}
                  className="flex-1 rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  {submitting ? "جاري التعديل..." : "تعديل الفئة"}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setSelectedCategory(null);
                    setFormError("");
                  }}
                  className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:outline-none"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
