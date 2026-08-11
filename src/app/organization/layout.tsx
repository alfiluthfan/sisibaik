import type { ReactNode } from "react";

import { requireRole } from "@/lib/auth/guards";

interface OrganizationLayoutProps {
  children: ReactNode;
}

export default async function OrganizationLayout({
  children,
}: OrganizationLayoutProps) {
  await requireRole(
    "organization"
  );

  return children;
}