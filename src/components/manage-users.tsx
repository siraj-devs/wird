"use client";

import { getRoleLabel, ROLES } from "@/lib/roles";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ManageUsers({
  id,
  users,
}: {
  id: string;
  users: Awaited<User[]>;
}) {
  const [updating, setUpdating] = useState<string | null>(null);
  const router = useRouter();

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdating(userId);

    if (!Object.values(ROLES).includes(newRole as Role)) {
      console.error("Invalid role:", newRole);
      setUpdating(null);
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
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

  const getRoleBadgeClass = (role: Role) => {
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
  };

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                  المستخدم
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                  الاسم الكامل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                  رقم الهاتف
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                  البريد الإلكتروني
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                  الدور
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                  تاريخ الانضمام
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {users.map((user) => (
                <tr key={user.id} className="table-row hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt={user.username}
                          className="size-8 rounded-full"
                          width={40}
                          height={40}
                        />
                      ) : (
                        <div className="flex size-8 items-center justify-center rounded-full bg-gray-200">
                          <span className="font-semibold text-gray-600">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="mr-2">
                        <div className="text-sm font-medium text-gray-900">
                          {user.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                    {user.full_name || "غير متوفر"}
                  </td>
                  <td
                    dir={user.phone_number ? "ltr" : "rtl"}
                    className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 rtl:text-right"
                  >
                    {user.phone_number || "غير متوفر"}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                    {user.email || "غير متوفر"}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onKeyDown={(e) => {
                        if (user.id === id) e.preventDefault();
                      }}
                      onMouseDown={(e) => {
                        if (user.id === id) e.preventDefault();
                      }}
                      onTouchStart={(e) => {
                        if (user.id === id) e.preventDefault();
                      }}
                      disabled={user.id === id || updating === user.id}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.currentTarget.value)
                      }
                      className={`w-full cursor-pointer appearance-none rounded-full border px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-primary-500 focus:outline-none disabled:border-gray-300 disabled:bg-gray-50 disabled:text-gray-400 ${getRoleBadgeClass(user.role)}`}
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
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                    {new Date(user.created_at).toLocaleDateString("ar-MA")}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/tasks/${user.id}`}
                      className={`rounded-full border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700`}
                    >
                      مهام
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
