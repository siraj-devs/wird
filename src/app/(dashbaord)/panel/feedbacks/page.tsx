import { getUsers } from "@/actions";
import { checkRole } from "@/lib/auth-server";
import { ROLES } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase";

const QUESTION_LABELS: Record<string, string> = {
  "1": "أي المحطات كانت الأكثر ملامسة لقلبك وأحدثت فيك أثراً ملموساً؟",
  "2": "لماذا هذا الموضوع تحديداً؟",
  "3": "بخصوص القراءة والاستماع الأسبوعي كيف تجد مستواها؟",
  "4": "موضوع تحب أن نضيفه في الرحلة القادمة؟",
  "5": "أي من الأعمال الدورية شعرت أنها أصبحت جزءاً من يومك ولم تعد مجرد تكليف؟",
  "6": "ما هو التحدي الأكبر الذي واجهك في الالتزام بالعمل الأسبوعي؟ وكيف تجاوزته؟",
  "7": "عمل تود أن نضيفه للرحلة القادمة؟",
  "8": "كيف تصف تجربة مجلس الذكر في التأثير على ثباتك طوال الأسبوع؟",
  "9": "ماذا تقترح لتطوير مجلس الذكر الأسبوعي؟",
  "10": "\"لحظة معراج\".. اذكر موقفاً أو شعوراً مرّ بك خلال هذه الأسابيع الخمسة شعرت فيه بقرب من الله.",
  "11": "تقييمك النهائي للرحلة",
  "12": "كلمة لمن سيخوض رحلة معارج الإيمان من بعدك..",
  "13": "هل تود أن تكون من المشرفين في النسخة القادمة؟",
};

const QUESTION_ORDER = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
];

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ar-MA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalizeAnswer = (value: unknown) => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value.trim() || "-";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "نعم" : "لا";
  return JSON.stringify(value);
};

export default async function Page() {
  await checkRole([ROLES.OWNER, ROLES.ADMIN]);

  const [{ data: feedbacks }, users] = await Promise.all([
    supabaseAdmin
      .from("feedbacks")
      .select("id, user_id, answers, created_at")
      .order("created_at", { ascending: false }),
    getUsers(),
  ]);

  const userMap = new Map(users.map((user) => [user.id, user]));

  return (
    <div className="ds-page" dir="rtl">
      <section className="ds-card">
        <div className="ds-section-header">
          <div>
            <h1 className="ds-title">نتائج تقييم رحلة معارج الإيمان</h1>
            <p className="ds-subtitle">
              استعرض إجابات الأعضاء مرتبة حسب وقت الإرسال.
            </p>
          </div>
          <span className="ds-badge-primary">
            {feedbacks?.length ?? 0} إجابة
          </span>
        </div>

        {feedbacks && feedbacks.length > 0 ? (
          <div className="space-y-6">
            {feedbacks.map((feedback) => {
              const user = userMap.get(feedback.user_id);
              const answers = (feedback.answers ?? {}) as Record<string, unknown>;

              return (
                <article key={feedback.id} className="ds-card-soft">
                  <div className="flex gap-4 border-b border-gray-200 pb-4 items-start justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {user?.full_name || user?.username || "عضو غير معروف"}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {user?.username ? `@${user.username}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="ds-badge">{formatDate(feedback.created_at)}</span>
                      {/* {user?.role && <span className="ds-badge-primary">{user.role}</span>} */}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {QUESTION_ORDER.map((key) => {
                      const label = QUESTION_LABELS[key];
                      const value = normalizeAnswer(answers[key]);
                      const isRating = key === "11";

                      return (
                        <div key={key} className="rounded-lg border border-gray-200 bg-white p-3">
                          <p className="text-xs font-semibold text-gray-500">
                            {key}. {label}
                          </p>
                          <p className="mt-2 text-sm text-gray-800">
                            {isRating ? `${value} / 5` : value}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">لا توجد إجابات حتى الآن.</p>
        )}
      </section>
    </div>
  );
}
