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

export const getRequests = async (id: string) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("access_requests")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const requests = data as AccessRequest[];
    const status = requests.at(0)?.status;
    return { requests, status };
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
      .select("*,categories(*)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const tasks = data as Task[];
    return tasks;
  } catch (error) {
    console.error(error);
    return [];
  }
};
