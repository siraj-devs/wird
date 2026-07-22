import {
  getUserProgramsProgress,
  resolveProgramProgressRange,
} from "@/actions";
import ProgramProgressView from "@/components/program-progress-view";
import { checkRole } from "@/lib/auth-server";
import { ROLES } from "@/lib/roles";

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; from?: string }>;
}) {
  const user = await checkRole([ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER]);
  const { view, from } = await searchParams;

  const range = resolveProgramProgressRange({ view, from });
  const { sections, hasPrograms } = await getUserProgramsProgress(
    user.id,
    range,
  );

  return (
    <div className="flex w-full flex-1 flex-col p-4 md:p-6">
      <ProgramProgressView
        range={range}
        sections={sections}
        hasPrograms={hasPrograms}
      />
    </div>
  );
}
