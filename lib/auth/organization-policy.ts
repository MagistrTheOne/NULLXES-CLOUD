export const ORGANIZATION_ROLES = [
  "owner",
  "admin",
  "operator",
  "member",
  "billing_viewer",
] as const;

export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];

export const ORGANIZATION_PERMISSIONS = [
  "organization:manage",
  "ownership:transfer",
  "members:read",
  "members:manage",
  "instances:read",
  "instances:create",
  "instances:operate",
  "billing:read",
  "billing:manage",
  "audit:read",
] as const;

export type OrganizationPermission =
  (typeof ORGANIZATION_PERMISSIONS)[number];

const permissionsByRole = {
  owner: ORGANIZATION_PERMISSIONS,
  admin: [
    "organization:manage",
    "members:read",
    "members:manage",
    "instances:read",
    "instances:create",
    "instances:operate",
    "billing:read",
    "audit:read",
  ],
  operator: [
    "instances:read",
    "instances:create",
    "instances:operate",
  ],
  member: ["instances:read"],
  billing_viewer: ["billing:read"],
} as const satisfies Record<OrganizationRole, readonly OrganizationPermission[]>;

/** Unknown roles and permissions deny by default. */
export function hasOrganizationPermission(
  role: OrganizationRole | string | null | undefined,
  permission: OrganizationPermission | string,
): boolean {
  if (!role || !Object.hasOwn(permissionsByRole, role)) return false;
  return (permissionsByRole[role as OrganizationRole] as readonly string[])
    .includes(permission);
}

export function canAccessOrganizationResource(
  membershipOrganizationId: string | null | undefined,
  resourceOrganizationId: string,
  role: OrganizationRole | string | null | undefined,
  permission: OrganizationPermission | string,
): boolean {
  return (
    membershipOrganizationId === resourceOrganizationId &&
    hasOrganizationPermission(role, permission)
  );
}
