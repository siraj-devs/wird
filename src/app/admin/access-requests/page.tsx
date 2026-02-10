'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AccessRequest {
  id: string;
  full_name_arabic: string;
  phone_number: string;
  status: 'pending' | 'approved' | 'denied' | 'banned';
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  reviewed_by_user?: { username: string };
}

export default function AdminAccessRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied' | 'banned'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/access-requests');
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/login');
          return;
        }
        throw new Error('فشل في جلب الطلبات');
      }
      const data = await response.json();
      setRequests(data.requests);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (requestId: string, action: 'approve' | 'deny' | 'ban') => {
    const actionLabels = {
      approve: 'الموافقة على',
      deny: 'رفض',
      ban: 'حظر'
    };

    if (!confirm(`هل أنت متأكد من ${actionLabels[action]} هذا الطلب؟`)) {
      return;
    }

    setActionLoading(requestId);
    try {
      const response = await fetch(`/api/access-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update request');
      }

      // Refresh the list
      await fetchRequests();
    } catch (err: any) {
      alert('خطأ: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'denied':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'banned':
        return 'bg-gray-900 text-white border-gray-900';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'قيد المراجعة',
      approved: 'موافق عليه',
      denied: 'مرفوض',
      banned: 'محظور'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">إدارة طلبات الوصول</h1>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Filter buttons */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {(['all', 'pending', 'approved', 'denied', 'banned'] as const).map((filterOption) => {
            const labels = {
              all: 'الكل',
              pending: 'قيد المراجعة',
              approved: 'موافق عليه',
              denied: 'مرفوض',
              banned: 'محظور'
            };
            return (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === filterOption
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {labels[filterOption]}
                {' '}
                ({filterOption === 'all' ? requests.length : requests.filter((r) => r.status === filterOption).length})
              </button>
            );
          })}
        </div>

        {/* Requests list */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">لا توجد طلبات</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <li key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900" dir="rtl">
                          {request.full_name_arabic}
                        </h3>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(
                            request.status
                          )}`}
                        >
                          {getStatusLabel(request.status)}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">📱 الهاتف:</span>
                          <span className="font-mono">{request.phone_number}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">📅 تاريخ الطلب:</span>
                          <span>{new Date(request.created_at).toLocaleString('ar-MA')}</span>
                        </div>
                        {request.reviewed_at && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">✓ تمت المراجعة:</span>
                            <span>{new Date(request.reviewed_at).toLocaleString('ar-MA')}</span>
                            {request.reviewed_by_user && (
                              <span className="text-gray-500">بواسطة {request.reviewed_by_user.username}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleAction(request.id, 'approve')}
                          disabled={actionLoading === request.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          ✓ موافقة
                        </button>
                        <button
                          onClick={() => handleAction(request.id, 'deny')}
                          disabled={actionLoading === request.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          ✗ رفض
                        </button>
                        <button
                          onClick={() => handleAction(request.id, 'ban')}
                          disabled={actionLoading === request.id}
                          className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          🚫 حظر
                        </button>
                      </div>
                    )}

                    {request.status === 'denied' && (
                      <div className="text-sm text-gray-500 italic">
                        يمكن للمستخدم إعادة تقديم طلب جديد
                      </div>
                    )}

                    {request.status === 'banned' && (
                      <div className="text-sm text-red-600 font-medium">
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
