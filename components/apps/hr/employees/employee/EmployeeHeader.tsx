"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  Button,
  Alert,
  Badge
} from "@/components/ui";
import type { Employee, Contract, Payroll } from "@/lib/types/hr";
import {
  HiOutlineArrowLeft,
  HiOutlinePencil,
  HiOutlineTrash,

  HiOutlineCog,
} from "react-icons/hi2";
import { Can } from "@/components/apps/common";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";


export function EmployeeHeader({
  employee,
  slug,
  id,
  handleToggleStatus,
  toggling,
  handleDelete,
  deleting
}: {
  employee: Employee;
  slug: string;
  id: string;
  handleToggleStatus: () => void;
  toggling: boolean;
  handleDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/apps/${slug}/hr/employees`}>
              <HiOutlineArrowLeft className="size-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            Profil Employé
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1 ml-10">
          Détails et informations de l'employé
        </p>
      </div>
      <div className="flex gap-2">
        <Can permission={COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES}>
          <Button
            onClick={handleToggleStatus}
            variant="outline"
            size="sm"
            disabled={toggling}
          >
            <HiOutlineCog className="size-4 mr-2" />
            {toggling ? 'Chargement...' : employee.is_active ? 'Désactiver' : 'Activer'}
          </Button>
        </Can>

        <Can permission={COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES}>
          <Button variant="outline" asChild>
            <Link href={`/apps/${slug}/hr/employees/${id}/edit`}>
              <HiOutlinePencil className="size-4 mr-2" />
              Modifier
            </Link>
          </Button>
        </Can>

        <Can permission={COMMON_PERMISSIONS.HR.DELETE_EMPLOYEES}>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            <HiOutlineTrash className="size-4 mr-2" />
            {deleting ? "Suppression..." : "Supprimer"}
          </Button>
        </Can>
      </div>
    </div>
  );
}
