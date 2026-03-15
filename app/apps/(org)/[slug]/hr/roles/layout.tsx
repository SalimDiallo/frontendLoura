"use client";
import { Can } from "@/components/apps/common";
import { COMMON_MODULES } from "@/lib/types/permissions";
import { ReactNode } from "react";

export default function Layout({
  children,
}: {
  children: ReactNode;
}) {
    return <Can 
    requiredModule={COMMON_MODULES.HR.PERMISSIONS_MODULE}
    showMessage>
        {children}
    </Can>
}