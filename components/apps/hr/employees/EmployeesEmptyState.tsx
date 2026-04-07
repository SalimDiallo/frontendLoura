"use client";

import Link from "next/link";
import {
  HiOutlinePlusCircle,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import {  Badge, Button, Card, Input } from "@/components/ui";

import { Can } from "@/components/apps/common";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";


export function EmployeesEmptyState({
  hasActiveFilters,
  searchQuery,
  slug,
}: {
  hasActiveFilters: boolean;
  searchQuery: string;
  slug: string;
}) {
  return (
    <div className="p-12 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <HiOutlineUserCircle className="size-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-base font-semibold">Aucun employé trouvé</h3>
          <p className="text-sm text-muted-foreground mt-2">
            {searchQuery || hasActiveFilters
              ? "Aucun résultat pour ces critères"
              : "Commencez par ajouter votre premier employé"}
          </p>
        </div>
        {!(searchQuery || hasActiveFilters) && (
          <Can permission={COMMON_PERMISSIONS.HR.CREATE_EMPLOYEES}>
            <Button asChild size="sm" className="h-9 px-3">
              <Link href={`/apps/${slug}/hr/employees/create`}>
                <HiOutlinePlusCircle className="size-4 mr-1.5" />
                Ajouter un employé
              </Link>
            </Button>
          </Can>
        )}
      </div>
    </div>
  );
}
