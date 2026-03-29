"use client";

import { ALL_DAYS } from "@/lib";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "./ui/Button";

export default function ManageWeekTasks({
  weeks,
  tasks,
  categories,
}: {
  weeks: {
    label: string;
    week: Week;
    tasks: WeekTask[];
  }[];
  tasks: Task[];
  categories: Category[];
}) {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("");
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
  }, [weeks, currentWeekStartKey]);

  const nextWeekAvailableTasks = useMemo(() => {
    if (!nextWeekData) return [];

    const usedTaskIds = new Set(
      nextWeekData.tasks.map((weekTask) => weekTask.task_id).filter(Boolean),
    );

    return tasks.filter((task) => !usedTaskIds.has(task.id));
  }, [nextWeekData, tasks]);

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

  const handleAddTaskToNextWeek = async () => {
    if (!nextWeekData) {
      setModalError("لا يوجد أسبوع قادم متاح حالياً");
      return;
    }

    if (!selectedTaskId) {
      setModalError("الرجاء اختيار مهمة أولاً");
      return;
    }

    const selectedTask = tasks.find((task) => task.id === selectedTaskId);
    if (!selectedTask) {
      setModalError("المهمة المختارة غير موجودة");
      return;
    }

    setSavingWeekId(nextWeekData.week.id);
    setModalError("");

    try {
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
          sort_order: nextWeekData.tasks.length,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "فشل في إضافة المهمة");
      }

      setSelectedTaskId("");
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
            setSelectedTaskId("");
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
                        <span className="ds-badge">
                          {weekTask.category_name || "بدون فئة"}
                        </span>
                        <span className="ds-badge-primary">
                          {weekTask.task_days?.length ?? ALL_DAYS.length} أيام
                        </span>

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
                هل تريد حذف مهمة "{confirmDeleteWeekTask.task_name}" من الأسبوع
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
                    اختر مهمة
                  </label>
                  <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="ds-select"
                    disabled={
                      nextWeekAvailableTasks.length === 0 ||
                      savingWeekId === nextWeekData.week.id
                    }
                  >
                    <option value="">اختر مهمة لإضافتها</option>
                    {nextWeekAvailableTasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.name}
                      </option>
                    ))}
                  </select>
                </div>

                {nextWeekAvailableTasks.length === 0 && (
                  <p className="text-xs text-gray-500">
                    كل المهام مضافة بالفعل للأسبوع القادم.
                  </p>
                )}

                {modalError && (
                  <p className="text-xs text-red-600">{modalError}</p>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={handleAddTaskToNextWeek}
                    disabled={
                      savingWeekId === nextWeekData.week.id ||
                      nextWeekAvailableTasks.length === 0
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
