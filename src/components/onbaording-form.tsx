"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Button } from "./ui/Button";

export default function OnboardingForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const validateMoroccanPhone = (phone: string) => {
    const cleanPhone = phone.replace(/\s/g, "");
    const regex = /^[5-7]\d{8}$/;
    return regex.test(cleanPhone);
  };

  const validateArabicText = (text: string) => {
    const arabicRegex = /[\u0600-\u06FF]/;
    return arabicRegex.test(text) && text.trim().length > 0;
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setFormError("");

    if (!validateArabicText(fullName)) {
      setFormError("الرجاء إدخال الاسم الكامل بالعربية");
      return;
    }

    if (!validateMoroccanPhone(phoneNumber)) {
      setFormError("الرجاء إدخال رقم هاتف صحيح");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phoneNumber: "+212" + phoneNumber.replace(/\s/g, ""),
        }),
      });

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Failed to update profile");

      router.refresh();
    } catch {
      setFormError("حدث خطأ. الرجاء المحاولة مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full min-w-2/3 lg:w-fit">
      <div className="mb-8 text-center">
        <h1 className="font-kufam text-2xl font-bold text-gray-900">
          مرحبا بك في ورد
        </h1>
        <p className="mt-2 text-gray-600">
          يبدو أنك جديد هنا. يرجى إكمال ملفك الشخصي للمتابعة.
        </p>
      </div>

      {formError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          <p className="text-sm">{formError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            الاسم الكامل <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => {
              const value = e.target.value;
              if (/^[\u0600-\u06FF\s]*$/.test(value)) {
                setFullName(value);
              }
            }}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            placeholder="مثال: محمد بن أحمد"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            رقم الهاتف <span className="text-red-500">*</span>
          </label>
          <div dir="ltr" className="flex gap-2">
            <div className="flex items-center rounded-lg border border-gray-300 bg-gray-50 px-4 py-3">
              <span className="text-gray-700">+212</span>
            </div>
            <input
              type="tel"
              required
              value={phoneNumber}
              minLength={9}
              maxLength={9}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*$/.test(value) && value.length <= 9) {
                  setPhoneNumber(value);
                }
              }}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              placeholder="677734999"
            />
          </div>
        </div>

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "جاري الحفظ..." : "حفظ"}
        </Button>
      </form>

      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-6 py-4">
        <p className="text-sm text-gray-600">
          <strong>ملاحظة:</strong> بعد إكمال ملفك الشخصي، سيتم مراجعة طلبك من
          قبل المسؤول.
        </p>
      </div>
    </div>
  );
}
