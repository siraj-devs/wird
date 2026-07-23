import { getProgramsWithDetails } from "@/actions";
import ProgramList from "@/components/program-list";
import { checkRole } from "@/lib/auth-server";
import { ROLES } from "@/lib/roles";

export default async function Page() {
  await checkRole([ROLES.OWNER, ROLES.ADMIN]);

  const programs = await getProgramsWithDetails();

  return (
    <div className="ds-page">
      <ProgramList programs={programs} />
    </div>
  );
}
