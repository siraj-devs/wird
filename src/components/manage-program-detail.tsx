"use client";

import type { ProgramDetails } from "@/lib/programs";
import { getRoleLabel, ROLES } from "@/lib/roles";
import {
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
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
  const { program, members, categories, tasks } = programDetails;

  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [addingMembers, setAddingMembers] = useState(false);
  const [memberError, setMemberError] = useState("");

  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState(program.name);
  const [editDescription, setEditDescription] = useState(
    program.description ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingProgram, setDeletingProgram] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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

  const displayName = (user?: User) =>
    user?.name ?? user?.full_name ?? user?.username ?? "—";

  const openEdit = () => {
    setEditName(program.name);
    setEditDescription(program.description ?? "");
    setEditError("");
    setShowEdit(true);
  };

  const saveEdit = async (e: FormEvent) => {
    e.preventDefault();
    const name = editName.trim();
    if (!name) {
      setEditError("الرجاء إدخال اسم البرنامج");
      return;
    }

    setSaving(true);
    setEditError("");
    try {
      const response = await fetch(`/api/programs/${program.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: editDescription.trim() || null,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "فشل تعديل البرنامج");
      setShowEdit(false);
      router.refresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeletingProgram(true);
    setDeleteError("");
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
      setDeleteError(err instanceof Error ? err.message : "حدث خطأ");
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

  return (
    <div className="space-y-6">
      <section className="ds-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/panel/programs"
              className="text-sm text-gray-500 hover:text-primary-600"
            >
              ← البرامج
            </Link>
            <h1 className="mt-2 font-kufam text-2xl font-bold text-gray-900">
              {program.name}
            </h1>
            {program.description ? (
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {program.description}
              </p>
            ) : (
              <p className="mt-1 text-sm text-gray-400">بدون وصف</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="ds-badge">{members.length} أعضاء</span>
              <span className="ds-badge">{categories.length} فئات</span>
              <span className="ds-badge">{tasks.length} مهام</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={openEdit}
              className="gap-2"
            >
              <PencilSimpleIcon size={18} />
              تعديل
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                setDeleteError("");
                setShowDeleteConfirm(true);
              }}
              className="gap-2"
            >
              <TrashIcon size={18} />
              حذف
            </Button>
          </div>
        </div>
      </section>

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
                className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2"
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

      {/* Edit program modal */}
      {showEdit && (
        <div className="ds-modal-overlay">
          <div className="ds-modal">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              تعديل البرنامج
            </h3>
            {editError && (
              <div className="ds-error mb-4">
                <p className="text-sm">{editError}</p>
              </div>
            )}
            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  اسم البرنامج <span className="text-red-500">*</span>
                </label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="أدخل اسم البرنامج"
                  required
                  className="ds-input"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  الوصف
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="وصف اختياري للبرنامج"
                  rows={3}
                  className="ds-input resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={saving}
                  onClick={() => setShowEdit(false)}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="ds-modal-overlay">
          <div className="ds-modal">
            <h3 className="mb-2 text-xl font-bold text-gray-900">
              تأكيد حذف البرنامج
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              هل أنت متأكد من حذف البرنامج{" "}
              <span className="font-semibold text-gray-900">
                «{program.name}»
              </span>
              ؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            {deleteError && (
              <div className="ds-error mb-4">
                <p className="text-sm">{deleteError}</p>
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="danger"
                disabled={deletingProgram}
                onClick={confirmDelete}
                className="flex-1 gap-2"
              >
                <TrashIcon size={16} />
                {deletingProgram ? "جاري الحذف..." : "نعم، احذف"}
              </Button>
              <Button
                variant="secondary"
                disabled={deletingProgram}
                onClick={() => setShowDeleteConfirm(false)}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
