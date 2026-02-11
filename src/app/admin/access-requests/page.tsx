"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AccessRequest {
  id: string;
  full_name_arabic: string;
  phone_number: string;
  status: "pending" | "approved" | "denied" | "banned";
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  reviewed_by_user?: { username: string };
}

export default function AdminAccessRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "denied" | "banned"
  >("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/access-requests");
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push("/login");
          return;
        }
        throw new Error("فشل في جلب الطلبات");
      }
      const data = await response.json();
      setRequests(data.requests);
    } catch {
      setError("حدث خطأ. الرجاء المحاولة مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (
    requestId: string,
    action: "approve" | "deny" | "ban",
  ) => {
    const actionLabels = {
      approve: "الموافقة على",
      deny: "رفض",
      ban: "حظر",
    };

    if (!confirm(`هل أنت متأكد من ${actionLabels[action]} هذا الطلب؟`)) {
      return;
    }

    setActionLoading(requestId);
    try {
      const response = await fetch(`/api/access-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update request");
      }

      // Refresh the list
      await fetchRequests();
    } catch {
      alert("حدث خطأ. الرجاء المحاولة مرة أخرى");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === "all") return true;
    return req.status === filter;
  });

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            إدارة طلبات الوصول
          </h1>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            {error}
          </div>
        )}

        {/* Filter buttons */}
        <div className="mb-6 flex flex-wrap gap-2">
          {(["all", "pending", "approved", "denied", "banned"] as const).map(
            (filterOption) => {
              const labels = {
                all: "الكل",
                pending: "قيد المراجعة",
                approved: "موافق عليه",
                denied: "مرفوض",
                banned: "محظور",
              };
              return (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    filter === filterOption
                      ? "bg-indigo-600 text-white"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {labels[filterOption]} (
                  {filterOption === "all"
                    ? requests.length
                    : requests.filter((r) => r.status === filterOption).length}
                  )
                </button>
              );
            },
          )}
        </div>

        {/* Requests list */}
        <div className="overflow-hidden bg-white shadow sm:rounded-md">
          {filteredRequests.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">لا توجد طلبات</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <li
                  key={request.id}
                  className="p-6 transition-colors hover:bg-gray-50"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <h3
                          className="text-lg font-semibold text-gray-900"
                          dir="rtl"
                        >
                          {request.full_name_arabic}
                        </h3>
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getStatusBadgeClass(
                            request.status,
                          )}`}
                        >
                          {getStatusLabel(request.status)}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">📱 الهاتف:</span>
                          <span className="font-mono">
                            {request.phone_number}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">📅 تاريخ الطلب:</span>
                          <span>
                            {new Date(request.created_at).toLocaleString(
                              "ar-MA",
                            )}
                          </span>
                        </div>
                        {request.reviewed_at && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">✓ تمت المراجعة:</span>
                            <span>
                              {new Date(request.reviewed_at).toLocaleString(
                                "ar-MA",
                              )}
                            </span>
                            {request.reviewed_by_user && (
                              <span className="text-gray-500">
                                بواسطة {request.reviewed_by_user.username}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {request.status === "pending" && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleAction(request.id, "approve")}
                          disabled={actionLoading === request.id}
                          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          ✓ موافقة
                        </button>
                        <button
                          onClick={() => handleAction(request.id, "deny")}
                          disabled={actionLoading === request.id}
                          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          ✗ رفض
                        </button>
                        <button
                          onClick={() => handleAction(request.id, "ban")}
                          disabled={actionLoading === request.id}
                          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus:ring-2 focus:ring-gray-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          🚫 حظر
                        </button>
                      </div>
                    )}

                    {request.status === "denied" && (
                      <div className="text-sm text-gray-500 italic">
                        يمكن للمستخدم إعادة تقديم طلب جديد
                      </div>
                    )}

                    {request.status === "banned" && (
                      <div className="text-sm font-medium text-red-600">
                        المستخدم محظور من تقديم طلبات جديدة
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
