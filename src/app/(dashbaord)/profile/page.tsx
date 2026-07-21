import { getUser } from "@/actions";
import { checkRole, getIdFromToken } from "@/lib/auth-server";
import { getRoleLabel, ROLES } from "@/lib/roles";
import Image from "next/image";
import { redirect } from "next/navigation";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-gray-100 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}

export default async function ProfilePage() {
  await checkRole([
    ROLES.GUEST,
    ROLES.NEWCOMER,
    ROLES.MEMBER,
    ROLES.ADMIN,
    ROLES.OWNER,
    ROLES.EXPELLED,
  ]);

  const id = await getIdFromToken();
  const user = await getUser(id);
  if (!user) redirect("/logout");

  const connections = user.connections ?? [];

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-8 text-center">
        <h1 className="font-kufam text-2xl font-bold text-gray-900">
          الملف الشخصي
        </h1>
        <p className="mt-2 text-gray-600">عرض معلومات حسابك (للقراءة فقط)</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center gap-4 border-b border-gray-100 px-5 py-5">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={user.username}
              width={56}
              height={56}
              className="size-14 rounded-full"
            />
          ) : (
            <div className="flex size-14 items-center justify-center rounded-full bg-gray-200 text-lg font-bold text-gray-700">
              {(user.name ?? user.username).charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900">
              {user.name ?? user.username}
            </p>
            <p className="text-sm text-gray-500">{getRoleLabel(user.role)}</p>
          </div>
        </div>

        <dl className="px-5 py-2">
          <InfoRow label="الاسم" value={user.name ?? "—"} />
          <InfoRow label="البريد الإلكتروني" value={user.email ?? "—"} />
          <InfoRow label="رقم الهاتف" value={user.phone ?? "—"} />
          <InfoRow label="اسم المستخدم" value={`@${user.username}`} />
        </dl>
      </div>

      {connections.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-900">الاتصالات</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {connections.map((connection) => (
              <li
                key={connection.id}
                className="flex items-center gap-3 px-5 py-3"
              >
                {connection.avatar ? (
                  <Image
                    src={connection.avatar}
                    alt={connection.username}
                    width={36}
                    height={36}
                    className="size-9 rounded-full"
                  />
                ) : (
                  <div className="flex size-9 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                    {connection.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {connection.name}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    @{connection.username}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    connection.type === "telegram"
                      ? "bg-sky-50 text-sky-700"
                      : "bg-indigo-50 text-indigo-700"
                  }`}
                >
                  {connection.type === "telegram" ? "تيليغرام" : "ديسكورد"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
