"use client";

import { useRouter } from "next/navigation";
import React, { Activity, useState } from "react";
import { Button } from "./ui/Button";

export default function AddCategoryForm() {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [categoryName, setCategoryName] = useState("");

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
      <Button onClick={() => setIsOpen(true)} className="w-full md:w-fit">
        فئة جديدة
      </Button>

      <Activity mode={isOpen ? "visible" : "hidden"}>
        <div className="ds-modal-overlay">
          <div className="ds-modal">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              إنشاء فئة جديدة
            </h3>

            {formError && (
              <div className="ds-error mb-4">
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
                  className="ds-input"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? "جاري الإنشاء..." : "إنشاء فئة"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={submitting}
                  onClick={() => {
                    setIsOpen(false);
                    setFormError("");
                    setCategoryName("");
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
