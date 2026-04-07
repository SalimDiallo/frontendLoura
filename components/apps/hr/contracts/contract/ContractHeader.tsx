"use client";

import { Can } from "@/components/apps/common";
import { Badge, Button } from "@/components/ui";
import type { Contract } from "@/lib/types/hr";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import Link from "next/link";
import {
    HiOutlineArrowLeft,
    HiOutlineCheckCircle,
    HiOutlinePencil,
    HiOutlineXCircle
} from "react-icons/hi2";

export function ContractHeader({ contract, contractTypeInfo, isExpired, slug, id, toggling, handleToggleActive }: {
  contract: Contract,
  contractTypeInfo: { label: string, description: string, color: string } | null,
  isExpired: boolean,
  slug: string,
  id: string,
  toggling: boolean,
  handleToggleActive: () => void
}) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" asChild className="mt-1">
          <Link href={`/apps/${slug}/hr/contracts`}>
            <HiOutlineArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge className={`text-sm px-3 py-1 ${contractTypeInfo?.color || ''}`}>
              {contractTypeInfo?.label || contract.contract_type}
            </Badge>
            {contract.is_active ? (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <HiOutlineCheckCircle className="size-3 mr-1" />
                Actif
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-800">
                <HiOutlineXCircle className="size-3 mr-1" />
                Inactif
              </Badge>
            )}
            {isExpired && (
              <Badge className="bg-red-100 text-red-800 border-red-200">
                Expiré
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Contrat de {contract.employee_name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {contractTypeInfo?.description} • Créé le {new Date(contract.created_at).toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Can permission={COMMON_PERMISSIONS.HR.UPDATE_CONTRACTS}>
          <Button 
            variant="outline" 
            onClick={handleToggleActive}
            disabled={toggling}
            className={contract.is_active ? "text-amber-600 border-amber-300" : "text-green-600 border-green-300"}
          >
            {toggling ? (
              <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            ) : contract.is_active ? (
              <HiOutlineXCircle className="size-4 mr-2" />
            ) : (
              <HiOutlineCheckCircle className="size-4 mr-2" />
            )}
            {contract.is_active ? "Désactiver" : "Activer"}
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/apps/${slug}/hr/contracts/${id}/edit`}>
              <HiOutlinePencil className="size-4 mr-2" />
              Modifier
            </Link>
          </Button>
        </Can>
      </div>
    </div>
  );
}
