import OnboardingForm from "@/components/onbaording-form";
import { checkRole } from "@/lib/auth-server";
import { ROLES } from "@/lib/roles";

export default async function Page() {
  const user = await checkRole([ROLES.GUEST, ROLES.NEWCOMER, ROLES.EXPELLED]);

  if (user.role === ROLES.NEWCOMER) return <OnboardingForm />;

  if (user.role === ROLES.EXPELLED)
    return (
      <div className="mx-auto w-full min-w-2/3 lg:w-fit">
        <h1 className="text-center font-kufam text-2xl font-bold text-gray-900">
          تم طردك من ورد
        </h1>
        <p className="mt-2 text-center text-gray-600">
          عذرًا، تم حظر وصولك إلى النظام. يرجى التواصل مع المسؤول لمزيد من
          المعلومات.
        </p>

        <div className="mt-8 rounded-lg bg-red-50 p-6">
          <h2 className="mb-2 font-semibold text-red-900">لماذا تم حظري؟</h2>
          <p className="text-sm text-red-800">
            تم إيقاف وصولك إلى المنصة من قبل المسؤول. قد يكون ذلك بسبب:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-red-800">
            <li className="before:mt-0.5 before:ml-2 before:content-['•']">
              <span>انتهاك قواعد الاستخدام</span>
            </li>
            <li className="before:mt-0.5 before:ml-2 before:content-['•']">
              <span>نشاط مشبوه أو غير مصرح به</span>
            </li>
            <li className="before:mt-0.5 before:ml-2 before:content-['•']">
              <span>طلب من إدارة المجموعة</span>
            </li>
          </ul>
        </div>

        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-6 py-4">
          <p className="text-sm text-gray-600">
            <strong>هل تعتقد أن هذا خطأ؟</strong> يرجى التواصل مع مسؤول النظام
            لمراجعة حالتك.
          </p>
        </div>
      </div>
    );

  if (user.role === ROLES.GUEST)
    return (
      <div className="mx-auto w-full min-w-2/3 lg:w-fit">
        <h1 className="text-center font-kufam text-2xl font-bold text-gray-900">
          في انتظار الموافقة
        </h1>
        <p className="mt-2 text-center text-gray-600">
          طلبك قيد المراجعة من قبل المسؤول. يرجى الانتظار حتى يتم الموافقة عليه.
        </p>

        <div className="mt-8 rounded-lg bg-blue-50 p-6">
          <h2 className="mb-3 font-semibold text-blue-900">ما التالي؟</h2>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="before:mt-0.5 before:ml-2 before:content-['•']">
              <span>تم استلام طلبك بنجاح</span>
            </li>
            <li className="before:mt-0.5 before:ml-2 before:content-['•']">
              <span>المسؤول يراجع معلوماتك الآن</span>
            </li>
            <li className="before:mt-0.5 before:ml-2 before:content-['•']">
              <span>ستحصل على الوصول إلى ورد بعد قبول طلبك</span>
            </li>
          </ul>
        </div>

        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-6 py-4">
          <p className="text-sm text-gray-600">
            <strong>ملاحظة:</strong> عادةً ما تتم المراجعة خلال 24 ساعة
          </p>
        </div>
      </div>
    );
}
