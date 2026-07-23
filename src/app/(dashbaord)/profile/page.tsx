import { getSessionUser } from "@/actions";
import { checkRole } from "@/lib/auth-server";
import { getRoleLabel, ROLES } from "@/lib/roles";
import { UserIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { redirect } from "next/navigation";

function getRoleBadgeClass(role: Role) {
  switch (role) {
    case ROLES.OWNER:
      return "bg-purple-100 text-purple-800 border-purple-200";
    case ROLES.ADMIN:
      return "bg-blue-100 text-blue-800 border-blue-200";
    case ROLES.MEMBER:
      return "bg-green-100 text-green-800 border-green-200";
    case ROLES.EXPELLED:
      return "bg-red-100 text-red-800 border-red-200";
    case ROLES.NEWCOMER:
      return "bg-amber-100 text-amber-800 border-amber-200";
    case ROLES.GUEST:
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-gray-100 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900" dir="auto">
        {value}
      </dd>
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

  const user = await getSessionUser();
  if (!user) redirect("/logout");

  const connections = user.connections ?? [];
  const primary = connections[0];
  const displayName = user.name ?? primary?.name ?? "—";

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 p-4 md:p-6" dir="rtl">
      <div className="relative overflow-hidden rounded-2xl border border-primary-200 bg-linear-to-l from-primary-50 via-white to-white p-6 shadow-sm">
        <div
          aria-hidden
          className="absolute -top-10 -left-10 size-40 rounded-full bg-primary-100/60 blur-2xl"
        />
        <div className="relative">
          <h1 className="font-kufam text-2xl font-bold text-gray-900">
            الملف الشخصي
          </h1>
          <p className="mt-1 text-sm text-gray-500">عرض معلومات حسابك</p>
        </div>
      </div>

      <section className="ds-card overflow-hidden p-0!">
        <div className="flex items-center gap-4 border-b border-gray-100 px-5 py-5">
          {primary?.avatar ? (
            <Image
              src={primary.avatar}
              alt={displayName}
              width={56}
              height={56}
              className="size-14 rounded-full"
            />
          ) : (
            <div className="flex size-14 items-center justify-center rounded-full bg-gray-200 text-lg font-bold text-gray-700">
              {displayName.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900">{displayName}</p>
            <span
              className={`mt-1.5 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getRoleBadgeClass(user.role)}`}
            >
              {getRoleLabel(user.role)}
            </span>
          </div>
        </div>

        <dl className="px-5 py-2">
          <InfoRow label="الاسم" value={user.name ?? "—"} />
          <InfoRow label="البريد الإلكتروني" value={user.email ?? "—"} />
          <InfoRow label="رقم الهاتف" value={user.phone ?? "—"} />
        </dl>
      </section>

      {connections.length > 0 && (
        <section className="ds-card overflow-hidden p-0!">
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
        </section>
      )}
    </div>
  );
}
