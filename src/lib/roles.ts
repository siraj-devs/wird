export enum ROLES {
  NEWCOMER = "newcomer",
  GUEST = "guest",
  MEMBER = "member",
  ADMIN = "admin",
  OWNER = "owner",
  EXPELLED = "expelled",
}

export const getRoleLabel = (role: string) => {
  const roleLabels: Record<ROLES, string> = {
    [ROLES.NEWCOMER]: "وافد",
    [ROLES.GUEST]: "ضيف",
    [ROLES.MEMBER]: "عضو",
    [ROLES.ADMIN]: "مشرف",
    [ROLES.OWNER]: "مالك",
    [ROLES.EXPELLED]: "مطرود",
  };
  return roleLabels[role as ROLES] ?? role;
};
