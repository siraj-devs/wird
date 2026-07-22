import { getProgramsWithDetails } from "@/actions";
import ProgramList from "@/components/program-list";
import { checkRole } from "@/lib/auth-server";
import { ROLES } from "@/lib/roles";

export default async function Page() {
  await checkRole([ROLES.OWNER, ROLES.ADMIN]);

  const programs = await getProgramsWithDetails();

  return (
    <div className="ds-page">
      <div className="mb-6">
        <h1 className="ds-title">البرامج</h1>
        <p className="ds-subtitle">
          إدارة البرامج: الأعضاء، الأصدقاء، الفئات، والمهام (متكررة أو بفترة
          زمنية).
        </p>
      </div>

      <ProgramList programs={programs} />
    </div>
  );
}
