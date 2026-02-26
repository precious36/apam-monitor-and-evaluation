export const ADMIN_ROLE_NAME = 'Admin'

export const PERMISSIONS = {
  DASHBOARD_READ: 'dashboard.read',

  MEMBERS_READ: 'members.read',
  MEMBERS_CREATE: 'members.create',
  MEMBERS_UPDATE: 'members.update',
  MEMBERS_DELETE: 'members.delete',

  PROGRAMS_READ: 'programs.read',
  PROGRAMS_CREATE: 'programs.create',
  PROGRAMS_UPDATE: 'programs.update',
  PROGRAMS_DELETE: 'programs.delete',

  CASES_READ: 'cases.read',
  CASES_CREATE: 'cases.create',
  CASES_UPDATE: 'cases.update',
  CASES_DELETE: 'cases.delete',

  REPORTS_READ: 'reports.read',

  USERS_READ: 'users.read',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',

  ROLES_READ: 'roles.read',
  ROLES_CREATE: 'roles.create',
  ROLES_DELETE: 'roles.delete',
  ROLES_MANAGE_PERMISSIONS: 'roles.manage_permissions',
}

export const PAGE_ACCESS = {
  Dashboard: [PERMISSIONS.DASHBOARD_READ],
  Members: [PERMISSIONS.MEMBERS_READ],
  Programs: [PERMISSIONS.PROGRAMS_READ],
  Cases: [PERMISSIONS.CASES_READ],
  Reports: [PERMISSIONS.REPORTS_READ],
  'Users & Settings': [PERMISSIONS.USERS_READ, PERMISSIONS.ROLES_READ],
}

function normalizeArray(values) {
  if (!Array.isArray(values)) {
    return []
  }

  return values
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
}

export function getSessionUser(sessionOrUser) {
  if (!sessionOrUser) {
    return null
  }

  return sessionOrUser.user ?? sessionOrUser
}

export function hasRole(sessionOrUser, roleName) {
  const user = getSessionUser(sessionOrUser)
  if (!user || !roleName) {
    return false
  }

  const target = String(roleName).trim().toLowerCase()
  return normalizeArray(user.roles).some((role) => role.toLowerCase() === target)
}

export function isAdmin(sessionOrUser) {
  return hasRole(sessionOrUser, ADMIN_ROLE_NAME)
}

export function hasPermission(sessionOrUser, permissionKey) {
  const user = getSessionUser(sessionOrUser)
  if (!user || !permissionKey) {
    return false
  }

  if (isAdmin(user)) {
    return true
  }

  const target = String(permissionKey).trim().toLowerCase()
  return normalizeArray(user.permissions).some((permission) => permission.toLowerCase() === target)
}

export function hasAnyPermission(sessionOrUser, permissionKeys = []) {
  if (isAdmin(sessionOrUser)) {
    return true
  }

  return permissionKeys.some((permissionKey) => hasPermission(sessionOrUser, permissionKey))
}

export function canAccessPage(sessionOrUser, pageName) {
  const requiredPermissions = PAGE_ACCESS[pageName] ?? []
  if (requiredPermissions.length === 0) {
    return true
  }

  return hasAnyPermission(sessionOrUser, requiredPermissions)
}

export function getFirstAccessiblePage(items, sessionOrUser) {
  return items.find((item) => canAccessPage(sessionOrUser, item)) ?? null
}

export function filterAccessiblePages(items, sessionOrUser) {
  return items.filter((item) => canAccessPage(sessionOrUser, item))
}
