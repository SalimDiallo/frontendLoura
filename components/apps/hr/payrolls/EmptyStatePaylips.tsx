"use client";

import { Can } from "@/components/apps/common";
import { buttonVariants } from "@/components/ui/button";
import type { PayrollPeriod } from "@/lib/types/hr";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import Link from "next/link";
import {
    HiOutlineDocumentText,
    HiOutlineSparkles,
    HiOutlineUserPlus
} from "react-icons/hi2";


// ─── Empty state shown when a tab has no matching payslips ───────────────────
export function EmptyStatePaylips({
  slug,
  globallyEmpty,
  currentPeriod,
  selectedPeriodId,
}: {
  slug: string;
  globallyEmpty: boolean;
  currentPeriod?: PayrollPeriod;
  selectedPeriodId: string;
}) {
  return (
    <div className="p-12 text-center">
      <HiOutlineDocumentText className="size-16 mx-auto mb-4 text-muted-foreground/30" />
      {globallyEmpty ? (
        <>
          <p className="text-lg font-medium mb-2">Commencez à gérer vos paies</p>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Créez une fiche de paie individuelle ou générez des fiches en masse pour tous vos employés.
          </p>
         <Can permission={COMMON_PERMISSIONS.HR.CREATE_PAYROLL}>
         <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={`/apps/${slug}/hr/payroll/create`}
            >
              <HiOutlineUserPlus className="size-4 mr-2" />
              Paie individuelle
            </Link>
            <Link
              className={buttonVariants()}
              href={`/apps/${slug}/hr/payroll/generate`}
            >
              <HiOutlineSparkles className="size-4 mr-2" />
              Générer en masse
            </Link>
          </div>
         </Can>
        </>
      ) : (
        <>
          <p className="text-lg font-medium mb-2">Aucune fiche trouvée</p>
          <p className="text-muted-foreground mb-4">
            {selectedPeriodId === "none"
              ? "Aucune fiche de paie ad-hoc (sans période)"
              : currentPeriod
                ? `Aucune fiche pour "${currentPeriod.name}"`
                : "Essayez de modifier vos filtres ou créez une nouvelle fiche"}
          </p>
         <Can permission={COMMON_PERMISSIONS.HR.CREATE_PAYROLL}>
            <Link
                className={buttonVariants({ variant: "outline" })}
                href={`/apps/${slug}/hr/payroll/create`}>
                <HiOutlineUserPlus className="size-4 mr-2" />
                Créer une fiche
             </Link>
         </Can>
        </>
      )}
    </div>
  );
}
