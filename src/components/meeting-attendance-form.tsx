"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type CSSProperties } from "react";

type AttendanceStatus = "present" | "absent" | "appeal";

type AppAttendee = {
  user_id: string;
  full_name: string | null;
  username: string;
  status: AttendanceStatus;
};

type GuestAttendee = {
  guest_name: string;
  status: AttendanceStatus;
};

type AppUserOption = {
  user_id: string;
  full_name: string | null;
  username: string;
};

const STATUS_OPTIONS: Array<{ value: AttendanceStatus; label: string }> = [
  { value: "present", label: "حاضر" },
  { value: "absent", label: "غائب" },
  { value: "appeal", label: "اعتذار" },
];

const STATUS_SELECT_STYLES: Record<AttendanceStatus, CSSProperties> = {
  present: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    color: "#047857",
  },
  absent: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    color: "#b91c1c",
  },
  appeal: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
    color: "#b45309",
  },
};

export default function MeetingAttendanceForm({
  meetingDate,
  appUsers,
  appAttendees,
  guestAttendees,
}: {
  meetingDate: string;
  appUsers: AppUserOption[];
  appAttendees: AppAttendee[];
  guestAttendees: GuestAttendee[];
}) {
  const router = useRouter();
  const [usersState, setUsersState] = useState(appAttendees);
  const [guestsState, setGuestsState] = useState(guestAttendees);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const remainingAppUsers = appUsers.filter(
    (user) => !usersState.some((item) => item.user_id === user.user_id),
  );

  const summary = useMemo(() => {
    const all = [
      ...usersState.map((u) => u.status),
      ...guestsState
        .filter((g) => g.guest_name.trim().length > 0)
        .map((g) => g.status),
    ];

    return {
      present: all.filter((status) => status === "present").length,
      absent: all.filter((status) => status === "absent").length,
      appeal: all.filter((status) => status === "appeal").length,
      total: all.length,
    };
  }, [usersState, guestsState]);

  const addAppUser = () => {
    if (!selectedUserId) return;

    const selectedUser = remainingAppUsers.find(
      (user) => user.user_id === selectedUserId,
    );

    if (!selectedUser) return;

    setUsersState((current) => [
      ...current,
      {
        user_id: selectedUser.user_id,
        full_name: selectedUser.full_name,
        username: selectedUser.username,
        status: "present",
      },
    ]);
    setSelectedUserId("");
  };

  const updateUserStatus = (userId: string, status: AttendanceStatus) => {
    setUsersState((current) =>
      current.map((item) =>
        item.user_id === userId ? { ...item, status } : item,
      ),
    );
  };

  const removeUser = (userId: string) => {
    setUsersState((current) =>
      current.filter((item) => item.user_id !== userId),
    );
  };

  const updateGuest = (
    index: number,
    field: "guest_name" | "status",
    value: string,
  ) => {
    setGuestsState((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        if (field === "status") {
          return { ...item, status: value as AttendanceStatus };
        }
        return { ...item, guest_name: value };
      }),
    );
  };

  const addGuest = () => {
    setGuestsState((current) => [
      ...current,
      { guest_name: "", status: "present" as AttendanceStatus },
    ]);
  };

  const removeGuest = (index: number) => {
    setGuestsState((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const onSave = async () => {
    setError(null);
    setMessage(null);
    setIsSaving(true);

    try {
      const attendees = [
        ...usersState.map((user) => ({
          user_id: user.user_id,
          guest_name: null,
          status: user.status,
        })),
        ...guestsState
          .filter((guest) => guest.guest_name.trim().length > 0)
          .map((guest) => ({
            user_id: null,
            guest_name: guest.guest_name.trim(),
            status: guest.status,
          })),
      ];

      console.log("Saving attendees:", attendees);

      const response = await fetch("/api/meeting-attendance", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meeting_date: meetingDate,
          attendees,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? "تعذر حفظ الحضور.");
      }

      setMessage("تم حفظ الحضور بنجاح.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر حفظ الحضور.");
    } finally {
      setIsSaving(false);
    }
  };

  const trashIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="size-4"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  );

  const getStatusSelectStyle = (status: AttendanceStatus): CSSProperties => ({
    ...STATUS_SELECT_STYLES[status],
    boxShadow: "none",
  });

  return (
    <div className="space-y-5" dir="rtl">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="ds-card-soft">
          <p className="text-xs text-gray-500">الحضور</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">
            {summary.present}
          </p>
        </div>
        <div className="ds-card-soft">
          <p className="text-xs text-gray-500">الغياب</p>
          <p className="mt-1 text-xl font-bold text-rose-700">
            {summary.absent}
          </p>
        </div>
        <div className="ds-card-soft">
          <p className="text-xs text-gray-500">الاعتذارات</p>
          <p className="mt-1 text-xl font-bold text-amber-700">
            {summary.appeal}
          </p>
        </div>
        <div className="ds-card-soft">
          <p className="text-xs text-gray-500">الإجمالي</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {summary.total}
          </p>
        </div>
      </div>

      <section className="ds-card-soft space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              أعضاء التطبيق
            </h3>
            <p className="text-xs text-gray-500">
              أضف العضو المطلوب فقط، ثم اختر حالة حضوره.
            </p>
          </div>

          <div className="flex gap-2">
            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              className="ds-select min-w-64"
            >
              <option value="">اختر عضوًا لإضافته</option>
              {remainingAppUsers.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {user.full_name ?? user.username}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={addAppUser}
              disabled={!selectedUserId}
              className="rounded-lg border border-primary-200 px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              إضافة
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {usersState.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
              لا يوجد أعضاء مضافون بعد.
            </p>
          ) : null}
          {usersState.map((user) => (
            <div
              key={user.user_id}
              className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  {user.full_name ?? user.username}
                </p>
                <p className="text-xs text-gray-500">@{user.username}</p>
              </div>

              <div className="flex gap-2 sm:items-center">
                <select
                  value={user.status}
                  onChange={(event) =>
                    updateUserStatus(
                      user.user_id,
                      event.target.value as AttendanceStatus,
                    )
                  }
                  className="ds-select w-full sm:w-44"
                  style={getStatusSelectStyle(user.status)}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => removeUser(user.user_id)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  aria-label={`حذف ${user.full_name ?? user.username}`}
                  title="حذف"
                >
                  {trashIcon}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="ds-card-soft space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">
            أشخاص خارج التطبيق
          </h3>
          <button
            type="button"
            onClick={addGuest}
            className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50"
          >
            إضافة شخص
          </button>
        </div>

        <div className="space-y-2">
          {guestsState.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
              لا يوجد أشخاص خارجيون مضافون بعد.
            </p>
          ) : null}
          {guestsState.map((guest, index) => (
            <div
              key={index}
              className="grid gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:grid-cols-[1fr_180px_auto]"
            >
              <input
                value={guest.guest_name}
                onChange={(event) =>
                  updateGuest(index, "guest_name", event.target.value)
                }
                placeholder="اسم الشخص"
                className="ds-input"
              />

              <div className="flex gap-2 sm:items-center">
                <select
                  value={guest.status}
                  onChange={(event) =>
                    updateGuest(index, "status", event.target.value)
                  }
                  className="ds-select"
                  style={getStatusSelectStyle(guest.status)}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => removeGuest(index)}
                  className="inline-flex size-9 aspect-square items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  aria-label="حذف الشخص"
                  title="حذف"
                >
                  {trashIcon}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {message ? (
        <p className="ds-badge-primary px-3 py-2 text-sm">{message}</p>
      ) : null}
      {error ? <p className="ds-error">{error}</p> : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? "جارٍ الحفظ..." : "حفظ الحضور"}
        </button>
      </div>
    </div>
  );
}
