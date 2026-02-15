import { ROLES } from "@/lib/utils";

declare global {
  type Role = typeof ROLES[keyof typeof ROLES];

  interface User {
    id: string;
    username: string;
    provider_id: string;
    role: Role;
    email: string | null;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
  }

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
}

export {};