import {
  getCategories,
  getProgramWithDetails,
  getTasks,
  getUsers,
} from "@/actions";
import ManageProgramDetail from "@/components/manage-program-detail";
import { checkRole } from "@/lib/auth-server";
import { ROLES } from "@/lib/roles";
import { notFound } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await checkRole([ROLES.OWNER, ROLES.ADMIN]);
  const { id } = await params;

  const [programDetails, tasks, categories, users] = await Promise.all([
    getProgramWithDetails(id),
    getTasks(),
    getCategories(),
    getUsers(),
  ]);

  if (!programDetails) notFound();

  return (
    <div className="ds-page">
      <ManageProgramDetail
        programDetails={programDetails}
        tasks={tasks}
        categories={categories}
        users={users}
      />
    </div>
  );
}
