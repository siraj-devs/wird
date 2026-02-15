import crypto from "crypto";

export function generateState(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 10000,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

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
