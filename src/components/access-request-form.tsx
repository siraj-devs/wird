import React, { Activity, useState } from "react";

export default function AccessRequestForm({
  showAccessForm,
  setShowAccessForm,
  fetchUserRequestsByUserId,
}: {
  showAccessForm: boolean;
  setShowAccessForm: React.Dispatch<React.SetStateAction<boolean>>;
  fetchUserRequestsByUserId: () => Promise<void>;
}) {
  const [fullName, setFullName] = useState("المغربي");
  const [phoneNumber, setPhoneNumber] = useState("677728707");
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

  const handleAccessRequest = async (e: React.FormEvent) => {
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
      const response = await fetch("/api/access-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.replace(/\s/g, ""),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      setShowAccessForm(false);
      setFullName("");
      setPhoneNumber("");
      fetchUserRequestsByUserId();
    } catch {
      setFormError("حدث خطأ. الرجاء المحاولة مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Activity mode={showAccessForm ? "visible" : "hidden"}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          <h3 className="mb-4 text-xl font-bold text-gray-900">طلب الوصول</h3>

          {formError && (
            <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-800">
              <p className="text-sm">{formError}</p>
            </div>
          )}

          <form onSubmit={handleAccessRequest} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
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
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="مثال: محمد بن أحمد"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                رقم الهاتف <span className="text-red-500">*</span>
              </label>
              <div dir="ltr" className="flex gap-2">
                <div className="flex items-center rounded-md border border-gray-300 bg-gray-50 px-3 py-2">
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
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="677734999"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "جاري الإرسال..." : "إرسال الطلب"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAccessForm(false);
                  setFormError("");
                  setFullName("");
                  setPhoneNumber("");
                }}
                className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </Activity>
  );
}
