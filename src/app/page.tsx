import { getUser } from "@/actions";
import { getIdFromToken } from "@/lib/auth";
import { ROLES } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function Home() {
  const id = await getIdFromToken();
  const user = await getUser(id);
  if (!user) redirect("/logout");

  if (user.role === ROLES.GUEST) {
    redirect("/requests");
  } else if (user.role === ROLES.ADMIN || user.role === ROLES.OWNER) {
    redirect("/panel");
  } else if (user.role === ROLES.MEMBER) {
    redirect("/tasks");
  } else {
    redirect("/logout");
  }
}
