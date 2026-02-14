import { supabaseAdmin } from "./lib/supabase";

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string;
  provider_id: string;
  created_at: string;
  updated_at: string;
  role: "owner";
}

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
