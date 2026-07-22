"use client";

import type { ProgramDetails } from "@/lib/programs";
import { TrashIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { Button } from "./ui/Button";

export default function ProgramList({
  programs,
}: {
  programs: ProgramDetails[];
}) {
  const router = useRouter();
  const [newProgramName, setNewProgramName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [deletingProgramId, setDeletingProgramId] = useState<string | null>(
    null,
  );

  const createProgram = async () => {
    const name = newProgramName.trim();
    if (!name) {
      setError("الرجاء إدخال اسم البرنامج");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const response = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = (await response.json()) as {
        error?: string;
        program?: Program;
      };

      if (!response.ok) {
        throw new Error(data.error || "فشل إنشاء البرنامج");
      }

      setNewProgramName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setCreating(false);
    }
  };

  const deleteProgram = async (event: MouseEvent, programId: string) => {
    event.preventDefault();
    event.stopPropagation();

    if (!confirm("هل أنت متأكد من حذف هذا البرنامج؟")) return;

    setDeletingProgramId(programId);

    try {
      const response = await fetch(`/api/programs/${programId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "فشل حذف البرنامج");
      }

      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setDeletingProgramId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={newProgramName}
          onChange={(e) => setNewProgramName(e.target.value)}
          placeholder="اسم البرنامج الجديد"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
        />
        <Button onClick={createProgram} disabled={creating}>
          {creating ? "جاري الإنشاء..." : "إنشاء برنامج"}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {programs.map(({ program, members, categories, tasks }) => (
          <Link
            key={program.id}
            href={`/panel/programs/${program.id}`}
            className="group relative rounded-xl border border-gray-200 bg-white p-5 transition hover:border-primary-300 hover:shadow-sm"
          >
            <button
              type="button"
              onClick={(e) => deleteProgram(e, program.id)}
              disabled={deletingProgramId === program.id}
              className="absolute top-3 left-3 rounded-md p-1.5 text-gray-300 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
              aria-label="حذف"
            >
              <TrashIcon size={18} />
            </button>
            <h3 className="font-kufam text-lg font-bold text-gray-900">
              {program.name}
            </h3>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
              <span>{members.length} أعضاء</span>
              <span>{categories.length} فئات</span>
              <span>{tasks.length} مهام</span>
            </div>
          </Link>
        ))}
      </div>

      {programs.length === 0 && (
        <p className="py-12 text-center text-sm text-gray-500">
          لا توجد برامج بعد. أنشئ برنامجاً للبدء.
        </p>
      )}
    </div>
  );
}
