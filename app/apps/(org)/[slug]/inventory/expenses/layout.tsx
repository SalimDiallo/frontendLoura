import { Can } from "@/components/apps/common";
import { COMMON_MODULES } from "@/lib/types/permissions";
import { PropsWithChildren, ReactNode } from "react";

export default function Layout({children}:PropsWithChildren<ReactNode>) {
    return <Can 
    requiredModule={COMMON_MODULES.INVENTORY.PRODUCTS_MODULE}
    showMessage>
        {children}
    </Can>
}