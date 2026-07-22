"use client";

import type { ProgramDetails } from "@/lib/programs";
import { getRoleLabel, ROLES } from "@/lib/roles";
import { PlusIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import AddProgramCategoryForm from "./add-program-category-form";
import AddProgramTaskForm from "./add-program-task-form";
import ManageProgramCategories from "./manage-program-categories";
import ManageProgramTasks from "./manage-program-tasks";
import { Button } from "./ui/Button";

const getRoleBadgeClass = (role: Role) => {
  switch (role) {
    case ROLES.OWNER:
      return "bg-purple-100 text-purple-800 border-purple-200";
    case ROLES.ADMIN:
      return "bg-blue-100 text-blue-800 border-blue-200";
    case ROLES.MEMBER:
      return "bg-green-100 text-green-800 border-green-200";
    case ROLES.EXPELLED:
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export default function ManageProgramDetail({
  programDetails,
  users,
}: {
  programDetails: ProgramDetails;
  users: User[];
}) {
  const router = useRouter();
  const { program, members, categories, tasks, friends } = programDetails;

  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [addingMembers, setAddingMembers] = useState(false);
  const [memberError, setMemberError] = useState("");

  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendUserId, setFriendUserId] = useState("");
  const [friendOtherId, setFriendOtherId] = useState("");
  const [addingFriend, setAddingFriend] = useState(false);
  const [friendError, setFriendError] = useState("");

  const [deletingProgram, setDeletingProgram] = useState(false);

  const usersById = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  );

  const memberIdSet = useMemo(
    () => new Set(members.map((member) => member.user_id)),
    [members],
  );

  const availableMembers = useMemo(
    () =>
      users.filter(
        (user) =>
          !memberIdSet.has(user.id) &&
          [ROLES.MEMBER, ROLES.ADMIN, ROLES.OWNER, ROLES.GUEST].includes(
            user.role,
          ),
      ),
    [users, memberIdSet],
  );

  const memberUsers = useMemo(
    () => members.map((m) => m.user).filter((u): u is User => !!u),
    [members],
  );

  const displayName = (user?: User) =>
    user?.name ?? user?.full_name ?? user?.username ?? "—";

  const deleteProgram = async () => {
    if (!confirm("هل أنت متأكد من حذف هذا البرنامج؟")) return;
    setDeletingProgram(true);
    try {
      const response = await fetch(`/api/programs/${program.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "فشل حذف البرنامج");
      }
      router.push("/panel/programs");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setDeletingProgram(false);
    }
  };

  const addMembers = async () => {
    setMemberError("");
    if (selectedMemberIds.length === 0) {
      setMemberError("الرجاء اختيار عضو واحد على الأقل");
      return;
    }
    setAddingMembers(true);
    try {
      const response = await fetch(`/api/programs/${program.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_ids: selectedMemberIds }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "فشل إضافة الأعضاء");
      }
      setSelectedMemberIds([]);
      setShowAddMembers(false);
      router.refresh();
    } catch (err) {
      setMemberError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setAddingMembers(false);
    }
  };

  const removeMember = async (userId: string) => {
    if (!confirm("إزالة هذا العضو من البرنامج؟")) return;
    try {
      const response = await fetch(
        `/api/programs/${program.id}/members?user_id=${userId}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "فشل إزالة العضو");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "حدث خطأ");
    }
  };

  const addFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setFriendError("");
    if (!friendUserId || !friendOtherId) {
      setFriendError("الرجاء اختيار العضوين");
      return;
    }
    setAddingFriend(true);
    try {
      const response = await fetch(`/api/programs/${program.id}/friends`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: friendUserId,
          friend_id: friendOtherId,
        }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "فشل إضافة الصداقة");
      }
      setFriendUserId("");
      setFriendOtherId("");
      setShowAddFriend(false);
      router.refresh();
    } catch (err) {
      setFriendError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setAddingFriend(false);
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      const response = await fetch(
        `/api/programs/${program.id}/friends?friendship_id=${friendshipId}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "فشل حذف الصداقة");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "حدث خطأ");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/panel/programs"
            className="text-sm text-gray-500 hover:text-primary-500"
          >
            ← البرامج
          </Link>
          <h1 className="mt-1 font-kufam text-2xl font-bold text-gray-900">
            {program.name}
          </h1>
          {program.description && (
            <p className="mt-1 text-sm text-gray-500">{program.description}</p>
          )}
        </div>
        <Button
          variant="danger"
          onClick={deleteProgram}
          disabled={deletingProgram}
          className="gap-2"
        >
          <TrashIcon size={18} />
          حذف البرنامج
        </Button>
      </div>

      {/* Members */}
      <section className="ds-card">
        <div className="ds-section-header mb-4 flex-row">
          <div>
            <h2 className="ds-title">الأعضاء</h2>
            <p className="ds-subtitle">{members.length} عضو</p>
          </div>
          <Button
            type="button"
            onClick={() => setShowAddMembers(true)}
            className="p-2!"
          >
            <PlusIcon size={18} />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {members.map((member) => {
            const user = member.user ?? usersById.get(member.user_id);
            const role = user?.role ?? ROLES.GUEST;
            return (
              <div
                key={member.id}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2"
              >
                {user?.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt=""
                    width={32}
                    height={32}
                    className="size-8 rounded-full"
                  />
                ) : (
                  <span className="flex size-8 items-center justify-center rounded-full bg-gray-200 text-xs font-bold">
                    {displayName(user).charAt(0)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {displayName(user)}
                  </p>
                  <span
                    className={`rounded-full border px-1.5 py-0.5 text-[10px] ${getRoleBadgeClass(role)}`}
                  >
                    {getRoleLabel(role)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeMember(member.user_id)}
                  className="mr-1 text-gray-400 hover:text-red-500"
                  aria-label="إزالة"
                >
                  <XIcon size={16} />
                </button>
              </div>
            );
          })}
          {members.length === 0 && (
            <p className="text-sm text-gray-500">لا يوجد أعضاء بعد</p>
          )}
        </div>
      </section>

      {/* Friends */}
      <section className="ds-card">
        <div className="ds-section-header mb-4 flex-row">
          <div>
            <h2 className="ds-title">الأصدقاء داخل البرنامج</h2>
            <p className="ds-subtitle">
              يمكن للأصدقاء مشاهدة تقدم بعضهم في هذا البرنامج
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setShowAddFriend(true)}
            className="p-2!"
            disabled={memberUsers.length < 2}
          >
            <PlusIcon size={18} />
          </Button>
        </div>

        <ul className="space-y-2">
          {friends.map((f) => {
            const a = usersById.get(f.user_a_id);
            const b = usersById.get(f.user_b_id);
            return (
              <li
                key={f.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm"
              >
                <span>
                  {displayName(a)} ↔ {displayName(b)}
                </span>
                <button
                  type="button"
                  onClick={() => removeFriend(f.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <TrashIcon size={16} />
                </button>
              </li>
            );
          })}
          {friends.length === 0 && (
            <p className="text-sm text-gray-500">لا توجد صداقات بعد</p>
          )}
        </ul>
      </section>

      {/* Categories + Tasks (panel layout) */}
      <div className="grid grid-cols-7 gap-6">
        <section className="ds-card col-span-full lg:col-span-2">
          <div className="ds-section-header flex-row">
            <div>
              <h2 className="ds-title">الفئات</h2>
              <p className="ds-subtitle">
                تعريف مجموعات المهام المستخدمة داخل البرنامج.
              </p>
            </div>
            <AddProgramCategoryForm programId={program.id} />
          </div>
          <ManageProgramCategories
            programId={program.id}
            categories={categories}
          />
        </section>

        <section className="ds-card col-span-full lg:col-span-5">
          <div className="ds-section-header flex-row">
            <div>
              <h2 className="ds-title">المهام</h2>
              <p className="ds-subtitle">
                إدارة مهام هذا البرنامج وجدولة تنفيذها.
              </p>
            </div>
            <AddProgramTaskForm
              programId={program.id}
              categories={categories}
            />
          </div>
          <ManageProgramTasks
            programId={program.id}
            tasks={tasks}
            categories={categories}
          />
        </section>
      </div>

      {/* Members modal */}
      {showAddMembers && (
        <div className="ds-modal-overlay">
          <div className="ds-modal ds-modal-scroll space-y-4">
            <h3 className="text-xl font-bold text-gray-900">إضافة أعضاء</h3>
            {memberError && (
              <div className="ds-error">
                <p className="text-sm">{memberError}</p>
              </div>
            )}
            <div className="flex max-h-64 flex-wrap gap-2 overflow-y-auto">
              {availableMembers.map((user) => {
                const selected = selectedMemberIds.includes(user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() =>
                      setSelectedMemberIds((prev) =>
                        selected
                          ? prev.filter((id) => id !== user.id)
                          : [...prev, user.id],
                      )
                    }
                    className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-sm ${
                      selected
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    {user.avatar_url ? (
                      <Image
                        src={user.avatar_url}
                        alt=""
                        width={24}
                        height={24}
                        className="size-6 rounded-full"
                      />
                    ) : (
                      <span className="flex size-6 items-center justify-center rounded-full bg-gray-200 text-xs">
                        {displayName(user).charAt(0)}
                      </span>
                    )}
                    {displayName(user)}
                  </button>
                );
              })}
              {availableMembers.length === 0 && (
                <p className="text-sm text-gray-500">لا يوجد مستخدمون متاحون</p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={addMembers}
                disabled={addingMembers}
                className="flex-1"
              >
                {addingMembers ? "جاري الإضافة..." : "تأكيد"}
              </Button>
              <Button
                variant="secondary"
                disabled={addingMembers}
                onClick={() => {
                  setShowAddMembers(false);
                  setSelectedMemberIds([]);
                  setMemberError("");
                }}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Friend modal */}
      {showAddFriend && (
        <div className="ds-modal-overlay">
          <div className="ds-modal">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              ربط صديقين في البرنامج
            </h3>
            {friendError && (
              <div className="ds-error mb-4">
                <p className="text-sm">{friendError}</p>
              </div>
            )}
            <form onSubmit={addFriend} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  العضو
                </label>
                <select
                  value={friendUserId}
                  onChange={(e) => setFriendUserId(e.target.value)}
                  className="ds-select"
                  required
                >
                  <option value="">اختر</option>
                  {memberUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {displayName(u)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  الصديق
                </label>
                <select
                  value={friendOtherId}
                  onChange={(e) => setFriendOtherId(e.target.value)}
                  className="ds-select"
                  required
                >
                  <option value="">اختر</option>
                  {memberUsers
                    .filter((u) => u.id !== friendUserId)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {displayName(u)}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={addingFriend}
                  className="flex-1"
                >
                  {addingFriend ? "جاري الربط..." : "ربط"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={addingFriend}
                  onClick={() => {
                    setShowAddFriend(false);
                    setFriendUserId("");
                    setFriendOtherId("");
                    setFriendError("");
                  }}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
