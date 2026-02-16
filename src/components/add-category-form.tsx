"use client";

import { useRouter } from "next/navigation";
import React, { Activity, useState } from "react";

export default function AddCategoryForm() {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [categoryName, setCategoryName] = useState("المغربي");

  const validateArabicText = (text: string) => {
    const arabicRegex = /[\u0600-\u06FF]/;
    return arabicRegex.test(text) && text.trim().length > 0;
  };

  const handleCreateCategory = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setFormError("");

    if (!validateArabicText(categoryName)) {
      setFormError("الرجاء إدخال اسم الفئة بالعربية");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName }),
      });

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Failed to submit request");

      router.refresh();
      setCategoryName("");
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
        فئة جديدة
      </button>

      <Activity mode={isOpen ? "visible" : "hidden"}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              إنشاء فئة جديدة
            </h3>

            {formError && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-800">
                <p className="text-sm">{formError}</p>
              </div>
            )}

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  اسم الفئة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^[\u0600-\u06FF\s]*$/.test(value)) {
                      setCategoryName(value);
                    }
                  }}
                  placeholder="أدخل اسم الفئة بالعربية"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 cursor-pointer rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "جاري الإنشاء..." : "إنشاء فئة"}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setIsOpen(false);
                    setFormError("");
                    setCategoryName("");
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
