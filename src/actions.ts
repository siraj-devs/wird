import { supabaseAdmin } from "./lib/supabase";

export const getUser = async (id: string) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data as User;
  } catch {
    return null;
  }
};

export const getCategories = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw error;
    return data as Category[];
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getTasks = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from("tasks")
      .select("*");
    if (error) throw error;
    return data as Task[];
  } catch (error) {
    console.error(error);
    return [];
  }
};

const formatDateOnly = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const APP_TIMEZONE = "Africa/Casablanca";

const getDateKeyInTimezone = (date: Date, timeZone = APP_TIMEZONE): string => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const isSameDayInTimezone = (
  dateA: Date,
  dateB: Date,
  timeZone = APP_TIMEZONE,
): boolean => {
  return getDateKeyInTimezone(dateA, timeZone) === getDateKeyInTimezone(dateB, timeZone);
};

// App day index is Saturday=1 ... Friday=7.
const getAppDayOfWeek = (date: Date): number => {
  return ((date.getDay() + 1) % 7) + 1;
};

const attachAssignmentMetadata = async (
  weekTasks: WeekTask[],
): Promise<WeekTask[]> => {
  if (weekTasks.length === 0) return [];

  const { data: assignments, error: assignmentsError } = await supabaseAdmin
    .from("week_task_assignments")
    .select("week_task_id, user_id")
    .in(
      "week_task_id",
      weekTasks.map((task) => task.id),
    );

  if (assignmentsError) throw assignmentsError;

  const assignmentMap = new Map<string, string[]>();

  for (const assignment of assignments ?? []) {
    const current = assignmentMap.get(assignment.week_task_id) ?? [];
    current.push(assignment.user_id);
    assignmentMap.set(assignment.week_task_id, current);
  }

  return weekTasks.map((task) => {
    const assignedUserIds = assignmentMap.get(task.id) ?? [];

    return {
      ...task,
      assigned_user_ids: assignedUserIds,
      is_assigned_only: assignedUserIds.length > 0,
    };
  });
};

export const getVisibleWeekTasksForUser = async (
  weekId: string,
  userId: string,
): Promise<WeekTask[]> => {
  try {
    const { data: weekTasks, error } = await supabaseAdmin
      .from("week_tasks")
      .select("*")
      .eq("week_id", weekId)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    const weekTasksWithAssignments = await attachAssignmentMetadata(
      (weekTasks ?? []) as WeekTask[],
    );

    return weekTasksWithAssignments.filter((weekTask) => {
      if (!weekTask.is_assigned_only) return true;
      return (weekTask.assigned_user_ids ?? []).includes(userId);
    });
  } catch (error) {
    console.error(error);
    return [];
  }
};

// Helper to get Saturday of a given week
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = (day + 1) % 7; // Days since Saturday
  d.setDate(d.getDate() - diff);
  return d;
};

