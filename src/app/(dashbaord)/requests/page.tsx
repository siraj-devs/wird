import { getRequests } from "@/actions";
import AccessRequestForm from "@/components/access-request-form";
import { checkRole } from "@/lib/auth-server";
import { ROLES } from "@/lib/roles";
import { getIdFromToken } from "@/lib/auth-server";

export default async function Page() {
  const id = await getIdFromToken();
  await checkRole([ROLES.GUEST], { id });

  const access = await getRequests(id);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "approved":
        return "bg-green-100 text-green-800 border-green-300";
      case "denied":
        return "bg-red-100 text-red-800 border-red-300";
      case "banned":
        return "bg-gray-900 text-white border-gray-900";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "قيد المراجعة",
      approved: "موافق عليه",
      denied: "مرفوض",
      banned: "محظور",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center justify-between gap-4 md:flex-row">
          <h2 className="text-2xl font-bold text-gray-900">طلب الوصول</h2>
          {(!access?.status || access.status === "denied") && (
            <AccessRequestForm />
          )}
        </div>

        {!access?.status ? (
          <div className="mb-6 rounded border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800">
            <p className="font-bold">👋 مرحبًا بك في لوحة التحكم</p>
            <p className="mt-1 text-sm">
              لا يوجد لديك طلبات سابقة. اضغط على "طلب جديد" لإرسال طلبك
            </p>
          </div>
        ) : access.status === "denied" ? (
          <div className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            <p className="font-bold">❌ تم رفض طلبك</p>
            <p className="mt-1 text-sm">
              تم رفض طلبك السابق. يمكنك تقديم طلب جديد إذا كنت تعتقد أن هناك خطأ
            </p>
          </div>
        ) : access?.status === "banned" ? (
          <div className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            <p className="font-bold">🚫 تم حظرك</p>
            <p className="mt-1 text-sm">لا يمكنك تقديم طلبات جديدة</p>
          </div>
        ) : access?.status === "approved" ? (
          <div className="mb-6 rounded border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            <p className="font-bold">✓ تمت الموافقة على طلبك</p>
            <p className="mt-1 text-sm">
              لديك طلب موافق عليه. لا حاجة لإرسال طلب جديد
            </p>
          </div>
        ) : access?.status === "pending" ? (
          <div className="mb-6 rounded border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-800">
            <p className="font-bold">⏳ لديك طلب قيد المراجعة</p>
            <p className="mt-1 text-sm">
              لا يمكنك تقديم طلب جديد حتى تتم مراجعة طلبك الحالي
            </p>
          </div>
        ) : null}

        {access && access.requests.length > 0 && (
          <div className="border-t border-gray-200 pt-6">
            <div className="space-y-4">
              {access.requests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span>👤 {request.full_name_arabic}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>📱 {request.phone_number}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>
                          📅 تم الإرسال:{" "}
                          {new Date(request.created_at).toLocaleDateString(
                            "ar-MA",
                          )}
                        </span>
                      </div>
                      {request.reviewed_at && (
                        <div className="flex items-center gap-2">
                          <span>
                            ✓ تمت المراجعة:{" "}
                            {new Date(request.reviewed_at).toLocaleDateString(
                              "ar-MA",
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mb-2 flex items-center gap-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(
                          request.status,
                        )}`}
                      >
                        {getStatusLabel(request.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
