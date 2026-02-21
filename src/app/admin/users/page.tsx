"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface User {
  id: string;
  username: string;
  email?: string;
  role: string;
  avatar_url?: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/user");
      if (!response.ok) {
        router.push("/login");
        return;
      }
      const data = await response.json();

      if (!["admin", "owner"].includes(data.user.role)) {
        router.push("/");
        return;
      }

      setCurrentUser(data.user);
      await Promise.all([fetchUsers()]);
    } catch (error) {
      console.error("Auth check failed:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (userId === currentUser?.id) {
      alert("You cannot change your own role");
      return;
    }

    if (newRole === "owner" && currentUser?.role !== "owner") {
      alert("Only owners can assign the owner role");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to change this user's role to ${newRole}?`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        await fetchUsers();
        setEditingUserId(null);
        setSelectedRole("");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update role");
      }
    } catch (error) {
      console.error("Failed to update role:", error);
      alert("Failed to update role");
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "admin":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "member":
        return "bg-green-100 text-green-800 border-green-300";
      case "guest":
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const filteredUsers = users;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              User Management
            </h1>
            <p className="mt-2 text-gray-600">
              Manage user roles and permissions
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.push("/admin/tasks")}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
            >
              Task Management
            </button>
            <button
              onClick={() => router.push("/")}
              className="rounded-lg bg-gray-600 px-4 py-2 text-white transition hover:bg-gray-700"
            >
              Dashboard
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or phone..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Filter by Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="guest">Guest</option>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Full Name (Arabic)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Phone Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.avatar_url ? (
                          <Image
                            src={user.avatar_url}
                            alt={user.username}
                            className="h-10 w-10 rounded-full"
                            width={40}
                            height={40}
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                            <span className="font-semibold text-gray-600">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.username}
                          </div>
                          {user.id === currentUser?.id && (
                            <div className="text-xs text-blue-600">(You)</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                      {user.email || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs leading-5 font-semibold ${getRoleBadgeClass(user.role)}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {editingUserId === user.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="rounded border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          >
                            <option value="">Select role</option>
                            <option value="guest">Guest</option>
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                            {currentUser?.role === "owner" && (
                              <option value="owner">Owner</option>
                            )}
                          </select>
                          <button
                            onClick={() =>
                              handleRoleChange(user.id, selectedRole)
                            }
                            disabled={!selectedRole}
                            className="rounded bg-green-600 px-2 py-1 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingUserId(null);
                              setSelectedRole("");
                            }}
                            className="rounded bg-gray-600 px-2 py-1 text-white hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingUserId(user.id);
                            setSelectedRole(user.role);
                          }}
                          disabled={user.id === currentUser?.id}
                          className="text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:text-gray-400"
                        >
                          Change Role
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              No users found matching your criteria.
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="text-sm font-medium text-gray-500">Total Users</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {users.length}
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="text-sm font-medium text-gray-500">Members</div>
            <div className="mt-2 text-3xl font-bold text-green-600">
              {users.filter((u) => u.role === "member").length}
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="text-sm font-medium text-gray-500">Admins</div>
            <div className="mt-2 text-3xl font-bold text-blue-600">
              {users.filter((u) => u.role === "admin").length}
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="text-sm font-medium text-gray-500">Guests</div>
            <div className="mt-2 text-3xl font-bold text-gray-600">
              {users.filter((u) => u.role === "guest").length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
