export type AppRole = "admin" | "coach" | "parent";

export const APP_ROLES: AppRole[] = ["admin", "coach", "parent"];

export function roleHome(role: AppRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "coach":
      return "/coach";
    case "parent":
      return "/parent";
  }
}
