"use client";

import { getRoleLabel, ROLES } from "@/lib/roles";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

function getRoleBadgeClass(role: Role) {
  switch (role) {
    case ROLES.OWNER:
      return "bg-purple-100 text-purple-800 border-purple-300";
    case ROLES.ADMIN:
      return "bg-blue-100 text-blue-800 border-blue-300";
    case ROLES.MEMBER:
      return "bg-green-100 text-green-800 border-green-300";
    case ROLES.EXPELLED:
      return "bg-red-100 text-red-800 border-red-300";
    case ROLES.NEWCOMER:
    case ROLES.GUEST:
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

export default function ManageAuthUsers({
  currentUserId,
  canEditRoles,
  users,
}: {
  currentUserId: string;
  canEditRoles: boolean;
  users: User[];
}) {
  const [updating, setUpdating] = useState<string | null>(null);
  const router = useRouter();

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdating(userId);

    if (!Object.values(ROLES).includes(newRole as Role)) {
      setUpdating(null);
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) throw new Error("Failed to update role");
      router.refresh();
    } catch (error) {
      console.error("Error updating role:", error);
    } finally {
      setUpdating(null);
    }
  };

  if (users.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500">
        لا يوجد مستخدمون بعد.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-160 text-right text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500">
            <th className="px-3 py-2 font-medium">المستخدم</th>
            <th className="px-3 py-2 font-medium">البريد</th>
            <th className="px-3 py-2 font-medium">الهاتف</th>
            <th className="px-3 py-2 font-medium">الدور</th>
            <th className="px-3 py-2 font-medium">الاتصالات</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const primary = user.connections?.[0];
            const displayName = user.name ?? primary?.name ?? "—";
            const initial = displayName.charAt(0);

            return (
              <tr key={user.id} className="border-b border-gray-100">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    {primary?.avatar ? (
                      <Image
                        src={primary.avatar}
                        alt={displayName}
                        width={32}
                        height={32}
                        className="size-8 rounded-full"
                      />
                    ) : (
                      <div className="flex size-8 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700">
                        {initial}
                      </div>
                    )}
                    <p className="truncate font-medium text-gray-900">
                      {displayName}
                    </p>
                  </div>
                </td>
                <td className="px-3 py-3 text-gray-700" dir="ltr">
                  {user.email ?? "—"}
                </td>
                <td className="px-3 py-3 text-gray-700" dir="ltr">
                  {user.phone ?? "—"}
                </td>
                <td className="px-3 py-3">
                  {canEditRoles ? (
                    <select
                      value={user.role}
                      disabled={
                        user.id === currentUserId || updating === user.id
                      }
                      onKeyDown={(e) => {
                        if (user.id === currentUserId) e.preventDefault();
                      }}
                      onMouseDown={(e) => {
                        if (user.id === currentUserId) e.preventDefault();
                      }}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.currentTarget.value)
                      }
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-primary-500 focus:outline-none disabled:border-gray-300 disabled:bg-gray-50 disabled:text-gray-400 ${getRoleBadgeClass(user.role)}`}
                    >
                      {Object.values(ROLES).map((role) => (
                        <option
                          key={role}
                          value={role}
                          disabled={role === user.role}
                          className="bg-white text-black disabled:text-gray-300"
                        >
                          {getRoleLabel(role)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeClass(user.role)}`}
                    >
                      {getRoleLabel(user.role)}
                    </span>
                  )}
                </td>
                <td className="px-3 py-3">
                  {(user.connections ?? []).length === 0 ? (
                    <span className="text-gray-400">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {(user.connections ?? []).map((connection) => (
                        <span
                          key={connection.id}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            connection.type === "telegram"
                              ? "bg-sky-50 text-sky-700"
                              : "bg-indigo-50 text-indigo-700"
                          }`}
                        >
                          {connection.type === "telegram"
                            ? "تيليغرام"
                            : "ديسكورد"}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
