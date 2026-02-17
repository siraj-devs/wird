export enum ROLES {
  GUEST = "guest",
  MEMBER = "member",
  ADMIN = "admin",
  OWNER = "owner",
}

export const getRoleLabel = (role: string) => {
  const roleLabels: Record<ROLES, string> = {
    [ROLES.GUEST]: "ضيف",
    [ROLES.MEMBER]: "عضو",
    [ROLES.ADMIN]: "مشرف",
    [ROLES.OWNER]: "مالك",
  };
  return roleLabels[role as ROLES] ?? role;
};
