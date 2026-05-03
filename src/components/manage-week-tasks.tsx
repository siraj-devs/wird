"use client";

import { ALL_DAYS } from "@/lib";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "./ui/Button";

export default function ManageWeekTasks({
  weeks,
  tasks,
  categories,
  users,
}: {
  weeks: {
    label: string;
    week: Week;
    tasks: WeekTask[];
  }[];
  tasks: Task[];
  categories: Category[];
  users: User[];
}) {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [filterText, setFilterText] = useState("");

  const [savingWeekId, setSavingWeekId] = useState<string | null>(null);
  const [deletingWeekTaskId, setDeletingWeekTaskId] = useState<string | null>(
    null,
  );
  const [confirmDeleteWeekTask, setConfirmDeleteWeekTask] =
    useState<WeekTask | null>(null);
  const [modalError, setModalError] = useState("");
  const [deleteErrorByWeek, setDeleteErrorByWeek] = useState<
    Record<string, string>
  >({});
  const [assignmentModalTask, setAssignmentModalTask] =
    useState<WeekTask | null>(null);
  const [selectedAssignedUserIds, setSelectedAssignedUserIds] = useState<
    string[]
  >([]);
  const [assignmentSavingTaskId, setAssignmentSavingTaskId] = useState<
    string | null
  >(null);
  const [assignmentError, setAssignmentError] = useState("");

  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const getWeekStartKey = (date: Date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    const day = normalized.getDay();
    const diff = (day + 1) % 7;
    normalized.setDate(normalized.getDate() - diff);
    const year = normalized.getFullYear();
    const month = String(normalized.getMonth() + 1).padStart(2, "0");
    const dayOfMonth = String(normalized.getDate()).padStart(2, "0");
    return `${year}-${month}-${dayOfMonth}`;
  };

  const currentWeekStartKey = useMemo(() => getWeekStartKey(new Date()), []);

  const canAddTaskToWeek = (startDate: string) =>
    startDate > currentWeekStartKey;

  const nextWeekData = useMemo(() => {
    const futureWeeks = weeks
      .filter((weekData) => canAddTaskToWeek(weekData.week.start_date))
      .sort((a, b) => a.week.start_date.localeCompare(b.week.start_date));

    return futureWeeks[0] ?? null;
  }, [weeks]);

  const nextWeekAvailableTasks = useMemo(() => {
    if (!nextWeekData) return [];

    const usedTaskIds = new Set(
      nextWeekData.tasks.map((weekTask) => weekTask.task_id).filter(Boolean),
    );

    return tasks.filter((task) => !usedTaskIds.has(task.id));
  }, [nextWeekData, tasks]);

  const visibleTasks = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return nextWeekAvailableTasks;
    return nextWeekAvailableTasks.filter((t) =>
      t.name.toLowerCase().includes(q),
    );
  }, [nextWeekAvailableTasks, filterText]);

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId],
    );
  };

  const selectAllVisible = () => {
    setSelectedTaskIds((prev) => {
      const ids = visibleTasks.map((t) => t.id);
      return Array.from(new Set([...prev, ...ids]));
    });
  };

  const selectedTasks = useMemo(
    () =>
      nextWeekAvailableTasks.filter((task) =>
        selectedTaskIds.includes(task.id),
      ),
    [nextWeekAvailableTasks, selectedTaskIds],
  );

  const selectedAssignedUsers = useMemo(
    () =>
      users.filter((user) => selectedAssignedUserIds.includes(user.id)),
    [users, selectedAssignedUserIds],
  );

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

  const handleAddTasksToNextWeek = async () => {
    if (!nextWeekData) {
      setModalError("لا يوجد أسبوع قادم متاح حالياً");
      return;
    }

    if (selectedTaskIds.length === 0) {
      setModalError("الرجاء اختيار مهمة واحدة على الأقل");
      return;
    }

    const taskIdsToAdd = selectedTaskIds.filter((taskId) =>
      nextWeekAvailableTasks.some((task) => task.id === taskId),
    );

    if (taskIdsToAdd.length === 0) {
      setModalError("المهام المختارة غير متاحة للإضافة");
      return;
    }

    setSavingWeekId(nextWeekData.week.id);
    setModalError("");

    try {
      for (const [index, taskId] of taskIdsToAdd.entries()) {
        const selectedTask = nextWeekAvailableTasks.find(
          (task) => task.id === taskId,
        );

        if (!selectedTask) {
          throw new Error("المهمة المختارة غير موجودة");
        }

        const response = await fetch("/api/week-tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            week_id: nextWeekData.week.id,
            task_id: selectedTask.id,
            task_name: selectedTask.name,
            category_id: selectedTask.category_id,
            category_name: selectedTask.category_id
              ? categoryNameById.get(selectedTask.category_id) || null
              : null,
            task_days:
              selectedTask.days && selectedTask.days.length > 0
                ? selectedTask.days
                : [...ALL_DAYS],
            sort_order: nextWeekData.tasks.length + index,
          }),
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.error || "فشل في إضافة المهمة");
        }
      }

      setSelectedTaskIds([]);
      setIsAddModalOpen(false);
      setModalError("");

      router.refresh();
    } catch (error) {
      setModalError(
        error instanceof Error ? error.message : "حدث خطأ أثناء الإضافة",
      );
    } finally {
      setSavingWeekId(null);
    }
  };

  const handleDeleteTaskFromNextWeek = async (weekTask: WeekTask) => {
    if (!nextWeekData || weekTask.week_id !== nextWeekData.week.id) {
      return;
    }

    setConfirmDeleteWeekTask(weekTask);
  };

  const confirmDeleteTaskFromNextWeek = async () => {
    if (!confirmDeleteWeekTask || !nextWeekData) return;
    if (confirmDeleteWeekTask.week_id !== nextWeekData.week.id) {
      setConfirmDeleteWeekTask(null);
      return;
    }

    setDeleteErrorByWeek((prev) => ({
      ...prev,
      [nextWeekData.week.id]: "",
    }));
    setDeletingWeekTaskId(confirmDeleteWeekTask.id);

    try {
      const response = await fetch(
        `/api/week-tasks?id=${confirmDeleteWeekTask.id}`,
        {
          method: "DELETE",
        },
      );

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || "فشل في حذف المهمة");
      }

      setConfirmDeleteWeekTask(null);
      router.refresh();
    } catch (error) {
      setDeleteErrorByWeek((prev) => ({
        ...prev,
        [nextWeekData.week.id]:
          error instanceof Error ? error.message : "حدث خطأ أثناء الحذف",
      }));
    } finally {
      setDeletingWeekTaskId(null);
    }
  };

  const openAssignmentModal = (weekTask: WeekTask) => {
    setAssignmentModalTask(weekTask);
    setSelectedAssignedUserIds(weekTask.assigned_user_ids ?? []);
    setAssignmentError("");
  };

  const toggleAssignedUser = (userId: string) => {
    setSelectedAssignedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const saveTaskAssignment = async () => {
    if (!assignmentModalTask) return;

    setAssignmentSavingTaskId(assignmentModalTask.id);
    setAssignmentError("");

    try {
      if (selectedAssignedUserIds.length === 0) {
        const clearResponse = await fetch(
          `/api/week-tasks/assignments?week_task_id=${assignmentModalTask.id}`,
          {
            method: "DELETE",
          },
        );

        const clearResponseData = await clearResponse.json();

        if (!clearResponse.ok) {
          throw new Error(
            clearResponseData.error || "فشل في مسح التخصيصات",
          );
        }
      } else {
        const assignResponse = await fetch("/api/week-tasks/assignments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            week_task_id: assignmentModalTask.id,
            user_ids: selectedAssignedUserIds,
          }),
        });

        const assignResponseData = await assignResponse.json();

        if (!assignResponse.ok) {
          throw new Error(assignResponseData.error || "فشل في حفظ التخصيصات");
        }
      }

      setAssignmentModalTask(null);
      setSelectedAssignedUserIds([]);
      router.refresh();
    } catch (error) {
      setAssignmentError(
        error instanceof Error ? error.message : "حدث خطأ أثناء حفظ التخصيص",
      );
    } finally {
      setAssignmentSavingTaskId(null);
    }
  };

  return (
    <section className="ds-card">
      <div className="ds-section-header">
        <div>
          <h2 className="ds-title">برنامج الأسابيع</h2>
          <p className="ds-subtitle">
            البرنامج عبارة عن مجموعة من الأسابيع، وكل أسبوع يحتوي على مهامه
            التنفيذية.
          </p>
        </div>

        <Button
          onClick={() => {
            setModalError("");
            setSelectedTaskIds([]);
            setIsAddModalOpen(true);
          }}
          disabled={!nextWeekData}
          className="p-2!"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="size-4.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {weeks.map((weekData, index) => {
          const isNextOrFutureWeek = canAddTaskToWeek(weekData.week.start_date);
          const isNextWeek = nextWeekData?.week.id === weekData.week.id;

          return (
            <article key={weekData.week.id} className="ds-card-soft space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {weekData.label}
                  </h3>
                  <p className="ds-subtitle">
                    {toArabicRange(weekData.week.start_date)}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="ds-badge-primary">
                    {weekData.tasks.length} مهمة
                  </span>
                  <span className="ds-subtitle">
                    {index === 0 ? "الأسبوع الجاري" : "الأسبوع التالي"}
                  </span>
                </div>
              </div>

              {weekData.tasks.length === 0 ? (
                <p className="text-sm text-gray-500">
                  لا توجد مهام لهذا الأسبوع.
                </p>
              ) : (
                <ul className="space-y-2">
                  {weekData.tasks.map((weekTask) => (
                    <li
                      key={weekTask.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2"
                    >
                      <span className="text-sm font-medium text-gray-800">
                        {weekTask.task_name}
                      </span>

                      <div className="flex items-center gap-2">
                        {weekTask.category_name && (
                          <span className="ds-badge">
                            {weekTask.category_name}
                          </span>
                        )}
                        <span className="ds-badge-primary">
                          {weekTask.task_days?.length ?? ALL_DAYS.length} أيام
                        </span>

                        <span
                          className={
                            (weekTask.assigned_user_ids?.length ?? 0) > 0
                              ? "ds-badge bg-amber-50 text-amber-700"
                              : "ds-badge bg-emerald-50 text-emerald-700"
                          }
                        >
                          {(weekTask.assigned_user_ids?.length ?? 0) > 0
                            ? `مخصص (${weekTask.assigned_user_ids?.length ?? 0})`
                            : "للجميع"}
                        </span>

                        <button
                          type="button"
                          onClick={() => openAssignmentModal(weekTask)}
                          title="تخصيص المهمة للمستخدمين"
                          aria-label="تخصيص المهمة للمستخدمين"
                          className="inline-flex h-7 items-center rounded-md border border-indigo-200 bg-indigo-50 px-2 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                        >
                          تخصيص
                        </button>

                        {isNextWeek && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteTaskFromNextWeek(weekTask)
                            }
                            disabled={
                              deletingWeekTaskId === weekTask.id ||
                              deletingWeekTaskId !== null
                            }
                            title="حذف المهمة"
                            aria-label="حذف المهمة"
                            className="inline-flex size-7 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 transition-colors hover:bg-red-100 focus:ring-2 focus:ring-red-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingWeekTaskId === weekTask.id ? (
                              <span className="size-3 animate-spin rounded-full border-2 border-red-700 border-t-transparent" />
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="size-4"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                />
                              </svg>
                            )}
                            <span className="sr-only">حذف</span>
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {isNextOrFutureWeek ? (
                <p className="text-xs text-gray-500">
                  إضافة المهام لهذا الأسبوع متاحة من زر الإضافة بالأعلى.
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  إضافة المهام متاحة للأسبوع القادم فقط.
                </p>
              )}

              {deleteErrorByWeek[weekData.week.id] && (
                <p className="text-xs text-red-600">
                  {deleteErrorByWeek[weekData.week.id]}
                </p>
              )}
            </article>
          );
        })}
      </div>

      {confirmDeleteWeekTask && (
        <div className="ds-modal-overlay">
          <div className="ds-modal space-y-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                تأكيد حذف المهمة
              </h3>
              <p className="ds-subtitle mt-1">
                هل تريد حذف مهمة {confirmDeleteWeekTask.task_name} من الأسبوع
                القادم؟
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                onClick={confirmDeleteTaskFromNextWeek}
                disabled={deletingWeekTaskId === confirmDeleteWeekTask.id}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {deletingWeekTaskId === confirmDeleteWeekTask.id
                  ? "جاري الحذف..."
                  : "تأكيد الحذف"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setConfirmDeleteWeekTask(null)}
                disabled={deletingWeekTaskId === confirmDeleteWeekTask.id}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}

      {assignmentModalTask && (
        <div className="ds-modal-overlay">
          <div className="ds-modal ds-modal-scroll space-y-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                تخصيص المهمة للمستخدمين
              </h3>
              <p className="ds-subtitle mt-1">
                المهمة: {assignmentModalTask.task_name}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                إذا لم تختَر أي مستخدم، ستظهر المهمة للجميع.
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">المستخدمون</p>
                <button
                  type="button"
                  onClick={() => setSelectedAssignedUserIds([])}
                  disabled={selectedAssignedUserIds.length === 0}
                  className="rounded-md border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  إلغاء تحديد الكل
                </button>
              </div>

              <div className="max-h-56 space-y-1 overflow-auto rounded border border-gray-200 bg-white p-2">
                {users.map((user) => (
                  <label
                    key={user.id}
                    htmlFor={`assign-user-${user.id}`}
                    className="flex items-center gap-2 rounded p-2 hover:bg-gray-50 has-checked:bg-indigo-50"
                  >
                    <input
                      type="checkbox"
                      id={`assign-user-${user.id}`}
                      checked={selectedAssignedUserIds.includes(user.id)}
                      onChange={() => toggleAssignedUser(user.id)}
                      className="ds-input hidden"
                    />

                    <div className="flex-1 text-sm text-gray-800">
                      {user.full_name || user.username}
                    </div>

                    <span className="ds-badge bg-gray-50 text-gray-600">
                      {user.role}
                    </span>
                  </label>
                ))}
              </div>

              {selectedAssignedUsers.length > 0 && (
                <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50 p-3">
                  <p className="text-xs font-semibold text-indigo-800">
                    المستخدمون المحددون ({selectedAssignedUsers.length})
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedAssignedUsers.map((user) => (
                      <span key={user.id} className="ds-badge bg-white text-indigo-700">
                        {user.full_name || user.username}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {assignmentError && (
              <p className="text-xs text-red-600">{assignmentError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                onClick={saveTaskAssignment}
                disabled={assignmentSavingTaskId === assignmentModalTask.id}
                className="flex-1"
              >
                {assignmentSavingTaskId === assignmentModalTask.id
                  ? "جاري الحفظ..."
                  : "حفظ"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setAssignmentModalTask(null);
                  setAssignmentError("");
                }}
                disabled={assignmentSavingTaskId === assignmentModalTask.id}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="ds-modal-overlay">
          <div className="ds-modal ds-modal-scroll space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  إضافة مهمة للأسبوع القادم
                </h3>
                {nextWeekData && (
                  <p className="ds-subtitle mt-1">
                    {nextWeekData.label} •{" "}
                    {toArabicRange(nextWeekData.week.start_date)}
                  </p>
                )}
              </div>

              <button
                type="button"
                className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setModalError("");
                }}
                disabled={savingWeekId !== null}
              >
                إغلاق
              </button>
            </div>

            {!nextWeekData ? (
              <p className="text-sm text-gray-500">
                لا يوجد أسبوع قادم متاح حالياً.
              </p>
            ) : (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    اختر المهام
                  </label>

                  <div className="mb-2 flex gap-2">
                    <input
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      placeholder="ابحث عن مهمة أو فئة"
                      className="ds-input min-w-0"
                      disabled={
                        nextWeekAvailableTasks.length === 0 ||
                        savingWeekId === nextWeekData.week.id
                      }
                    />

                    <button
                      type="button"
                      onClick={selectAllVisible}
                      disabled={visibleTasks.length === 0}
                      className="rounded-lg border border-primary-200 px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-50 disabled:opacity-60"
                    >
                      تحديد الكل
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedTaskIds([])}
                      disabled={selectedTaskIds.length === 0}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                      مسح
                    </button>
                  </div>

                  <div className="max-h-56 space-y-1 overflow-auto rounded border border-gray-200 bg-white p-2">
                    {visibleTasks.map((task) => (
                      <label
                        key={task.id}
                        htmlFor={`select-task-${task.id}`}
                        className="flex items-center gap-2 rounded p-2 hover:bg-gray-50 has-checked:bg-primary-50"
                      >
                        <input
                          type="checkbox"
                          id={`select-task-${task.id}`}
                          checked={selectedTaskIds.includes(task.id)}
                          onChange={() => toggleTaskSelection(task.id)}
                          className="ds-input hidden"
                        />

                        <div className="flex-1 text-sm text-gray-800">
                          {task.name}
                        </div>

                        {categoryNameById.get(task.category_id || "") && (
                          <span className="ds-badge bg-gray-50">
                            {categoryNameById.get(task.category_id || "")}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>

                  <p className="mt-1 text-xs text-gray-500">
                    {`اضغط على اسم المهمة لاختيارها ويمكنك استخدام أزرار "تحديد الكل" و"مسح".`}
                  </p>
                </div>

                {nextWeekAvailableTasks.length === 0 && (
                  <p className="text-xs text-gray-500">
                    كل المهام مضافة بالفعل للأسبوع القادم.
                  </p>
                )}

                {selectedTasks.length > 0 && (
                  <div className="rounded-xl border border-primary-200 bg-primary-50 p-3">
                    <p className="text-xs font-semibold text-primary-800">
                      المهام المحددة ({selectedTasks.length})
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedTasks.map((task) => (
                        <span key={task.id} className="ds-badge-primary">
                          {task.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {modalError && (
                  <p className="text-xs text-red-600">{modalError}</p>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={handleAddTasksToNextWeek}
                    disabled={
                      savingWeekId === nextWeekData.week.id ||
                      nextWeekAvailableTasks.length === 0 ||
                      selectedTaskIds.length === 0
                    }
                    className="flex-1"
                  >
                    {savingWeekId === nextWeekData.week.id
                      ? "جاري..."
                      : "إضافة"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setModalError("");
                    }}
                    disabled={savingWeekId === nextWeekData.week.id}
                  >
                    إلغاء
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
