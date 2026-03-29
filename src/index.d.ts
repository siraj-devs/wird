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

  type role = `${ROLES}`;

  interface User {
    id: string;
    username: string;
    provider_id: string;
    role: Role;
    email: nullable<string>;
    full_name: nullable<string>;
    phone_number: nullable<string>;
    avatar_url: nullable<string>;
    created_at: string;
    updated_at: string;
  }

  interface Category {
    id: string;
    name: string;
    tasks?: number;
  }

  interface Task {
    id: string;
    name: string;
    category_id: nullable<string>;
    days: number[];
  }

  interface Week {
    id: string;
    start_date: string;
  }

  interface WeekTask {
    id: string;
    week_id: string;
    task_id: nullable<string>;
    task_name: string;
    task_days: nullable<number[]>;
    category_id: nullable<string>;
    category_name: nullable<string>;
    sort_order: number;
  }

  interface UserTask {
    id: string;
    user_id: string;
    week_task_id: nullable<string>;
    task_name: string;
    category_name: nullable<string>;
    completed_at: string;
  }

  interface WeeklySummary {
    week: Week;
    tasks: Array<{
      weekTask: WeekTask;
      completions: number;
      targetCount: number;
    }>;
  }
}

export {};
