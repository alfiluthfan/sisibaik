import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import { getDashboardPath } from "@/lib/auth/redirects";

export default async function DashboardPage() {
  const profile =
    await requireAuth();

  const destination =
    getDashboardPath(profile);

  redirect(destination);
}