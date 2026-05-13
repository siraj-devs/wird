"use client";

import Link from "next/link";
import { type FormEvent, useMemo, useState } from "react";
import { Button } from "./ui/Button";

const RadioGroup = ({
  id,
  label,
  options,
  value,
  onChange,
}: {
  id: string;
  label: string;
  options: string[];
  value?: string;
  onChange: (value: string) => void;
}) => (
  <fieldset className="space-y-2">
    <legend className="block text-sm font-medium text-gray-700">{label}</legend>
    <div className="space-y-2">
      {options.map((option) => (
        <label
          key={option}
          className={
            value === option
              ? "flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-800"
              : "flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800"
          }
        >
          <input
            type="radio"
            name={id}
            value={option}
            checked={value === option}
            onChange={(event) => onChange(event.target.value)}
            className="h-4 w-4 accent-primary-600"
            required
          />
          <span>{option}</span>
        </label>
      ))}
    </div>
  </fieldset>
);

const TextareaField = ({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value?: string;
  onChange: (value: string) => void;
}) => (
  <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <textarea
      id={id}
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
      className="ds-input min-h-28 resize-y"
      placeholder={placeholder}
      required
    />
  </div>
);

export default function MemberFeedbackForm({
  initialSubmitted,
}: {
  initialSubmitted: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(initialSubmitted);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const starOptions = useMemo(() => ["1", "2", "3", "4", "5"], []);

  const isFormComplete = useMemo(() => {
    const requiredRadioIds = ["q1", "q3", "q5", "q8", "q12"];
    const requiredTextIds = ["q2", "q6", "q7b", "q9", "q11"];
    const requiredShortIds = ["q4", "q7"];

    const hasValue = (value?: string) => Boolean(value?.trim());

    const radiosFilled = requiredRadioIds.every((id) => hasValue(answers[id]));
    const textFilled = requiredTextIds.every((id) => hasValue(answers[id]));
    const shortFilled = requiredShortIds.every((id) => hasValue(answers[id]));

    return (
      radiosFilled && textFilled && shortFilled && hasValue(answers.rating)
    );
  }, [answers]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/feedbacks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "فشل في إرسال التقييم");
      }

      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "حدث خطأ أثناء الإرسال",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="ds-page" dir="rtl">
        <section className="ds-card">
          <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
            <h1 className="mb-6 font-kufam text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
              شكراً !
            </h1>

            <p className="mb-10 text-base leading-relaxed text-foreground/70 md:text-lg">
              نشكرك على وقتك ومشاركتك الصادقة. كلماتك تصنع فرقاً حقيقياً في
              رحلتنا القادمة.
            </p>

            <Link href="/">
              <Button>الرجوع إلى الرئيسية</Button>
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="ds-page" dir="rtl">
      <section className="ds-card">
        <div className="ds-section-header">
          <div>
            <h1 className="ds-title">نموذج تقييم رحلة معارج الإيمان</h1>
            <p className="ds-subtitle">
              أهلاً بك يا رفيق الدرب.. يسعدنا أن تشاركنا أثر هذه الرحلة في قلبك
              لنرتقي معاً في المعارج القادمة.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <RadioGroup
            id="q1"
            label="1. أي المحطات كانت الأكثر ملامسة لقلبك وأحدثت فيك أثراً ملموساً؟"
            options={["الإخلاص", "الإيمان", "الصلاة", "الآخرة", "القرآن"]}
            value={answers.q1}
            onChange={(value) =>
              setAnswers((prev) => ({ ...prev, q1: value }))
            }
          />

          <TextareaField
            id="q2"
            label="2. لماذا هذا الموضوع تحديداً؟"
            placeholder="اكتب السبب هنا"
            value={answers.q2}
            onChange={(value) =>
              setAnswers((prev) => ({ ...prev, q2: value }))
            }
          />

          <RadioGroup
            id="q3"
            label="3. بخصوص القراءة والاستماع الأسبوعي كيف تجد مستواها؟"
            options={[
              "سهلة وميسرة",
              "متوسطة وتحتاج جهداً",
              "دسمة جداً وصعبة الاستيعاب",
            ]}
            value={answers.q3}
            onChange={(value) =>
              setAnswers((prev) => ({ ...prev, q3: value }))
            }
          />

          <div className="space-y-2">
            <label
              htmlFor="q4"
              className="block text-sm font-medium text-gray-700"
            >
              4. موضوع تحب أن نضيفه في الرحلة القادمة؟
            </label>
            <input
              id="q4"
              type="text"
              value={answers.q4 ?? ""}
              onChange={(event) =>
                setAnswers((prev) => ({ ...prev, q4: event.target.value }))
              }
              className="ds-input"
              placeholder="مثال: موضوع عن ..."
              required
            />
          </div>

          <RadioGroup
            id="q5"
            label="5. أي من الأعمال الدورية شعرت أنها أصبحت جزءاً من يومك ولم تعد مجرد تكليف؟"
            options={[
              "إدراك تكبيرة الإحرام جماعة",
              "قراءة تدبرية لما تيسر من القرآن الكريم",
              "المحافظة على السنن الرواتب",
              "المحافظة على أذكار الصباح والمساء والنوم والصلاة",
            ]}
            value={answers.q5}
            onChange={(value) =>
              setAnswers((prev) => ({ ...prev, q5: value }))
            }
          />

          <TextareaField
            id="q6"
            label="6. ما هو التحدي الأكبر الذي واجهك في الالتزام بالعمل الأسبوعي؟ وكيف تجاوزته؟"
            placeholder="اكتب تفاصيل تجربتك"
            value={answers.q6}
            onChange={(value) =>
              setAnswers((prev) => ({ ...prev, q6: value }))
            }
          />

          <div className="space-y-2">
            <label
              htmlFor="q7"
              className="block text-sm font-medium text-gray-700"
            >
              7. عمل تود أن نضيفه للرحلة القادمة؟
            </label>
            <input
              id="q7"
              type="text"
              value={answers.q7 ?? ""}
              onChange={(event) =>
                setAnswers((prev) => ({ ...prev, q7: event.target.value }))
              }
              className="ds-input"
              placeholder="اكتب اقتراحك"
              required
            />
          </div>

          <RadioGroup
            id="q8"
            label="8. كيف تصف تجربة مجلس الذكر في التأثير على ثباتك طوال الأسبوع؟"
            options={[
              "كانت الدافع الأساسي للاستمرار.",
              "كانت مفيدة لكنها تحتاج تنظيماً أكثر.",
              "لم أشعر بأثرها الكبير.",
            ]}
            value={answers.q8}
            onChange={(value) =>
              setAnswers((prev) => ({ ...prev, q8: value }))
            }
          />

          <TextareaField
            id="q7b"
            label="7. ماذا تقترح لتطوير مجلس الذكر الأسبوعي؟"
            placeholder="اقتراحاتك هنا"
            value={answers.q7b}
            onChange={(value) =>
              setAnswers((prev) => ({ ...prev, q7b: value }))
            }
          />

          <TextareaField
            id="q9"
            label={
              '9. "لحظة معراج".. اذكر موقفاً أو شعوراً مرّ بك خلال هذه الأسابيع الخمسة شعرت فيه بقرب من الله.'
            }
            placeholder="اكتب الموقف أو الشعور"
            value={answers.q9}
            onChange={(value) =>
              setAnswers((prev) => ({ ...prev, q9: value }))
            }
          />

          <fieldset className="space-y-2">
            <legend className="block text-sm font-medium text-gray-700">
              10. تقييمك النهائي للرحلة:
            </legend>
            <div className="flex flex-wrap gap-2">
              {starOptions.map((value) => (
                <label
                  key={value}
                  className={
                    answers.rating === value
                      ? "flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-800"
                      : "flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800"
                  }
                >
                  <input
                    type="radio"
                    name="rating"
                    value={value}
                    checked={answers.rating === value}
                    onChange={(event) =>
                      setAnswers((prev) => ({
                        ...prev,
                        rating: event.target.value,
                      }))
                    }
                    className="h-4 w-4 accent-primary-600"
                    required
                  />
                  <span>{value}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <TextareaField
            id="q11"
            label="11. كلمة لمن سيخوض رحلة معارج الإيمان من بعدك.."
            placeholder="اكتب رسالتك"
            value={answers.q11}
            onChange={(value) =>
              setAnswers((prev) => ({ ...prev, q11: value }))
            }
          />

          <RadioGroup
            id="q12"
            label="12. هل تود أن تكون من المشرفين في النسخة القادمة؟"
            options={["نعم، يسعدني ذلك", "أكتفي بكوني خريجا لهذه الرحلة"]}
            value={answers.q12}
            onChange={(value) =>
              setAnswers((prev) => ({ ...prev, q12: value }))
            }
          />

          {submitError ? <p className="ds-error">{submitError}</p> : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={!isFormComplete || isSubmitting}>
              {isSubmitting ? "جاري الإرسال..." : "إرسال التقييم"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
