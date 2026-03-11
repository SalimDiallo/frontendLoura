"use client";

import { Can } from "@/components/apps/common";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import type { PropsWithChildren } from "react";

/**
 * Layout component for Inventory Documents.
 * Restricts access to users with MANAGE_DOCUMENTS permissions.
 */
export default function DocLayout({ children }: PropsWithChildren) {
  return (
    <Can permission={COMMON_PERMISSIONS.INVENTORY.MANAGE_DOCUMENTS} showMessage>
      {children}
    </Can>
  );
}