"use client";

import AccessRequestForm from "@/components/access-request-form";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface User {
  id: string;
  username: string;
  email: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

interface AccessRequest {
  id: string;
  full_name_arabic: string;
  phone_number: string;
  status: "pending" | "approved" | "denied" | "banned";
  created_at: string;
  reviewed_at?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRequests, setUserRequests] = useState<AccessRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserRequestsByUserId();
    }
  }, [user]);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/user");

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
      } else {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/login");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const [showAccessForm, setShowAccessForm] = useState(false);

  const fetchUserRequestsByUserId = async () => {
    setRequestsLoading(true);
    try {
      const response = await fetch("/api/access-requests/user-requests");
      if (response.ok) {
        const data = await response.json();
        setUserRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Failed to fetch user requests:", error);
    } finally {
      setRequestsLoading(false);
    }
  };

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

  const hasPendingRequest = userRequests.some(
    (req) => req.status === "pending",
  );
  const isBanned = userRequests.some((req) => req.status === "banned");
  const hasApprovedRequest = userRequests.some(
    (req) => req.status === "approved",
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.username}
                  className="h-10 w-10 rounded-full border-2 border-gray-200"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-700">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {user.username}
                </h1>
                <p className="text-xs text-gray-600 capitalize">Role: {user.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {['member', 'admin', 'owner'].includes(user.role) && (
                <button
                  onClick={() => router.push('/tasks')}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                >
                  {user.role === 'member' ? 'My Tasks' : 'Tasks'}
                </button>
              )}
              {['admin', 'owner'].includes(user.role) && (
                <>
                  <button
                    onClick={() => router.push('/admin/tasks')}
                    className="rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
                  >
                    Task Management
                  </button>
                  <button
                    onClick={() => router.push('/admin/users')}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700"
                  >
                    User Management
                  </button>
                  <button
                    onClick={() => router.push('/admin/access-requests')}
                    className="rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                  >
                    Access Requests
                  </button>
                </>
              )}
              <button
                onClick={handleLogout}
                className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-lg">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                مرحباً بك في ورد!
              </h3>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-lg bg-gray-50 p-6">
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  معرف الحساب
                </h3>
                <p className="font-mono text-sm break-all text-gray-600">
                  {user.id}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  عضو منذ
                </h3>
                <p className="text-gray-600">
                  {new Date(user.created_at).toLocaleDateString("ar-MA")}
                </p>
              </div>
            </div>
          </div>

          {/* Access Request Section */}
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">طلب الوصول</h2>
              </div>
              {!requestsLoading &&
                !hasPendingRequest &&
                !isBanned &&
                !hasApprovedRequest && (
                  <button
                    onClick={() => setShowAccessForm(true)}
                    className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700"
                  >
                    📝 طلب جديد
                  </button>
                )}
            </div>

            {/* Banned warning */}
            {isBanned && (
              <div className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-800">
                <p className="font-bold">🚫 تم حظرك</p>
                <p className="mt-1 text-sm">لا يمكنك تقديم طلبات جديدة</p>
              </div>
            )}

            {/* Approved request info */}
            {hasApprovedRequest && (
              <div className="mb-6 rounded border border-green-200 bg-green-50 px-4 py-3 text-green-800">
                <p className="font-bold">✓ تمت الموافقة على طلبك</p>
                <p className="mt-1 text-sm">
                  لديك طلب موافق عليه. لا حاجة لإرسال طلب جديد
                </p>
              </div>
            )}

            {/* Pending request warning */}
            {hasPendingRequest && !hasApprovedRequest && (
              <div className="mb-6 rounded border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-800">
                <p className="font-bold">⏳ لديك طلب قيد المراجعة</p>
                <p className="mt-1 text-sm">
                  لا يمكنك تقديم طلب جديد حتى تتم مراجعة طلبك الحالي
                </p>
              </div>
            )}

            {/* Access Request Modal */}

            <AccessRequestForm
              showAccessForm={showAccessForm}
              setShowAccessForm={setShowAccessForm}
              fetchUserRequestsByUserId={fetchUserRequestsByUserId}
            />

            {!hasPendingRequest && userRequests.length === 0 && (
              <div className="py-8 text-center text-gray-500">
                <p>
                  لديك حاجة للوصول إلى النظام؟ اضغط على "طلب جديد" لإرسال طلبك
                </p>
              </div>
            )}

            {/* User's Requests List */}
            {userRequests.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <div className="space-y-4">
                  {requestsLoading ? (
                    <div className="py-4 text-center text-gray-500">
                      جاري التحميل...
                    </div>
                  ) : (
                    userRequests.map((request) => (
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
                                {new Date(
                                  request.created_at,
                                ).toLocaleDateString("ar-MA")}
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
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
