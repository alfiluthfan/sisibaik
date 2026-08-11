import type { ReactNode } from "react";

import { requireRole } from "@/lib/auth/guards";

export default async function MerchantLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole("merchant");

  return children;
}
