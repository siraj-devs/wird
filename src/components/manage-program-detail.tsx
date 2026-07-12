"use client";

import type { ProgramDetails } from "@/actions";
import { ALL_DAYS } from "@/lib";
import { sortProgramWeeksByStartDate } from "@/lib/program-weeks";
import { getRoleLabel, ROLES } from "@/lib/roles";
import { PlusIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "./ui/Button";

const toArabicRange = (startDate: string) => {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  return `${start.toLocaleDateString("ar-MA", {
    month: "short",
    day: "numeric",
  })} - ${end.toLocaleDateString("ar-MA", {
    month: "short",
    day: "numeric",
  })}`;
};

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
    case ROLES.NEWCOMER:
    case ROLES.GUEST:
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export default function ManageProgramDetail({
  programDetails,
  tasks,
  categories,
  users,
}: {
  programDetails: ProgramDetails;
  tasks: Task[];
  categories: Category[];
  users: User[];
}) {
  const router = useRouter();
  const { program, members, weeks: unsortedWeeks } = programDetails;

  const weeks = useMemo(
    () => sortProgramWeeksByStartDate(unsortedWeeks),
    [unsortedWeeks],
  );

  const [addingWeek, setAddingWeek] = useState(false);
  const [showAddWeek, setShowAddWeek] = useState(false);
  const [weekStartDate, setWeekStartDate] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [addingMembers, setAddingMembers] = useState(false);
  const [addingTasksForWeek, setAddingTasksForWeek] = useState<string | null>(
    null,
  );
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [addingTasks, setAddingTasks] = useState(false);
  const [deletingProgram, setDeletingProgram] = useState(false);

  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const memberIdSet = useMemo(
    () => new Set(members.map((member) => member.user_id)),
    [members],
  );

  const availableMembers = useMemo(
    () => users.filter((user) => !memberIdSet.has(user.id)),
    [users, memberIdSet],
  );

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

  const addWeek = async () => {
    if (!weekStartDate) {
      alert("الرجاء اختيار تاريخ بداية الأسبوع (يوم السبت)");
      return;
    }

    setAddingWeek(true);

    try {
      const response = await fetch(`/api/programs/${program.id}/weeks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_date: weekStartDate,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "فشل إضافة الأسبوع");
      }

      setWeekStartDate("");
      setShowAddWeek(false);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setAddingWeek(false);
    }
  };

  const removeWeek = async (programWeekId: string) => {
    if (!confirm("هل تريد إزالة هذا الأسبوع من البرنامج؟")) return;

    try {
      const response = await fetch(
        `/api/programs/${program.id}/weeks?id=${programWeekId}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "فشل إزالة الأسبوع");
      }

      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "حدث خطأ");
    }
  };

  const addMembers = async () => {
    if (selectedMemberIds.length === 0) {
      alert("الرجاء اختيار عضو واحد على الأقل");
      return;
    }

    setAddingMembers(true);

    try {
      const response = await fetch(`/api/programs/${program.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_ids: selectedMemberIds }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "فشل إضافة الأعضاء");
      }

      setSelectedMemberIds([]);
      setShowAddMembers(false);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setAddingMembers(false);
    }
  };

  const removeMember = async (userId: string) => {
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

  const addTasksToWeek = async (weekId: string) => {
    if (selectedTaskIds.length === 0) {
      alert("الرجاء اختيار مهمة واحدة على الأقل");
      return;
    }

    setAddingTasks(true);

    try {
      for (const taskId of selectedTaskIds) {
        const task = tasks.find((item) => item.id === taskId);
        if (!task) continue;

        const response = await fetch(
          `/api/programs/${program.id}/week-tasks`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              week_id: weekId,
              task_id: task.id,
              task_name: task.name,
              category_id: task.category_id,
              category_name: task.category_id
                ? categoryNameById.get(task.category_id) ?? null
                : null,
              task_days: task.days,
            }),
          },
        );

        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error || "فشل إضافة المهام");
        }
      }

      setSelectedTaskIds([]);
      setAddingTasksForWeek(null);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setAddingTasks(false);
    }
  };

  const removeWeekTask = async (weekTaskId: string) => {
    if (!confirm("هل تريد حذف هذه المهمة من الأسبوع؟")) return;

    try {
      const response = await fetch(`/api/week-tasks?id=${weekTaskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "فشل حذف المهمة");
      }

      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "حدث خطأ");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          {/* <Link
            href="/panel/programs"
            className="mb-2 inline-block text-sm text-primary-600 hover:text-primary-800"
          >
            ← العودة إلى البرامج
          </Link> */}
          <h1 className="ds-title">{program.name}</h1>
          <p className="ds-subtitle">
            {weeks.length} أسابيع · {members.length} أعضاء
          </p>
        </div>

        {/* <button
          type="button"
          onClick={deleteProgram}
          disabled={deletingProgram}
          className="cursor-pointer rounded-md p-2 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
          aria-label="حذف البرنامج"
        >
          <TrashIcon size={20} weight="regular" />
        </button> */}
      </div>

      <section className="ds-card space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-gray-900">الأعضاء</h2>
          <Button
            variant="secondary"
            onClick={() => setShowAddMembers((prev) => !prev)}
          >
            {showAddMembers ? "إلغاء" : "إضافة أعضاء"}
          </Button>
        </div>

        {showAddMembers && (
          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {availableMembers.length === 0 ? (
                <p className="text-sm text-gray-500">
                  لا يوجد أعضاء متاحون للإضافة.
                </p>
              ) : (
                availableMembers.map((user) => {
                  const checked = selectedMemberIds.includes(user.id);

                  return (
                    <label
                      key={user.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg bg-white px-3 py-2"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSelectedMemberIds((prev) =>
                            checked
                              ? prev.filter((id) => id !== user.id)
                              : [...prev, user.id],
                          );
                        }}
                      />
                      {user.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt={user.username}
                          className="size-8 shrink-0 rounded-full"
                          width={32}
                          height={32}
                        />
                      ) : (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {user.full_name ?? user.username}
                        </p>
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getRoleBadgeClass(user.role)}`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
            <Button onClick={addMembers} disabled={addingMembers}>
              {addingMembers ? "جاري الإضافة..." : "تأكيد الإضافة"}
            </Button>
          </div>
        )}

        {members.length === 0 ? (
          <p className="text-sm text-gray-500">لا يوجد أعضاء في هذا البرنامج.</p>
        ) : (
          <ul className="flex flex-wrap gap-6">
            {members.map((member) => {
              const user = member.user;
              const displayName =
                user?.full_name ?? user?.username ?? member.user_id;
              const role = user?.role ?? ROLES.MEMBER;

              return (
                <li
                  key={member.id}
                  className="flex items-center gap-3 rounded-full border border-gray-200 bg-white p-3"
                >
                  {user?.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={user.username}
                      className="size-10 shrink-0 rounded-full"
                      width={40}
                      height={40}
                    />
                  ) : (
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-700">
                      {(user?.username ?? "?").charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {displayName}
                    </p>
                    {/* {user?.username && user.full_name && (
                      <p className="truncate text-xs text-gray-500">
                        @{user.username}
                      </p>
                    )} */}
                    <span
                      className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getRoleBadgeClass(role)}`}
                    >
                      {getRoleLabel(role)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeMember(member.user_id)}
                    className="shrink-0 cursor-pointer rounded-full p-1.5 mr-3 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label="إزالة العضو"
                  >
                    <XIcon size={16} weight="bold" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="ds-card space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-gray-900">الأسابيع</h2>
          <Button
            variant="secondary"
            onClick={() => setShowAddWeek((prev) => !prev)}
          >
            {showAddWeek ? "إلغاء" : "إضافة أسبوع"}
          </Button>
        </div>

        {showAddWeek && (
          <div className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm text-gray-600">
                تاريخ بداية الأسبوع (السبت)
              </span>
              <input
                type="date"
                value={weekStartDate}
                onChange={(event) => setWeekStartDate(event.target.value)}
                className="ds-input w-full"
              />
            </label>
            <div className="sm:col-span-2">
              <Button onClick={addWeek} disabled={addingWeek}>
                {addingWeek ? "جاري الإضافة..." : "إضافة الأسبوع"}
              </Button>
            </div>
          </div>
        )}

        {weeks.length === 0 ? (
          <p className="text-sm text-gray-500">
            لا توجد أسابيع في هذا البرنامج بعد.
          </p>
        ) : (
          <div className="space-y-4">
            {weeks.map((programWeek, index) => (
              <article
                key={programWeek.id}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      الأسبوع {index + 1}
                    </p>
                    <p className="text-sm text-gray-500">
                      {toArabicRange(programWeek.week.start_date)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setAddingTasksForWeek(
                          addingTasksForWeek === programWeek.week_id
                            ? null
                            : programWeek.week_id,
                        )
                      }
                      className="cursor-pointer rounded-md p-2 text-primary-600 transition-colors hover:bg-primary-50"
                      aria-label="إضافة مهام"
                    >
                      <PlusIcon size={18} weight="bold" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeWeek(programWeek.id)}
                      className="cursor-pointer rounded-md p-2 text-red-600 transition-colors hover:bg-red-50"
                      aria-label="إزالة الأسبوع"
                    >
                      <TrashIcon size={18} weight="regular" />
                    </button>
                  </div>
                </div>

                {addingTasksForWeek === programWeek.week_id && (
                  <div className="mb-4 space-y-3 rounded-lg border border-gray-200 bg-white p-3">
                    <div className="max-h-48 space-y-2 overflow-y-auto">
                      {tasks.map((task) => {
                        const alreadyAdded = programWeek.tasks.some(
                          (weekTask) => weekTask.task_id === task.id,
                        );
                        const checked = selectedTaskIds.includes(task.id);

                        return (
                          <label
                            key={task.id}
                            className={`flex items-center gap-2 rounded-md px-2 py-1 ${
                              alreadyAdded
                                ? "opacity-50"
                                : "cursor-pointer hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              disabled={alreadyAdded}
                              checked={checked}
                              onChange={() => {
                                setSelectedTaskIds((prev) =>
                                  checked
                                    ? prev.filter((id) => id !== task.id)
                                    : [...prev, task.id],
                                );
                              }}
                            />
                            <span className="text-sm">{task.name}</span>
                          </label>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => addTasksToWeek(programWeek.week_id)}
                        disabled={addingTasks}
                      >
                        {addingTasks ? "جاري الإضافة..." : "تأكيد"}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setAddingTasksForWeek(null);
                          setSelectedTaskIds([]);
                        }}
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                )}

                {programWeek.tasks.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    لا توجد مهام لهذا الأسبوع.
                  </p>
                ) : (
                  <ul className="flex flex-wrap gap-3">
                    {programWeek.tasks.map((task) => (
                      <li
                        key={task.id}
                        className="flex items-center justify-between gap-6 rounded-full border border-gray-200 bg-white pl-3 pr-6 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {task.task_name}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 flex items-center gap-3">
                            {task.category_name && <span className="ds-badge">{task.category_name}</span>}
                            <span className="ds-badge">{task.task_days?.length ?? ALL_DAYS.length} أيام</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeWeekTask(task.id)}
                          className="cursor-pointer rounded-full p-1.5 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          aria-label="حذف المهمة"
                        >
                          <XIcon size={16} weight="bold" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
