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

interface AccessRequest {
  id: string;
  user_id: string;
  full_name_arabic: string;
  phone_number: string;
  status: "pending" | "approved" | "denied" | "banned";
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

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
