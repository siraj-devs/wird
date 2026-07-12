"use client";

import { TrashIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { Button } from "./ui/Button";

type ProgramSummary = {
  program: Program;
  members: (ProgramMember & { user?: User })[];
  weeks: (ProgramWeek & { week: Week; tasks: WeekTask[] })[];
};

export default function ProgramList({ programs }: { programs: ProgramSummary[] }) {
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
      <section className="ds-card">
        <h2 className="ds-title mb-1">إنشاء برنامج جديد</h2>
        <p className="ds-subtitle mb-4">
          البرنامج يحتوي على أسابيع متتابعة، وكل أسبوع له مهام خاصة.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={newProgramName}
            onChange={(event) => setNewProgramName(event.target.value)}
            placeholder="اسم البرنامج"
            className="ds-input flex-1"
          />
          <Button onClick={createProgram} disabled={creating}>
            {creating ? "جاري الإنشاء..." : "إنشاء برنامج"}
          </Button>
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </section>

      {programs.length === 0 ? (
        <section className="ds-card">
          <p className="text-sm text-gray-500">لا توجد برامج حتى الآن.</p>
        </section>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {programs.map(({ program, members, weeks }) => {
            const totalTasks = weeks.reduce(
              (count, week) => count + week.tasks.length,
              0,
            );

            return (
              <Link
                key={program.id}
                href={`/panel/programs/${program.id}`}
                className="ds-card group block transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="ds-title truncate">{program.name}</h2>
                    <p className="ds-subtitle mt-1">
                      {weeks.length} أسابيع · {members.length} أعضاء ·{" "}
                      {totalTasks} مهمة
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(event) => deleteProgram(event, program.id)}
                    disabled={deletingProgramId === program.id}
                    className="cursor-pointer rounded-md p-2 text-red-600 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 disabled:opacity-50"
                    aria-label="حذف البرنامج"
                  >
                    <TrashIcon size={20} weight="regular" />
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
