import {
  requireRole,
} from "@/lib/auth/guards";


export async function requireAdmin() {

  return await requireRole(
    "admin"
  );

}