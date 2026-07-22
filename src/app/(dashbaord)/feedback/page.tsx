import { FEEDBACK_ENABLED } from "@/consts";
import MemberFeedbackForm from "@/components/member-feedback-form";
import { checkRole } from "@/lib/auth-server";
import { ROLES } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";

export default async function FeedbackPage() {
  if (!FEEDBACK_ENABLED) redirect("/");

  const { id } = await checkRole([ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER]);

  const { data } = await supabaseAdmin
    .from("feedbacks")
    .select("id")
    .eq("user_id", id)
    .maybeSingle();

  return <MemberFeedbackForm initialSubmitted={Boolean(data)} />;
}
