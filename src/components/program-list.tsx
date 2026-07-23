"use client";

import type { ProgramDetails } from "@/lib/programs";
import {
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type MouseEvent } from "react";
import { Button } from "./ui/Button";

export default function ProgramList({
  programs,
}: {
  programs: ProgramDetails[];
}) {
  const router = useRouter();

  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [editProgram, setEditProgram] = useState<Program | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const resetCreate = () => {
    setCreateName("");
    setCreateDescription("");
    setCreateError("");
    setShowCreate(false);
  };

  const openEdit = (event: MouseEvent, program: Program) => {
    event.preventDefault();
    event.stopPropagation();
    setEditProgram(program);
    setEditName(program.name);
    setEditDescription(program.description ?? "");
    setEditError("");
  };

  const openDelete = (event: MouseEvent, program: Program) => {
    event.preventDefault();
    event.stopPropagation();
    setDeleteTarget(program);
    setDeleteError("");
  };

  const createProgram = async (e: FormEvent) => {
    e.preventDefault();
    const name = createName.trim();
    if (!name) {
      setCreateError("الرجاء إدخال اسم البرنامج");
      return;
    }

    setCreating(true);
    setCreateError("");

    try {
      const response = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: createDescription.trim() || null,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "فشل إنشاء البرنامج");

      resetCreate();
      router.refresh();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setCreating(false);
    }
  };

  const saveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editProgram) return;

    const name = editName.trim();
    if (!name) {
      setEditError("الرجاء إدخال اسم البرنامج");
      return;
    }

    setSaving(true);
    setEditError("");

    try {
      const response = await fetch(`/api/programs/${editProgram.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: editDescription.trim() || null,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "فشل تعديل البرنامج");

      setEditProgram(null);
      router.refresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch(`/api/programs/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "فشل حذف البرنامج");

      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="ds-card">
        <div className="ds-section-header mb-0 flex-row">
          <div>
            <h2 className="ds-title">البرامج</h2>
            <p className="ds-subtitle">
              إدارة البرامج: الأعضاء، الفئات، والمهام.
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <PlusIcon size={18} weight="bold" />
            برنامج جديد
          </Button>
        </div>
      </section>

      {programs.length === 0 ? (
        <div className="ds-card flex flex-col items-center gap-2 py-12 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-primary-50 text-primary-600">
            <UsersThreeIcon size={24} />
          </div>
          <p className="text-sm text-gray-500">
            لا توجد برامج بعد. أنشئ برنامجاً للبدء.
          </p>
          <Button onClick={() => setShowCreate(true)} className="mt-2 gap-2">
            <PlusIcon size={16} weight="bold" />
            إنشاء برنامج
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map(({ program, members, categories, tasks }) => (
            <Link
              key={program.id}
              href={`/panel/programs/${program.id}`}
              className="ds-card group relative block space-y-3 transition hover:border-primary-300 hover:shadow-md"
            >
              <div className="absolute top-3 left-3 flex gap-1 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={(e) => openEdit(e, program)}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-primary-50 hover:text-primary-600"
                  aria-label="تعديل"
                >
                  <PencilSimpleIcon size={18} />
                </button>
                <button
                  type="button"
                  onClick={(e) => openDelete(e, program)}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  aria-label="حذف"
                >
                  <TrashIcon size={18} />
                </button>
              </div>

              <h3 className="pe-16 font-kufam text-lg font-bold text-gray-900">
                {program.name}
              </h3>
              {program.description ? (
                <p className="line-clamp-2 text-sm text-gray-500">
                  {program.description}
                </p>
              ) : (
                <p className="text-sm text-gray-400">بدون وصف</p>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <span className="ds-badge">{members.length} أعضاء</span>
                <span className="ds-badge">{categories.length} فئات</span>
                <span className="ds-badge">{tasks.length} مهام</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="ds-modal-overlay">
          <div className="ds-modal">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              إنشاء برنامج جديد
            </h3>
            {createError && (
              <div className="ds-error mb-4">
                <p className="text-sm">{createError}</p>
              </div>
            )}
            <form onSubmit={createProgram} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  اسم البرنامج <span className="text-red-500">*</span>
                </label>
                <input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
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
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="وصف اختياري للبرنامج"
                  rows={3}
                  className="ds-input resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={creating} className="flex-1">
                  {creating ? "جاري الإنشاء..." : "إنشاء البرنامج"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={creating}
                  onClick={resetCreate}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editProgram && (
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
                  onClick={() => setEditProgram(null)}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="ds-modal-overlay">
          <div className="ds-modal">
            <h3 className="mb-2 text-xl font-bold text-gray-900">
              تأكيد حذف البرنامج
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              هل أنت متأكد من حذف البرنامج{" "}
              <span className="font-semibold text-gray-900">
                «{deleteTarget.name}»
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
                disabled={deleting}
                onClick={confirmDelete}
                className="flex-1 gap-2"
              >
                <TrashIcon size={16} />
                {deleting ? "جاري الحذف..." : "نعم، احذف"}
              </Button>
              <Button
                variant="secondary"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
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
