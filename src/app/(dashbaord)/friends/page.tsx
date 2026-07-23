import { getUserProgramFriendsBoard } from "@/actions";
import ManageProgramFriends from "@/components/manage-program-friends";
import { checkRole } from "@/lib/auth-server";
import { ROLES } from "@/lib/roles";

export default async function FriendsPage() {
  const user = await checkRole([ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER]);
  const boards = await getUserProgramFriendsBoard(user.id);

  const incomingCount = boards.reduce((sum, b) => sum + b.incoming.length, 0);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 md:p-6" dir="rtl">
      <div className="relative overflow-hidden rounded-2xl border border-primary-200 bg-linear-to-l from-primary-50 via-white to-white p-6 shadow-sm">
        <div>
          <h1 className="font-kufam text-2xl font-bold text-gray-900">
            الأصدقاء
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            أرسل طلب صداقة لعضو في برنامجك. بعد قبوله يمكنكما مشاهدة تقدم
            بعضكما.
          </p>
          {incomingCount > 0 && (
            <p className="mt-2 text-sm font-medium text-primary-700">
              لديك {incomingCount} طلب{incomingCount > 1 ? "ات" : ""} بانتظار
              الرد
            </p>
          )}
        </div>
      </div>

      <ManageProgramFriends boards={boards} />
    </div>
  );
}
