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
      .select("*,tasks(*,categories(*))")
      .order("name", { ascending: true });
    if (error) throw error;
    const categories: Category[] = data.map((category) => ({
      ...category,
      tasks: category.tasks.length ?? 0,
    }));
    return categories;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getTasks = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from("tasks")
      .select("*,categories(*)");
    if (error) throw error;
    return data as Task[];
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getUserTasks = async (userId: string): Promise<UserTask[]> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const { data, error } = await supabaseAdmin
      .from("tasks")
      .select("*,categories(*),user_tasks(*)")
      .eq("is_active", true)
      .eq("user_tasks.user_id", userId)
      .gte("user_tasks.completed_at", today.toISOString())
      .lt("user_tasks.completed_at", tomorrow.toISOString());
    if (error) throw error;
    return data.map((task) => ({
      id: task.id as string,
      name: task.name as string,
      frequency: task.frequency as "daily" | "weekly" | "specific",
      weekly_days: task.weekly_days as nullable<number[]>,
      start_date: task.start_date as nullable<string>,
      end_date: task.end_date as nullable<string>,
      category: task.categories?.name ?? (null as nullable<string>),
      completed_at:
        task.user_tasks.at(0)?.completed_at ?? (null as nullable<string>),
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
};
