import { getConnections, getUsers } from "@/actions";
import { checkRole } from "@/lib/auth-server";
import { getRoleLabel, ROLES } from "@/lib/roles";
import Image from "next/image";

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("ar-MA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default async function PanelUsersPage() {
  await checkRole([ROLES.OWNER, ROLES.ADMIN]);

  const [users, connections] = await Promise.all([
    getUsers(),
    getConnections(),
  ]);

  const usersById = new Map(users.map((user) => [user.id, user]));

  return (
    <div className="ds-page space-y-8">
      <section className="ds-card">
        <div className="ds-section-header mb-6">
          <div>
            <h2 className="ds-title">المستخدمون</h2>
            <p className="ds-subtitle">
              حسابات المصادقة من قاعدة بيانات الهوية ({users.length})
            </p>
          </div>
        </div>

        {users.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            لا يوجد مستخدمون بعد.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-right text-sm">
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
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {user.avatar_url ? (
                          <Image
                            src={user.avatar_url}
                            alt={user.username}
                            width={32}
                            height={32}
                            className="size-8 rounded-full"
                          />
                        ) : (
                          <div className="flex size-8 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700">
                            {(user.name ?? user.username).charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">
                            {user.name ?? "—"}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-700" dir="ltr">
                      {user.email ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-gray-700" dir="ltr">
                      {user.phone ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-600">
                      {(user.connections ?? [])
                        .map((c) =>
                          c.type === "telegram" ? "تيليغرام" : "ديسكورد",
                        )
                        .join(" · ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="ds-card">
        <div className="ds-section-header mb-6">
          <div>
            <h2 className="ds-title">الاتصالات</h2>
            <p className="ds-subtitle">
              حسابات ديسكورد وتيليغرام المرتبطة ({connections.length})
            </p>
          </div>
        </div>

        {connections.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            لا توجد اتصالات بعد.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-right text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="px-3 py-2 font-medium">الاتصال</th>
                  <th className="px-3 py-2 font-medium">النوع</th>
                  <th className="px-3 py-2 font-medium">المستخدم</th>
                  <th className="px-3 py-2 font-medium">أول تفويض</th>
                  <th className="px-3 py-2 font-medium">آخر وصول</th>
                </tr>
              </thead>
              <tbody>
                {connections.map((connection) => {
                  const owner = usersById.get(connection.user_id);
                  return (
                    <tr
                      key={connection.id}
                      className="border-b border-gray-100"
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          {connection.avatar ? (
                            <Image
                              src={connection.avatar}
                              alt={connection.username}
                              width={32}
                              height={32}
                              className="size-8 rounded-full"
                            />
                          ) : (
                            <div className="flex size-8 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700">
                              {connection.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-900">
                              {connection.name}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              @{connection.username}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
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
                      </td>
                      <td className="px-3 py-3 text-gray-700">
                        {owner?.name ?? owner?.username ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-gray-600">
                        {formatDate(connection.authorized_at)}
                      </td>
                      <td className="px-3 py-3 text-gray-600">
                        {formatDate(connection.accessed_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
