"use client";

import { Can } from "@/components/apps/common";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import type { PropsWithChildren, ReactNode } from "react";

/**
 * Layout component for Inventory Documents.
 * Restricts access to users with MANAGE_DOCUMENTS permissions.
 */
export default function DocLayout({ children }: PropsWithChildren<ReactNode>) {
  return (
    <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_SALES} showMessage>
      {children}
    </Can>
  );
}