// Get or create a week record
export const getOrCreateWeek = async (date: Date): Promise<Week | null> => {
  try {
    const weekStart = getWeekStart(date);
    const startDateStr = formatDateOnly(weekStart);

    // Try to find existing week
    const { data: existing } = await supabaseAdmin
      .from("weeks")
      .select("*")
      .eq("start_date", startDateStr)
      .single();

    if (existing) return existing as Week;

    // Create new week
    const { data, error } = await supabaseAdmin
      .from("weeks")
      .insert({
        start_date: startDateStr,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Week;
  } catch (error) {
    console.error(error);
    return null;
  }
};

// Get week tasks with completion status for a user
export const getWeekTasksForUser = async (
  weekId: string,
  userId: string,
  targetDate: Date = new Date(),
): Promise<(WeekTask & { completed_at: string | null })[]> => {
  try {
    const weekTasks = await getVisibleWeekTasksForUser(weekId, userId);

    if (weekTasks.length === 0) {
      return [];
    }

    const weekTasksWithAssignments = await attachAssignmentMetadata(
      weekTasks,
    );

    // Get user completions for this week
    const { data: completions } = await supabaseAdmin
      .from("user_tasks")
      .select("week_task_id, completed_at")
      .eq("user_id", userId)
      .in(
        "week_task_id",
        weekTasksWithAssignments.map((weekTask) => weekTask.id),
      );

    const selectedDayCompletions = (completions ?? []).filter((completion) => {
      if (!completion.completed_at) return false;
      return isSameDayInTimezone(new Date(completion.completed_at), targetDate);
    });

    const completionMap = new Map(
      selectedDayCompletions.map((c) => [c.week_task_id, c.completed_at]),
    );

    // Merge data
    return weekTasksWithAssignments.map((wt) => ({
      ...wt,
      completed_at: completionMap.get(wt.id) ?? null,
    })) as (WeekTask & { completed_at: string | null })[];
  } catch (error) {
    console.error(error);
    return [];
  }
};

// Get user tasks for a selected day (default: today)
export const getUserTasks = async (
  userId: string,
  targetDate: Date = new Date(),
): Promise<UserTask[]> => {
  try {
    const week = await getOrCreateWeek(targetDate);
    if (!week) return [];

    const weekTasks = await getWeekTasksForUser(week.id, userId, targetDate);

    const selectedDayOfWeek = getAppDayOfWeek(targetDate);

    return weekTasks
      .filter(
        (wt) =>
          !wt.task_days ||
          wt.task_days.length === 0 ||
          wt.task_days.includes(selectedDayOfWeek),
      )
      .map((wt) => ({
        id: wt.id,
        user_id: userId,
        week_task_id: wt.id,
        task_name: wt.task_name,
        category_name: wt.category_name ?? null,
        completed_at: wt.completed_at ?? "",
      })) as UserTask[];
  } catch (error) {
    console.error(error);
    return [];
  }
};

// Clone week tasks from one week to another
export const cloneWeekTasks = async (
  sourceWeekId: string,
  targetWeekId: string
): Promise<boolean> => {
  try {
    const { data: sourceWeekTasks, error: fetchError } = await supabaseAdmin
      .from("week_tasks")
      .select("*")
      .eq("week_id", sourceWeekId);

    if (fetchError || !sourceWeekTasks) return false;

    const tasksToClone = sourceWeekTasks.map((wt) => ({
      week_id: targetWeekId,
      task_id: wt.task_id,
      task_name: wt.task_name,
      task_days: wt.task_days,
      category_id: wt.category_id,
      category_name: wt.category_name,
      sort_order: wt.sort_order,
    }));

    const { error: insertError } = await supabaseAdmin
      .from("week_tasks")
      .insert(tasksToClone);

    if (insertError) return false;

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

// Get all weeks
export const getWeeks = async (): Promise<Week[]> => {
  try {
    const { data: weeks, error } = await supabaseAdmin
      .from("weeks")
      .select("*")
      .order("start_date", { ascending: false })
      .limit(20);

    if (error) throw error;
    return weeks as Week[];
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getCurrentAndNextWeeksTasks = async (): Promise<
  {
    label: string;
    week: Week;
    tasks: WeekTask[];
  }[]
> => {
  try {
    const now = new Date();
    const currentWeek = await getOrCreateWeek(now);
    if (!currentWeek) return [];

    const nextWeekDate = new Date(getWeekStart(now));
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);
    const nextWeek = await getOrCreateWeek(nextWeekDate);
    if (!nextWeek) {
      const { data: currentWeekTasks, error: currentError } = await supabaseAdmin
        .from("week_tasks")
        .select("*")
        .eq("week_id", currentWeek.id)
        .order("sort_order", { ascending: true });

      if (currentError) throw currentError;

      const currentWeekTasksWithAssignments = await attachAssignmentMetadata(
        (currentWeekTasks ?? []) as WeekTask[],
      );

      return [
        {
          label: "الأسبوع الحالي",
          week: currentWeek,
          tasks: currentWeekTasksWithAssignments,
        },
      ];
    }

    const weekIds = [currentWeek.id, nextWeek.id];

    const { data: weekTasks, error } = await supabaseAdmin
      .from("week_tasks")
      .select("*")
      .in("week_id", weekIds)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    const weekTasksWithAssignments = await attachAssignmentMetadata(
      (weekTasks ?? []) as WeekTask[],
    );

    const grouped = new Map<string, WeekTask[]>();
    for (const task of weekTasksWithAssignments) {
      const list = grouped.get(task.week_id) ?? [];
      list.push(task);
      grouped.set(task.week_id, list);
    }

    return [
      {
        label: "الأسبوع الحالي",
        week: currentWeek,
        tasks: grouped.get(currentWeek.id) ?? [],
      },
      {
        label: "الأسبوع القادم",
        week: nextWeek,
        tasks: grouped.get(nextWeek.id) ?? [],
      },
    ];
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getAllWeeksWithTasks = async (): Promise<
  {
    week: Week;
    tasks: WeekTask[];
  }[]
> => {
  try {
    const { data: weeks, error: weeksError } = await supabaseAdmin
      .from("weeks")
      .select("*")
      .order("start_date", { ascending: false });

    if (weeksError) throw weeksError;

    const normalizedWeeks = (weeks ?? []) as Week[];
    if (normalizedWeeks.length === 0) return [];

    const weekIds = normalizedWeeks.map((week) => week.id);

    const { data: weekTasks, error: tasksError } = await supabaseAdmin
      .from("week_tasks")
      .select("*")
      .in("week_id", weekIds)
      .order("sort_order", { ascending: true });

    if (tasksError) throw tasksError;

    const weekTasksWithAssignments = await attachAssignmentMetadata(
      (weekTasks ?? []) as WeekTask[],
    );

    const groupedTasks = new Map<string, WeekTask[]>();
    for (const task of weekTasksWithAssignments) {
      const list = groupedTasks.get(task.week_id) ?? [];
      list.push(task);
      groupedTasks.set(task.week_id, list);
    }

    return normalizedWeeks.map((week) => ({
      week,
      tasks: groupedTasks.get(week.id) ?? [],
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getUsers = async () => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return users as User[];
  } catch {
    return [];
  }
};

// Get assignments for a week task
export const getWeekTaskAssignments = async (weekTaskId: string) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("week_task_assignments")
      .select("user_id")
      .eq("week_task_id", weekTaskId);
    if (error) throw error;
    return (data || []).map(item => item.user_id) as string[];
  } catch {
    return [];
  }
};

// Assign a week task to users
export const assignWeekTaskToUsers = async (
  weekTaskId: string,
  userIds: string[]
): Promise<boolean> => {
  try {
    // Delete existing assignments
    await supabaseAdmin
      .from("week_task_assignments")
      .delete()
      .eq("week_task_id", weekTaskId);

    // If userIds is empty, task is visible to all
    if (userIds.length === 0) {
      return true;
    }

    // Create new assignments
    const assignments = userIds.map(userId => ({
      week_task_id: weekTaskId,
      user_id: userId
    }));

    const { error } = await supabaseAdmin
      .from("week_task_assignments")
      .insert(assignments);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error assigning week task:", error);
    return false;
  }
};

// Remove assignments from a week task (make it visible to all)
export const clearWeekTaskAssignments = async (
  weekTaskId: string
): Promise<boolean> => {
  try {
    const { error } = await supabaseAdmin
      .from("week_task_assignments")
      .delete()
      .eq("week_task_id", weekTaskId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error clearing assignments:", error);
    return false;
  }
};

