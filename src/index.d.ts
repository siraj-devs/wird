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

  interface Session {
    id: string;
    user_id: string;
    token: string;
    expires_at: string;
    created_at: string;
  }

  type ConnectionType = "discord" | "telegram";

  interface Connection {
    id: string;
    user_id: string;
    name: string;
    username: string;
    avatar: nullable<string>;
    type: ConnectionType;
    authorized_at: string;
    accessed_at: string;
  }

  interface User {
    id: string;
    name: nullable<string>;
    phone: nullable<string>;
    email: nullable<string>;
    role: Role;
    created_at: string;
    updated_at: string;
    connections?: Connection[];
    // Derived from primary connection / aliases for existing UI
    username: string;
    provider_id: string;
    friend_id: nullable<string>;
    full_name: nullable<string>;
    phone_number: nullable<string>;
    avatar_url: nullable<string>;
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
    program_id?: nullable<string>;
    is_assigned_only?: boolean;
    assigned_user_ids?: string[];
  }

  interface WeekTaskAssignment {
    id: string;
    week_task_id: string;
    user_id: string;
  }

  interface UserTask {
    id: string;
    user_id: string;
    week_task_id: nullable<string>;
    task_name: string;
    category_name: nullable<string>;
    completed_at: string;
  }

  interface MeetingAttendance {
    id: string;
    meeting_date: string;
    user_id: nullable<string>;
    guest_name: nullable<string>;
    status: "present" | "absent" | "appeal";
  }

  interface Feedback {
    id: string;
    user_id: string;
    answers: Record<string, unknown>;
    created_at: string;
  }

  interface WeeklySummary {
    week: Week;
    tasks: Array<{
      weekTask: WeekTask;
      completions: number;
      targetCount: number;
    }>;
  }

  interface Program {
    id: string;
    name: string;
    created_at: string;
  }

  interface ProgramMember {
    id: string;
    program_id: string;
    user_id: string;
    joined_at: string;
  }

  interface ProgramWeek {
    id: string;
    program_id: string;
    week_id: string;
    week_number: number;
    week?: Week;
  }

  interface UserProgramContext {
    program: Program;
    currentProgramWeek: ProgramWeek | null;
    weekNumber: number | null;
  }

  interface UserTaskCategoryGroup {
    name: string;
    completed: number;
    total: number;
    tasks: UserTask[];
  }

  interface UserProgramTasksSection {
    program: Program;
    weekNumber: number | null;
    hasActiveWeek: boolean;
    categories: UserTaskCategoryGroup[];
    tasks: UserTask[];
  }
}

export {};
