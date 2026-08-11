import type { Profile } from "@/types/auth";

export function getDashboardPath(profile: Profile) {
  if (profile.status === "suspended") {
    return "/account-suspended";
  }

  if (profile.status === "pending") {
    return "/pending-verification";
  }

  switch (profile.role) {
    case "customer":
      return "/customer/dashboard";

    case "merchant":
      return "/merchant";

    case "organization":
      return "/organization/dashboard";

    case "admin":
      return "/admin/dashboard";

    default:
      return "/auth/login";
  }
}
