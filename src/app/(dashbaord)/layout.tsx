import { getUser, getUsers } from "@/actions";
import UserDropdown from "@/components/user-dropdown";
import { getIdFromToken } from "@/lib/auth-server";
import { ROLES } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const id = await getIdFromToken();
  const user = await getUser(id);
  if (!user) redirect("/logout");

  const users = [ROLES.OWNER, ROLES.ADMIN].includes(user.role)
    ? await getUsers()
    : [];

  const usersForTracking = users.map((trackedUser) => ({
    id: trackedUser.id,
    username: trackedUser.username,
    full_name: trackedUser.full_name,
    avatar_url: trackedUser.avatar_url,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <svg
                viewBox="0 0 500 500"
                fill="none"
                className="mt-2 size-12"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M342.99 180.629C347.981 180.629 337.847 180.632 342.99 180.632C342.99 201.311 342.99 189.575 342.99 210.881C353.275 210.881 333.007 210.881 342.99 210.881C342.99 221.577 342.99 232.273 342.99 243.293C333.007 243.293 323.024 243.293 312.738 243.293C312.738 253.276 312.738 263.259 312.738 273.544C302.042 273.544 291.346 273.544 280.326 273.544C280.326 284.24 280.326 294.936 280.326 305.956C270.344 305.956 260.361 305.956 250.075 305.956C250.075 310.948 250.075 315.939 250.075 321.082C239.379 321.082 228.683 321.082 217.663 321.082C217.663 316.09 217.663 311.099 217.663 305.956C207.68 305.956 197.697 305.956 187.412 305.956C187.412 295.26 187.412 284.564 187.412 273.544C176.716 273.544 166.02 273.544 155 273.544C155 252.865 155 249.473 155 228.167C159.991 228.167 164.983 228.167 170.126 228.167C170.126 222.29 170.126 233.872 170.126 228.167C175.83 228.167 181.535 228.167 187.412 228.167C187.412 233.159 187.412 238.15 187.412 243.293C197.395 243.293 207.378 243.293 217.663 243.293C217.663 253.276 217.663 263.259 217.663 273.544C228.359 273.544 239.055 273.544 250.075 273.544C250.075 263.561 250.075 253.578 250.075 243.293C260.058 243.293 270.041 243.293 280.326 243.293C280.326 232.597 280.326 221.901 280.326 210.881C291.022 210.881 301.718 210.881 312.738 210.881C312.738 200.898 312.738 190.915 312.738 180.63C322.721 180.63 332.704 180.629 342.99 180.629C342.99 185.771 342.99 175.637 342.99 180.629C337.847 180.629 347.981 180.629 342.99 180.629C342.99 186.506 342.99 174.924 342.99 180.629Z"
                  fill="black"
                />
              </svg>
              <h1 className="font-handjet text-3xl font-medium">ورد</h1>
            </div>
            <UserDropdown user={user} users={usersForTracking} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
