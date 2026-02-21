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

export const getTasks = async (onlyActive: boolean = false) => {
  try {
    if (onlyActive) {
      const { data, error } = await supabaseAdmin
        .from("tasks")
        .select("*,categories(*)")
        .eq("is_active", true);
      if (error) throw error;
      return data as Task[];
    }
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
