import { getRequests, getUser } from "@/actions";
import AccessRequestForm from "@/components/access-request-form";
import UserDropdown from "@/components/user-dropdown";
import { getIdFromToken } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Page() {
  const id = await getIdFromToken();
  const user = await getUser(id);
  if (!user) redirect("/login");
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg--white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <svg
                viewBox="0 0 500 500"
                fill="none"
                className="mt-2 size-12"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* <rect width="500" height="500" fill="black" /> */}
                {/* <path
                  d="M213.855 95H190.084V118.771H166.313H142.542V142.542H118.771V166.313V190.084H95V213.855V237.626V261.397V285.168V308.939H118.771V332.71V356.481H142.542V380.252H166.313H190.084V404.023H213.855H237.626H261.397H285.168H308.939V380.252H332.71H356.481V356.481H380.252V332.71V308.939H404.023V285.168V261.397V237.626V213.855V190.084H380.252V166.313V142.542H356.481V118.771H332.71H308.939V95H285.168H261.397H237.626H213.855Z"
                  fill="black"
                /> */}
                <path
                  d="M342.99 180.629C347.981 180.629 337.847 180.632 342.99 180.632C342.99 201.311 342.99 189.575 342.99 210.881C353.275 210.881 333.007 210.881 342.99 210.881C342.99 221.577 342.99 232.273 342.99 243.293C333.007 243.293 323.024 243.293 312.738 243.293C312.738 253.276 312.738 263.259 312.738 273.544C302.042 273.544 291.346 273.544 280.326 273.544C280.326 284.24 280.326 294.936 280.326 305.956C270.344 305.956 260.361 305.956 250.075 305.956C250.075 310.948 250.075 315.939 250.075 321.082C239.379 321.082 228.683 321.082 217.663 321.082C217.663 316.09 217.663 311.099 217.663 305.956C207.68 305.956 197.697 305.956 187.412 305.956C187.412 295.26 187.412 284.564 187.412 273.544C176.716 273.544 166.02 273.544 155 273.544C155 252.865 155 249.473 155 228.167C159.991 228.167 164.983 228.167 170.126 228.167C170.126 222.29 170.126 233.872 170.126 228.167C175.83 228.167 181.535 228.167 187.412 228.167C187.412 233.159 187.412 238.15 187.412 243.293C197.395 243.293 207.378 243.293 217.663 243.293C217.663 253.276 217.663 263.259 217.663 273.544C228.359 273.544 239.055 273.544 250.075 273.544C250.075 263.561 250.075 253.578 250.075 243.293C260.058 243.293 270.041 243.293 280.326 243.293C280.326 232.597 280.326 221.901 280.326 210.881C291.022 210.881 301.718 210.881 312.738 210.881C312.738 200.898 312.738 190.915 312.738 180.63C322.721 180.63 332.704 180.629 342.99 180.629C342.99 185.771 342.99 175.637 342.99 180.629C337.847 180.629 347.981 180.629 342.99 180.629C342.99 186.506 342.99 174.924 342.99 180.629Z"
                  fill="black"
                />
              </svg>

              <h1 className="font-handjet text-3xl font-extrabold">ورد</h1>
            </div>
            <UserDropdown user={user} />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
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
                  تم رفض طلبك السابق. يمكنك تقديم طلب جديد إذا كنت تعتقد أن هناك
                  خطأ
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
                                {new Date(
                                  request.reviewed_at,
                                ).toLocaleDateString("ar-MA")}
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
      </main>
    </div>
  );
}
