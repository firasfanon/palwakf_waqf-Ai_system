export type AppRole = "admin" | "user";

export type AuthenticatedUser = {
  id: number;
  openId: string;
  authUserId?: string | null;
  platformUserId?: string | null;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: AppRole;
  platformRole?: string | null;
  unitId?: string | number | null;
  createdAt: string;
  updatedAt: string;
  lastSignedIn: string;
  isActive: number;
  source: "platform_admin_users" | "local_users";
};
