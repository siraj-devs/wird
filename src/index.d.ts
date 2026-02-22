import { ROLES } from "@/lib/roles";

declare global {
  type nullable<T> = T | null;

  interface JWTPayload {
    userId: string;
  }

  interface DiscordUser {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    email?: string;
  }

  type Role = (typeof ROLES)[keyof typeof ROLES];

  interface User {
    id: string;
    username: string;
    provider_id: string;
    role: Role;
    email: nullable<string>;
    avatar_url: nullable<string>;
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

  interface Category {
    id: string;
    name: string;
    tasks: number;
    created_at: string;
    updated_at: string;
  }

  interface Task {
    id: string;
    name: string;
    category_id: nullable<string>;
    is_active: boolean;
    frequency: "daily" | "weekly" | "specific";
    weekly_days: nullable<number[]>;
    start_date: nullable<string>;
    end_date: nullable<string>;
    created_at: string;
    updated_at: string;
    categories: nullable<Category>;
  }

  interface UserTask {
    id: string;
    name: string;
    frequency: "daily" | "weekly" | "specific";
    weekly_days: nullable<number[]>;
    start_date: nullable<string>;
    end_date: nullable<string>;
    category: any;
    completed_at: any;
  }
}

export {};
