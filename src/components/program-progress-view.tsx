import { DAYS_OF_WEEK } from "@/lib";
import {
  CalendarBlankIcon,
  CaretLeftIcon,
  CaretRightIcon,
  ChartLineUpIcon,
  CheckIcon,
  SmileyMehIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

function dayShortLabel(dateKey: string): string {
  const weekday = ((new Date(`${dateKey}T12:00:00`).getDay() + 1) % 7) + 1;
  return DAYS_OF_WEEK.find((day) => day.id === weekday)?.short ?? "";
}

function dayNumber(dateKey: string): number {
  return Number(dateKey.slice(-2));
}

function progressHref(view: ProgramProgressView, from: string) {
  const params = new URLSearchParams({ view, from });
  return `/progress?${params.toString()}`;
}

function todayDateKeyLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function achievementTone(percent: number) {
  if (percent >= 100)
    return { badge: "bg-yellow-100 text-yellow-900", bar: "bg-yellow-500" };
  if (percent >= 50)
    return { badge: "bg-orange-100 text-orange-900", bar: "bg-primary-500" };
  return { badge: "bg-red-100 text-red-900", bar: "bg-primary-400" };
}

function initial(name: string) {
  return name.trim().charAt(0) || "؟";
}

export default function ProgramProgressView({
  range,
  sections,
  hasPrograms,
}: {
  range: ProgramProgressRange;
  sections: ProgramProgressSection[];
  hasPrograms: boolean;
}) {
  const isWeek = range.view === "week";
  const todayKey = todayDateKeyLocal();
  const isCurrentRange = range.dateKeys.includes(todayKey);

  const overallCompleted = sections.reduce((sum, s) => sum + s.completed, 0);
  const overallTotal = sections.reduce((sum, s) => sum + s.total, 0);
  const overallPercent =
    overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6" dir="rtl">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-primary-200 bg-linear-to-l from-primary-50 via-white to-white p-6 shadow-sm">
        <div
          aria-hidden
          className="absolute -top-10 -left-10 size-40 rounded-full bg-primary-100/60 blur-2xl"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-kufam text-2xl font-bold text-gray-900">
              التقدم
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              تابع إنجازك الأسبوعي أو الشهري في كل برنامج
            </p>
          </div>

          {hasPrograms && overallTotal > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white/80 px-4 py-3 shadow-sm">
              <ProgressRing
                percent={overallPercent}
                size={52}
                strokeWidth={5}
              />
              <div>
                <p className="text-xs text-gray-500">الإجمالي</p>
                <p className="text-sm font-semibold text-gray-900">
                  {overallCompleted}/{overallTotal} مهمة
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Segmented control */}
        <div className="relative mt-5 inline-flex rounded-xl bg-white/70 p-1 shadow-inner ring-1 ring-gray-100">
          <Link
            href={progressHref("week", range.startDate)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              isWeek
                ? "bg-primary-500 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <CalendarBlankIcon size={16} weight={isWeek ? "fill" : "regular"} />
            أسبوعي
          </Link>
          <Link
            href={progressHref("month", range.startDate)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              !isWeek
                ? "bg-primary-500 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <ChartLineUpIcon size={16} weight={!isWeek ? "fill" : "regular"} />
            شهري
          </Link>
        </div>
      </div>

      {/* Range navigator */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
        <Link
          href={progressHref(range.view, range.nextFrom)}
          aria-label="التالي"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary-700"
        >
          <CaretRightIcon size={18} weight="bold" />
        </Link>

        <div className="flex flex-col items-center">
          <h2 className="text-sm font-bold text-gray-900 sm:text-base">
            {range.label}
          </h2>
          {!isCurrentRange && (
            <Link
              href={progressHref(range.view, todayKey)}
              className="mt-0.5 text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              الرجوع إلى اليوم
            </Link>
          )}
          {isCurrentRange && (
            <span className="mt-0.5 text-xs font-medium text-gray-400">
              {isWeek ? "الأسبوع الحالي" : "الشهر الحالي"}
            </span>
          )}
        </div>

        <Link
          href={progressHref(range.view, range.prevFrom)}
          aria-label="السابق"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary-700"
        >
          <CaretLeftIcon size={18} weight="bold" />
        </Link>
      </div>

      {!hasPrograms && <EmptyState message="لست عضواً في أي برنامج بعد." />}

      {hasPrograms && sections.length === 0 && (
        <EmptyState message="لا توجد بيانات في هذه الفترة." />
      )}

      {sections.map((section) => (
        <div key={section.program.id} className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2 px-1">
            <div>
              <h2 className="font-kufam text-xl font-bold text-gray-900">
                {section.program.name}
              </h2>
              {section.program.description && (
                <p className="text-sm text-gray-500">
                  {section.program.description}
                </p>
              )}
            </div>
          </div>

          <ProgressPersonCard
            title="تقدمي"
            subtitle={
              isWeek ? "إنجازي خلال هذا الأسبوع" : "إنجازي خلال هذا الشهر"
            }
            percent={section.percent}
            completed={section.completed}
            total={section.total}
            tasks={section.tasks}
            daily={section.daily}
            dateKeys={range.dateKeys}
            isWeek={isWeek}
            todayKey={todayKey}
            accent="mine"
          />

          {(section.friendSections ?? []).map((friend) => (
            <ProgressPersonCard
              key={friend.user_id}
              title={`تقدم ${friend.name}`}
              subtitle={
                isWeek
                  ? "إنجاز الصديق خلال هذا الأسبوع"
                  : "إنجاز الصديق خلال هذا الشهر"
              }
              percent={friend.percent}
              completed={friend.completed}
              total={friend.total}
              tasks={friend.tasks}
              daily={friend.daily}
              dateKeys={range.dateKeys}
              isWeek={isWeek}
              todayKey={todayKey}
              accent="friend"
              friendName={friend.name}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="ds-card flex flex-col items-center gap-2 py-10 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-gray-100 text-gray-400">
        <SmileyMehIcon size={26} />
      </div>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

function ProgressRing({
  percent,
  size = 64,
  strokeWidth = 6,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-gray-200)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-primary-500)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute text-sm font-bold text-gray-900">
        {clamped}%
      </span>
    </div>
  );
}

function ProgressPersonCard({
  title,
  subtitle,
  percent,
  completed,
  total,
  tasks,
  daily,
  dateKeys,
  isWeek,
  todayKey,
  accent,
  friendName,
}: {
  title: string;
  subtitle: string;
  percent: number;
  completed: number;
  total: number;
  tasks: ProgramTaskProgressRow[];
  daily: ProgramDailyProgress[];
  dateKeys: string[];
  isWeek: boolean;
  todayKey: string;
  accent: "mine" | "friend";
  friendName?: string;
}) {
  const tone = achievementTone(percent);

  return (
    <section
      className={`ds-card space-y-5 ${
        accent === "friend" ? "border-primary-100 bg-primary-50/20" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <ProgressRing percent={percent} />
          <div>
            <div className="mb-1 flex items-center gap-2">
              {accent === "friend" && friendName && (
                <span className="grid size-7 place-items-center rounded-full bg-primary-100 text-xs font-bold text-primary-800">
                  {initial(friendName)}
                </span>
              )}
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            </div>
            <p className="text-xs text-gray-500">{subtitle}</p>
            <p className="mt-1 text-xs text-gray-500">
              أكمل{" "}
              <span className="font-semibold text-gray-800">{completed}</span>{" "}
              من أصل{" "}
              <span className="font-semibold text-gray-800">{total}</span>
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${tone.badge}`}
        >
          {percent}%
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-2 rounded-full transition-all ${tone.bar}`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>

      {isWeek ? (
        <WeekProgressGrid
          tasks={tasks}
          dateKeys={dateKeys}
          todayKey={todayKey}
        />
      ) : (
        <MonthProgressSummary tasks={tasks} daily={daily} todayKey={todayKey} />
      )}
    </section>
  );
}

function WeekProgressGrid({
  tasks,
  dateKeys,
  todayKey,
}: {
  tasks: ProgramTaskProgressRow[];
  dateKeys: string[];
  todayKey: string;
}) {
  if (tasks.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
        لا توجد مهام مجدولة في هذا الأسبوع.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
      <div className="min-w-190">
        <div className="grid grid-cols-[minmax(160px,2fr)_repeat(7,minmax(44px,1fr))_minmax(52px,0.7fr)] gap-2 border-b border-gray-100 bg-gray-50 p-3">
          <div />
          {dateKeys.map((dateKey) => {
            const isToday = dateKey === todayKey;
            return (
              <div key={dateKey} className="text-center">
                <div
                  className={`text-xs font-medium ${
                    isToday ? "text-primary-600" : "text-gray-500"
                  }`}
                >
                  {dayShortLabel(dateKey)}
                </div>
                <div
                  className={`mx-auto mt-0.5 flex size-5 items-center justify-center rounded-full text-xs ${
                    isToday
                      ? "bg-primary-500 font-bold text-white"
                      : "text-gray-400"
                  }`}
                >
                  {dayNumber(dateKey)}
                </div>
              </div>
            );
          })}
          <div />
        </div>

        <div className="divide-y divide-gray-50">
          {tasks.map((row) => {
            const assigned = new Set(row.assignedKeys);
            const completed = new Set(row.completedKeys);

            return (
              <div
                key={row.task.id}
                className="grid grid-cols-[minmax(160px,2fr)_repeat(7,minmax(44px,1fr))_minmax(52px,0.7fr)] gap-2 p-3"
              >
                <div className="flex min-w-0 flex-col justify-center">
                  <span className="truncate text-sm font-medium text-gray-900">
                    {row.task.name}
                  </span>
                  {row.task.category?.name && (
                    <span className="truncate text-xs text-gray-500">
                      {row.task.category.name}
                    </span>
                  )}
                </div>

                {dateKeys.map((dateKey) => {
                  const isAssigned = assigned.has(dateKey);
                  const isCompleted = isAssigned && completed.has(dateKey);
                  const isToday = dateKey === todayKey;
                  return (
                    <div
                      key={dateKey}
                      className="flex items-center justify-center"
                    >
                      <div
                        className={`flex size-7 items-center justify-center rounded-lg transition-all ${
                          isCompleted
                            ? "bg-primary-500 text-white"
                            : isAssigned
                              ? `bg-primary-50 ${isToday ? "ring-2 ring-primary-300" : ""}`
                              : "border border-dashed border-gray-200 bg-gray-50"
                        }`}
                      >
                        {isCompleted && <CheckIcon size={13} weight="bold" />}
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center justify-center">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {row.completedCount}/{row.assignedCount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MonthProgressSummary({
  tasks,
  daily,
  todayKey,
}: {
  tasks: ProgramTaskProgressRow[];
  daily: ProgramDailyProgress[];
  todayKey: string;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
        <div className="overflow-x-auto">
          <div className="flex min-w-max items-end gap-1.5">
            {daily.map((day) => {
              const ratio =
                day.total > 0
                  ? Math.round((day.completed / day.total) * 100)
                  : 0;
              const isToday = day.dateKey === todayKey;
              return (
                <div
                  key={day.dateKey}
                  className="flex w-7 flex-col items-center gap-1"
                  title={`${day.dateKey}: ${day.completed}/${day.total}`}
                >
                  <div className="flex h-16 w-full items-end justify-center rounded-full bg-gray-100">
                    <div
                      className={`w-full rounded-full transition-all ${
                        day.total === 0
                          ? "bg-transparent"
                          : ratio === 100
                            ? "bg-yellow-400"
                            : ratio > 0
                              ? "bg-primary-400"
                              : "bg-primary-100"
                      }`}
                      style={{
                        height:
                          day.total === 0 ? "10%" : `${Math.max(ratio, 10)}%`,
                      }}
                    />
                  </div>
                  <span
                    className={`text-[10px] ${
                      isToday ? "font-bold text-primary-600" : "text-gray-400"
                    }`}
                  >
                    {dayNumber(day.dateKey)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
          لا توجد مهام مجدولة في هذا الشهر.
        </p>
      ) : (
        <ul className="divide-y divide-gray-50 rounded-xl border border-gray-100 bg-white">
          {tasks.map((row) => {
            const percent =
              row.assignedCount > 0
                ? Math.round((row.completedCount / row.assignedCount) * 100)
                : 0;
            return (
              <li
                key={row.task.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {row.task.name}
                    </p>
                    <span className="shrink-0 text-xs text-gray-500">
                      {row.completedCount}/{row.assignedCount}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-1.5 rounded-full bg-primary-500 transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-9 shrink-0 text-left text-xs font-semibold text-gray-600">
                      {percent}%
                    </span>
                  </div>
                  {row.task.category?.name && (
                    <p className="mt-1 text-xs text-gray-400">
                      {row.task.category.name}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
