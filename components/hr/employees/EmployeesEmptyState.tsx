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
    <div className="p-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
          <HiOutlineUserCircle className="size-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Aucun employé trouvé</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {searchQuery || hasActiveFilters
              ? "Aucun résultat pour ces critères"
              : "Commencez par ajouter votre premier employé"}
          </p>
        </div>
        {!(searchQuery || hasActiveFilters) && (
          <Can permission={COMMON_PERMISSIONS.HR.CREATE_EMPLOYEES}>
            <Button asChild size="sm" className="h-7 px-2">
              <Link href={`/apps/${slug}/hr/employees/create`}>
                <HiOutlinePlusCircle className="size-3 mr-1" />
                Ajouter un employé
              </Link>
            </Button>
          </Can>
        )}
      </div>
    </div>
  );
}
