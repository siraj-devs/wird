import { mapAuthUser } from "@/lib/auth-db";
import { supabaseNew } from "@/lib/supabase";

const APP_TIMEZONE = "Africa/Casablanca";

export type ProgramDetails = {
  program: Program;
  members: (ProgramMember & { user?: User })[];
  categories: ProgramCategory[];
  tasks: (ProgramTask & { category?: ProgramCategory })[];
  friends: ProgramFriend[];
};

/** App weekday 1=Sat … 7=Fri for a YYYY-MM-DD (or Date) in Casablanca. */
export function getAppWeekday(date: Date | string): number {
  const key =
    typeof date === "string"
      ? date
      : new Intl.DateTimeFormat("en-CA", {
          timeZone: APP_TIMEZONE,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(date);
  const d = new Date(`${key}T12:00:00`);
  return ((d.getDay() + 1) % 7) + 1;
}

export function toDateKey(date: Date, timeZone = APP_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function isProgramTaskActiveOnDate(
  task: ProgramTask,
  dateKey: string,
): boolean {
  if (task.schedule_type === "recurring") {
    const day = getAppWeekday(dateKey);
    return (task.days ?? []).includes(day);
  }
  return (
    !!task.start_date &&
    !!task.end_date &&
    dateKey >= task.start_date &&
    dateKey <= task.end_date
  );
}

export function orderedFriendPair(
  userId: string,
  friendId: string,
): { user_a_id: string; user_b_id: string } {
  return userId < friendId
    ? { user_a_id: userId, user_b_id: friendId }
    : { user_a_id: friendId, user_b_id: userId };
}

function normalizeUser(raw: unknown): User | undefined {
  if (!raw || Array.isArray(raw)) return undefined;
  return mapAuthUser(raw as Parameters<typeof mapAuthUser>[0]);
}

export async function getPrograms(): Promise<Program[]> {
  try {
    const { data, error } = await supabaseNew
      .from("programs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Program[];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getProgramById(
  programId: string,
): Promise<Program | null> {
  try {
    const { data, error } = await supabaseNew
      .from("programs")
      .select("*")
      .eq("id", programId)
      .single();
    if (error) throw error;
    return data as Program;
  } catch {
    return null;
  }
}

export async function getProgramCategories(
  programId: string,
): Promise<ProgramCategory[]> {
  try {
    const { data, error } = await supabaseNew
      .from("program_categories")
      .select("*")
      .eq("program_id", programId)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as ProgramCategory[];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getProgramTasks(
  programId: string,
): Promise<(ProgramTask & { category?: ProgramCategory })[]> {
  try {
    const { data, error } = await supabaseNew
      .from("program_tasks")
      .select("*, category:program_categories(*)")
      .eq("program_id", programId)
      .order("sort_order", { ascending: true });
    if (error) throw error;

    return (data ?? []).map((row) => {
      const category = row.category as unknown;
      return {
        id: row.id,
        program_id: row.program_id,
        category_id: row.category_id,
        name: row.name,
        schedule_type: row.schedule_type,
        days: row.days,
        start_date: row.start_date,
        end_date: row.end_date,
        sort_order: row.sort_order,
        created_at: row.created_at,
        category:
          category && !Array.isArray(category)
            ? (category as ProgramCategory)
            : undefined,
      };
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getProgramMembers(
  programId: string,
): Promise<(ProgramMember & { user?: User })[]> {
  try {
    const { data, error } = await supabaseNew
      .from("program_members")
      .select("*, user:users(*, connections(*))")
      .eq("program_id", programId)
      .order("joined_at", { ascending: true });
    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id,
      program_id: row.program_id,
      user_id: row.user_id,
      joined_at: row.joined_at,
      user: normalizeUser(row.user),
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getProgramFriends(
  programId: string,
  status?: ProgramFriendStatus,
): Promise<ProgramFriend[]> {
  try {
    const { data, error } = await supabaseNew
      .from("program_friends")
      .select("*")
      .eq("program_id", programId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const rows = (data ?? []) as ProgramFriend[];
    if (!status) return rows;

    // Treat missing/null status as accepted (pre-migration rows).
    if (status === "accepted") {
      return rows.filter((row) => isAcceptedFriendStatus(row.status));
    }
    return rows.filter((row) => row.status === status);
  } catch (error) {
    console.error(error);
    return [];
  }
}

/** Pending requests only; everything else (incl. legacy null) counts as accepted. */
export function isAcceptedFriendStatus(
  status: ProgramFriendStatus | null | undefined,
): boolean {
  return status !== "pending";
}

export async function getUserPrograms(userId: string): Promise<Program[]> {
  try {
    const { data, error } = await supabaseNew
      .from("program_members")
      .select("program:programs(*), joined_at")
      .eq("user_id", userId)
      .order("joined_at", { ascending: true });
    if (error) throw error;

    return (data ?? [])
      .map((row) => {
        const program = row.program as unknown;
        if (!program || Array.isArray(program)) return null;
        return program as Program;
      })
      .filter((program): program is Program => program !== null);
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function isProgramMember(
  programId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await supabaseNew
    .from("program_members")
    .select("id")
    .eq("program_id", programId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

/** Accepted friends only — used for progress visibility. */
export async function getFriendIdsInProgram(
  programId: string,
  userId: string,
): Promise<string[]> {
  const friends = await getProgramFriends(programId, "accepted");
  return friends
    .filter((f) => f.user_a_id === userId || f.user_b_id === userId)
    .map((f) => (f.user_a_id === userId ? f.user_b_id : f.user_a_id));
}

export function otherFriendUserId(
  friendship: ProgramFriend,
  userId: string,
): string {
  return friendship.user_a_id === userId
    ? friendship.user_b_id
    : friendship.user_a_id;
}

export async function getUserProgramFriendsBoard(
  userId: string,
): Promise<ProgramFriendsBoard[]> {
  const programs = await getUserPrograms(userId);
  const boards: ProgramFriendsBoard[] = [];

  for (const program of programs) {
    const [members, friendships] = await Promise.all([
      getProgramMembers(program.id),
      getProgramFriends(program.id),
    ]);

    const memberUsers = members
      .map((m) => m.user)
      .filter((u): u is User => !!u)
      .filter((u) => u.id !== userId);

    const usersById = new Map(
      members
        .map((m) => m.user)
        .filter((u): u is User => !!u)
        .map((u) => [u.id, u]),
    );

    const annotate = (f: ProgramFriend) => {
      const other_user_id = otherFriendUserId(f, userId);
      return {
        ...f,
        other_user_id,
        other_user: usersById.get(other_user_id),
      };
    };

    const mine = friendships.filter(
      (f) => f.user_a_id === userId || f.user_b_id === userId,
    );

    boards.push({
      program,
      members: memberUsers,
      accepted: mine
        .filter((f) => isAcceptedFriendStatus(f.status))
        .map(annotate),
      incoming: mine
        .filter(
          (f) => f.status === "pending" && f.requester_id !== userId,
        )
        .map(annotate),
      outgoing: mine
        .filter(
          (f) => f.status === "pending" && f.requester_id === userId,
        )
        .map(annotate),
    });
  }

  return boards;
}

export async function getProgramWithDetails(
  programId: string,
): Promise<ProgramDetails | null> {
  try {
    const program = await getProgramById(programId);
    if (!program) return null;

    const [members, categories, tasks, friends] = await Promise.all([
      getProgramMembers(programId),
      getProgramCategories(programId),
      getProgramTasks(programId),
      getProgramFriends(programId), // all statuses for admin visibility
    ]);

    return { program, members, categories, tasks, friends };
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function getProgramsWithDetails(): Promise<ProgramDetails[]> {
  const programs = await getPrograms();
  const details = await Promise.all(
    programs.map((program) => getProgramWithDetails(program.id)),
  );
  return details.filter((d): d is ProgramDetails => d !== null);
}

export async function getUserProgramTasksSections(
  userId: string,
  targetDate: Date = new Date(),
): Promise<{ sections: UserProgramTasksSection[]; hasPrograms: boolean }> {
  const dateKey = toDateKey(targetDate);
  const programs = await getUserPrograms(userId);

  if (programs.length === 0) {
    return { sections: [], hasPrograms: false };
  }

  const sections: UserProgramTasksSection[] = [];

  for (const program of programs) {
    const [tasks, friendIds] = await Promise.all([
      getProgramTasks(program.id),
      getFriendIdsInProgram(program.id, userId),
    ]);

    const activeTasks = tasks.filter((task) =>
      isProgramTaskActiveOnDate(task, dateKey),
    );

    if (activeTasks.length === 0) continue;

    const taskIds = activeTasks.map((t) => t.id);
    const userIds = [userId, ...friendIds];

    const { data: completions } = await supabaseNew
      .from("program_task_completions")
      .select("*")
      .in("program_task_id", taskIds)
      .in("user_id", userIds)
      .eq("completed_on", dateKey);

    const completionRows = (completions ?? []) as ProgramTaskCompletion[];

    const myCompletions = new Map(
      completionRows
        .filter((c) => c.user_id === userId)
        .map((c) => [c.program_task_id, c]),
    );

    const userTasks: UserTask[] = activeTasks.map((task) => {
      const completion = myCompletions.get(task.id);
      return {
        id: task.id,
        user_id: userId,
        week_task_id: task.id,
        task_name: task.name,
        category_name: task.category?.name ?? null,
        completed_at: completion?.completed_at ?? "",
      };
    });

    const byCategory = new Map<string, UserTask[]>();
    for (const task of userTasks) {
      const key = task.category_name ?? "بدون فئة";
      const list = byCategory.get(key) ?? [];
      list.push(task);
      byCategory.set(key, list);
    }

    const categories: UserTaskCategoryGroup[] = Array.from(
      byCategory.entries(),
    ).map(([name, categoryTasks]) => ({
      name,
      completed: categoryTasks.filter((t) => !!t.completed_at).length,
      total: categoryTasks.length,
      tasks: categoryTasks,
    }));

    sections.push({
      program,
      weekNumber: null,
      hasActiveWeek: true,
      categories,
      tasks: userTasks,
    });
  }

  return { sections, hasPrograms: true };
}

function parseDateKey(dateKey: string): Date {
  const parsed = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date key: ${dateKey}`);
  }
  return parsed;
}

function shiftDateKey(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** Saturday (app week start) for a given YYYY-MM-DD. */
export function startOfAppWeek(dateKey: string): string {
  const weekday = getAppWeekday(dateKey); // 1=Sat … 7=Fri
  return shiftDateKey(dateKey, -(weekday - 1));
}

export function enumerateDateKeys(
  startDate: string,
  endDate: string,
): string[] {
  if (endDate < startDate) return [];
  const keys: string[] = [];
  let cursor = startDate;
  while (cursor <= endDate) {
    keys.push(cursor);
    cursor = shiftDateKey(cursor, 1);
  }
  return keys;
}

function monthLabel(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString("ar-MA", {
    month: "long",
    year: "numeric",
  });
}

function weekLabel(startDate: string, endDate: string): string {
  const start = parseDateKey(startDate).toLocaleDateString("ar-MA", {
    month: "short",
    day: "numeric",
  });
  const end = parseDateKey(endDate).toLocaleDateString("ar-MA", {
    month: "short",
    day: "numeric",
  });
  return `${start} – ${end}`;
}

export function resolveProgramProgressRange(params: {
  view?: string | null;
  from?: string | null;
  now?: Date;
}): ProgramProgressRange {
  const now = params.now ?? new Date();
  const todayKey = toDateKey(now);
  const view: ProgramProgressView =
    params.view === "month" ? "month" : "week";

  const rawFrom =
    typeof params.from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.from)
      ? params.from
      : todayKey;

  if (view === "week") {
    const startDate = startOfAppWeek(rawFrom);
    const endDate = shiftDateKey(startDate, 6);
    return {
      view,
      startDate,
      endDate,
      dateKeys: enumerateDateKeys(startDate, endDate),
      label: weekLabel(startDate, endDate),
      prevFrom: shiftDateKey(startDate, -7),
      nextFrom: shiftDateKey(startDate, 7),
    };
  }

  const [yearStr, monthStr] = rawFrom.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr); // 1–12
  const paddedMonth = String(month).padStart(2, "0");
  const startDate = `${year}-${paddedMonth}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${paddedMonth}-${String(lastDay).padStart(2, "0")}`;

  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;

  return {
    view,
    startDate,
    endDate,
    dateKeys: enumerateDateKeys(startDate, endDate),
    label: monthLabel(startDate),
    prevFrom: `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`,
    nextFrom: `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`,
  };
}

async function resolveUserDisplayName(userId: string): Promise<string> {
  const { data: friendUser } = await supabaseNew
    .from("users")
    .select("name, connections(username, accessed_at)")
    .eq("id", userId)
    .maybeSingle();

  const connections = Array.isArray(friendUser?.connections)
    ? friendUser.connections
    : friendUser?.connections
      ? [friendUser.connections]
      : [];
  const primary = [...connections].sort(
    (a: { accessed_at: string }, b: { accessed_at: string }) =>
      new Date(b.accessed_at).getTime() - new Date(a.accessed_at).getTime(),
  )[0] as { username?: string } | undefined;

  return (
    (friendUser?.name as string | null) ?? primary?.username ?? "صديق"
  );
}

function buildProgressForUser(params: {
  userId: string;
  name: string;
  tasks: (ProgramTask & { category?: ProgramCategory })[];
  dateKeys: string[];
  completionRows: ProgramTaskCompletion[];
}): ProgramFriendDetailedProgress {
  const { userId, name, tasks, dateKeys, completionRows } = params;

  const completedSet = new Set(
    completionRows
      .filter((row) => row.user_id === userId)
      .map((row) => `${row.program_task_id}:${row.completed_on}`),
  );

  const taskRows: ProgramTaskProgressRow[] = tasks
    .map((task) => {
      const assignedKeys = dateKeys.filter((dateKey) =>
        isProgramTaskActiveOnDate(task, dateKey),
      );
      const completedKeys = assignedKeys.filter((dateKey) =>
        completedSet.has(`${task.id}:${dateKey}`),
      );
      return {
        task,
        assignedKeys,
        completedKeys,
        assignedCount: assignedKeys.length,
        completedCount: completedKeys.length,
      };
    })
    .filter((row) => row.assignedCount > 0);

  const completed = taskRows.reduce((sum, row) => sum + row.completedCount, 0);
  const total = taskRows.reduce((sum, row) => sum + row.assignedCount, 0);

  const daily: ProgramDailyProgress[] = dateKeys.map((dateKey) => {
    const dayTasks = tasks.filter((task) =>
      isProgramTaskActiveOnDate(task, dateKey),
    );
    const dayCompleted = dayTasks.filter((task) =>
      completedSet.has(`${task.id}:${dateKey}`),
    ).length;
    return {
      dateKey,
      completed: dayCompleted,
      total: dayTasks.length,
    };
  });

  return {
    user_id: userId,
    name,
    tasks: taskRows,
    completed,
    total,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    daily,
  };
}

export async function getUserProgramsProgress(
  userId: string,
  range: ProgramProgressRange,
): Promise<{
  sections: ProgramProgressSection[];
  hasPrograms: boolean;
}> {
  const programs = await getUserPrograms(userId);
  if (programs.length === 0) {
    return { sections: [], hasPrograms: false };
  }

  const sections: ProgramProgressSection[] = [];

  for (const program of programs) {
    const [tasks, friendIds] = await Promise.all([
      getProgramTasks(program.id),
      getFriendIdsInProgram(program.id, userId),
    ]);

    const taskIds = tasks.map((task) => task.id);
    const trackedUserIds = [userId, ...friendIds];

    let completionRows: ProgramTaskCompletion[] = [];
    if (taskIds.length > 0) {
      const { data: completions } = await supabaseNew
        .from("program_task_completions")
        .select("*")
        .in("program_task_id", taskIds)
        .in("user_id", trackedUserIds)
        .gte("completed_on", range.startDate)
        .lte("completed_on", range.endDate);

      completionRows = (completions ?? []) as ProgramTaskCompletion[];
    }

    const mine = buildProgressForUser({
      userId,
      name: "أنا",
      tasks,
      dateKeys: range.dateKeys,
      completionRows,
    });

    const friendSections: ProgramFriendDetailedProgress[] = [];
    for (const friendId of friendIds) {
      friendSections.push(
        buildProgressForUser({
          userId: friendId,
          name: await resolveUserDisplayName(friendId),
          tasks,
          dateKeys: range.dateKeys,
          completionRows,
        }),
      );
    }

    const friendProgress: UserProgramFriendProgress[] = friendSections.map(
      (friend) => ({
        user_id: friend.user_id,
        name: friend.name,
        completed: friend.completed,
        total: friend.total,
      }),
    );

    sections.push({
      program,
      tasks: mine.tasks,
      completed: mine.completed,
      total: mine.total,
      percent: mine.percent,
      daily: mine.daily,
      friendProgress,
      friendSections,
    });
  }

  return { sections, hasPrograms: true };
}

export async function saveProgramTaskCompletions(params: {
  userId: string;
  dateKey: string;
  programTaskIds: string[];
}): Promise<void> {
  const { userId, dateKey, programTaskIds } = params;

  // Resolve which program tasks belong to programs the user is in
  const programs = await getUserPrograms(userId);
  if (programs.length === 0) return;

  const allTasks = (
    await Promise.all(programs.map((p) => getProgramTasks(p.id)))
  ).flat();

  const activeIds = new Set(
    allTasks
      .filter((t) => isProgramTaskActiveOnDate(t, dateKey))
      .map((t) => t.id),
  );

  const toSave = programTaskIds.filter((id) => activeIds.has(id));

  // Delete existing completions for this user/day among active tasks
  if (activeIds.size > 0) {
    await supabaseNew
      .from("program_task_completions")
      .delete()
      .eq("user_id", userId)
      .eq("completed_on", dateKey)
      .in("program_task_id", Array.from(activeIds));
  }

  if (toSave.length === 0) return;

  const { error } = await supabaseNew.from("program_task_completions").insert(
    toSave.map((program_task_id) => ({
      program_task_id,
      user_id: userId,
      completed_on: dateKey,
    })),
  );

  if (error) throw error;
}
