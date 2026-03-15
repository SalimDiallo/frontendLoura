import { Can } from "@/components/apps/common";
import { COMMON_MODULES } from "@/lib/types/permissions";
import { ReactNode } from "react";

export default function Layout({
  children,
}: {
  children: ReactNode;
}) {
    return <Can 
    requiredModule={COMMON_MODULES.INVENTORY.REPORTS_MODULE}
    showMessage>
        {children}
    </Can>
}