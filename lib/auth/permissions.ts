import type { SessionUser } from "./session";

type Role =
  | "admin"
  | "team_leader"
  | "supervisor"
  | "assistant"
  | "permanent_worker"
  | "adhoc_worker";

/**
 * Check if user has a specific role.
 */
export function hasRole(user: SessionUser, role: Role | Role[]): boolean {
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(user.role.name as Role);
}

/**
 * Check if the user is an admin.
 */
export function isAdmin(user: SessionUser): boolean {
  return hasRole(user, "admin");
}

/**
 * Check if the user can access a specific warehouse.
 * Admins can access all. Others only their own.
 */
export function canAccessWarehouse(
  user: SessionUser,
  warehouseId: string
): boolean {
  if (isAdmin(user)) return true;
  return user.warehouseId === warehouseId;
}

/**
 * Check if the user can access a specific cluster.
 * Admins can access all. Team leaders and supervisors can access
 * clusters in their warehouse. Assistants only their own cluster.
 */
export function canAccessCluster(
  user: SessionUser,
  clusterId: string,
  warehouseId?: string
): boolean {
  if (isAdmin(user)) return true;

  if (hasRole(user, ["team_leader", "supervisor"])) {
    // They can see all clusters in their warehouse
    if (warehouseId) return user.warehouseId === warehouseId;
    return true; // Will be filtered by warehouse
  }

  if (hasRole(user, "assistant")) {
    return user.clusterId === clusterId;
  }

  return false;
}

/**
 * Check if user can manage tasks (create/update).
 */
export function canManageTasks(user: SessionUser): boolean {
  return hasRole(user, ["admin", "team_leader", "supervisor"]);
}

/**
 * Check if user can allocate workers.
 */
export function canAllocateWorkers(user: SessionUser): boolean {
  return hasRole(user, ["admin", "supervisor"]);
}

/**
 * Check if user can borrow workers from other clusters.
 */
export function canBorrowWorkers(user: SessionUser): boolean {
  return hasRole(user, ["admin", "supervisor"]);
}

/**
 * Check if user can hire ad-hoc workers.
 */
export function canHireAdhoc(user: SessionUser): boolean {
  return hasRole(user, ["admin", "supervisor"]);
}

/**
 * Check if user can view audit logs.
 */
export function canViewAuditLogs(user: SessionUser): boolean {
  return hasRole(user, "admin");
}

/**
 * Check if user can view reports.
 */
export function canViewReports(user: SessionUser): boolean {
  return hasRole(user, ["admin", "team_leader", "supervisor"]);
}

/**
 * Require a specific role or throw a redirect to appropriate page.
 */
export function requireRole(user: SessionUser, roles: Role | Role[]): void {
  if (!hasRole(user, roles)) {
    // Redirect to user's appropriate dashboard
    const dashboardMap: Record<string, string> = {
      admin: "/admin",
      team_leader: "/team-leader",
      supervisor: "/supervisor",
      assistant: "/assistant",
      permanent_worker: "/worker",
      adhoc_worker: "/worker",
    };
    throw new Error(`UNAUTHORIZED:${dashboardMap[user.role.name] || "/"}`);
  }
}
