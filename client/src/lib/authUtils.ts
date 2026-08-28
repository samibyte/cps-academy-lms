export type UserRole = "Admin" | "Instructor" | "Content Manager" | "Student";

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

export const getDefaultDashboardRoute = (role: UserRole) => {
  if (role === "Admin") {
    return "/dashboard/admin";
  }
  if (role === "Instructor") {
    return "/dashboard/instructor";
  }
  if (role === "Content Manager") {
    return "/dashboard/content-manager";
  }
  if (role === "Student") {
    return "/dashboard/student";
  }

  return "/";
};

export const isValidRedirectForRole = (
  redirectPath: string,
  role: UserRole,
) => {
  const sanitizedRedirectPath = redirectPath.split("?")[0] || redirectPath;
  const routeOwner = getRouteOwner(sanitizedRedirectPath);

  if (routeOwner === null) {
    return true;
  }

  if (routeOwner === role) {
    return true;
  }

  return false;
};
