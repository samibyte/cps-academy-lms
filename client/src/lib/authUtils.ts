export type UserRole = "Admin" | "Instructor" | "Content Manager" | "Student";

const VALID_ROLES = new Set<UserRole>(["Admin", "Instructor", "Content Manager", "Student"]);

/** Returns the value typed as UserRole if it is a known role, otherwise null. */
export const parseRole = (role?: string | null): UserRole | null => {
  const trimmed = role?.trim();
  return VALID_ROLES.has(trimmed as UserRole) ? (trimmed as UserRole) : null;
};

/** @deprecated Use parseRole instead. */
export const normalizeRoleName = parseRole;

export const authRoutes = ["/auth/login", "/auth/register"];

export const isAuthRoute = (pathname: string) => {
  return authRoutes.some((router: string) => router === pathname);
};

export type RouteConfig = {
  exact: string[];
  pattern: RegExp[];
};

export const studentProtectedRoutes: RouteConfig = {
  pattern: [/^\/dashboard\/student/],
  exact: [],
};

export const instructorProtectedRoutes: RouteConfig = {
  pattern: [/^\/dashboard\/instructor/],
  exact: [],
};

export const contentManagerProtectedRoutes: RouteConfig = {
  pattern: [/^\/dashboard\/content-manager/],
  exact: [],
};

export const adminProtectedRoutes: RouteConfig = {
  pattern: [/^\/dashboard\/admin/],
  exact: [],
};

export const isRouteMatches = (pathname: string, routes: RouteConfig) => {
  if (routes.exact.includes(pathname)) {
    return true;
  }
  return routes.pattern.some((pattern: RegExp) => pattern.test(pathname));
};

export const getRouteOwner = (pathname: string): UserRole | null => {
  if (isRouteMatches(pathname, instructorProtectedRoutes)) {
    return "Instructor";
  }

  if (isRouteMatches(pathname, contentManagerProtectedRoutes)) {
    return "Content Manager";
  }

  if (isRouteMatches(pathname, adminProtectedRoutes)) {
    return "Admin";
  }

  if (isRouteMatches(pathname, studentProtectedRoutes)) {
    return "Student";
  }

  return null; // public route
};

export const getDefaultDashboardRoute = (role: UserRole | string): string => {
  switch (role as UserRole) {
    case "Admin":           return "/dashboard/admin";
    case "Instructor":      return "/dashboard/instructor";
    case "Content Manager": return "/dashboard/content-manager";
    case "Student":         return "/dashboard/student";
    default:                return "/";
  }
};

export const isValidRedirectForRole = (
  redirectPath: string,
  role: UserRole | string,
): boolean => {
  const sanitizedPath = redirectPath.split("?")[0] || redirectPath;
  const routeOwner = getRouteOwner(sanitizedPath);
  // Public route — always valid
  if (!routeOwner) return true;
  return routeOwner === role;
};
