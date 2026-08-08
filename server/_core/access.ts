import type { AuthenticatedUser } from "./types/authUser";

function normalizeRole(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}


const adminLikeRoles = [
  "admin",
  "super_admin",
  "superadmin",
  "super_user",
  "superuser",
  "platform_admin",
  "platformadmin",
  "owner",
  "administrator",
];

export function hasAdminToolsAccess(user?: AuthenticatedUser | null) {
  if (!user) return false;
  const role = normalizeRole(user.role);
  const source = normalizeRole(user.source);
  const platformRole = normalizeRole(user.platformRole);

  if (adminLikeRoles.includes(role)) return true;
  if (adminLikeRoles.includes(platformRole)) return true;

  // A platform identity is not, by itself, an administrative grant.
  // Managers/employees/viewers must be routed through future scoped internal surfaces,
  // not the sovereign /admin console or its server procedures.
  if (source === "platform_admin_users" && (adminLikeRoles.includes(platformRole) || adminLikeRoles.includes(role))) {
    return true;
  }

  if (source === "local_users" && adminLikeRoles.includes(role)) {
    return true;
  }

  return false;
}
