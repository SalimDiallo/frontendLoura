"use client";

import { Can } from "@/components/apps/common";
import { Badge, Button, Card } from "@/components/ui";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { Contract } from "@/lib/types/hr";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { cn, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
    HiOutlineArrowDownTray,
    HiOutlineCheckCircle,
    HiOutlineDocumentText,
    HiOutlineEllipsisVertical,
    HiOutlineEye,
    HiOutlinePencil,
    HiOutlinePlusCircle,
    HiOutlineTrash,
    HiOutlineXCircle,
} from "react-icons/hi2";

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  permanent: "CDI",
  temporary: "CDD",
  contract: "Contractuel",
  internship: "Stage",
  freelance: "Freelance",
};

const CONTRACT_TYPE_COLORS: Record<string, string> = {
  permanent: "bg-green-100 text-green-800 border-green-200",
  temporary: "bg-blue-100 text-blue-800 border-blue-200",
  contract: "bg-purple-100 text-purple-800 border-purple-200",
  internship: "bg-orange-100 text-orange-800 border-orange-200",
  freelance: "bg-pink-100 text-pink-800 border-pink-200",
};

const SALARY_PERIOD_LABELS: Record<string, string> = {
  hourly: "/h",
  daily: "/jour",
  monthly: "/mois",
  annual: "/an",
};

// Composant : Menu déroulant d'actions pour un contrat (sans confirmation dialog)
function ContractActionsDropdown({
  slug,
  contract,
  deleting,
  handlePreviewPDF,
  handleToggleActive,
  handleDelete,
}: {
  slug: string;
  contract: Contract;
  deleting: string | null;
  handlePreviewPDF: (contractId: string, employeeName: string) => void;
  handleToggleActive: (contract: Contract) => void;
  handleDelete: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={deleting === contract.id}>
          <HiOutlineEllipsisVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/apps/${slug}/hr/contracts/${contract.id}`}>
            <HiOutlineEye className="size-4 mr-2" />
            Voir le détail
          </Link>
        </DropdownMenuItem>
        <Can permission={COMMON_PERMISSIONS.HR.VIEW_CONTRACTS}>
          <DropdownMenuItem
            onClick={() =>
              handlePreviewPDF(contract.id, contract.employee_name || "contrat")
            }
          >
            <HiOutlineArrowDownTray className="size-4 mr-2" />
            Aperçu PDF
          </DropdownMenuItem>
        </Can>
        <Can permission={COMMON_PERMISSIONS.HR.UPDATE_CONTRACTS}>
          <DropdownMenuItem asChild>
            <Link href={`/apps/${slug}/hr/contracts/${contract.id}/edit`}>
              <HiOutlinePencil className="size-4 mr-2" />
              Modifier
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleToggleActive(contract)}>
            {contract.is_active ? (
              <>
                <HiOutlineXCircle className="size-4 mr-2" />
                Désactiver
              </>
            ) : (
              <>
                <HiOutlineCheckCircle className="size-4 mr-2" />
                Activer
              </>
            )}
          </DropdownMenuItem>
        </Can>
        <Can permission={COMMON_PERMISSIONS.HR.DELETE_CONTRACTS}>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => handleDelete(contract.id)}
          >
            <HiOutlineTrash className="size-4 mr-2" />
            Supprimer
          </DropdownMenuItem>
        </Can>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Composant : Ligne de contrat unique
function ContractRow({
  contract,
  index,
  selectedIndex,
  onSelect,
  onDoubleClick,
  slug,
  deleting,
  handlePreviewPDF,
  handleToggleActive,
  handleDelete,
}: {
  contract: Contract;
  index: number;
  selectedIndex: number;
  onSelect: (index: number) => void;
  onDoubleClick: (id: string) => void;
  slug: string;
  deleting: string | null;
  handlePreviewPDF: (contractId: string, employeeName: string) => void;
  handleToggleActive: (contract: Contract) => void;
  handleDelete: (id: string, name: string) => void;
}) {
  return (
    <TableRow
      key={contract.id}
      className={cn(
        "cursor-pointer transition-colors",
        selectedIndex === index && "bg-primary/10 ring-1 ring-primary"
      )}
      onClick={() => onSelect(index)}
      onDoubleClick={() => onDoubleClick(contract.id)}
      tabIndex={0}
      role="row"
      aria-selected={selectedIndex === index}
    >
      <TableCell>
        <div className="font-medium">
          {contract.employee_name || "Sans nom"}
        </div>
      </TableCell>
      <TableCell>
        <Badge className={CONTRACT_TYPE_COLORS[contract.contract_type] || ""}>
          {CONTRACT_TYPE_LABELS[contract.contract_type] || contract.contract_type}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div>
            {new Date(contract.start_date).toLocaleDateString("fr-FR")}
          </div>
          {contract.end_date && (
            <div className="text-muted-foreground">
              → {new Date(contract.end_date).toLocaleDateString("fr-FR")}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="font-medium">
          {formatCurrency(contract.base_salary)}
        </div>
        <div className="text-xs text-muted-foreground">
          {SALARY_PERIOD_LABELS[contract.salary_period || "monthly"]}
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm">{contract.hours_per_week || "-"}h</span>
      </TableCell>
      <TableCell>
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
      </TableCell>
      <TableCell className="text-right">
        <ContractActionsDropdown
          slug={slug}
          contract={contract}
          deleting={deleting}
          handlePreviewPDF={handlePreviewPDF}
          handleToggleActive={handleToggleActive}
          handleDelete={(id) => handleDelete(id, contract.employee_name || "")}
        />
      </TableCell>
    </TableRow>
  );
}

// Composant : Tableau des contrats (avec message "aucun contrat")
export function ContractsTable({
  contracts,
  filteredContracts,
  selectedIndex,
  setSelectedIndex,
  router,
  slug,
  deleting,
  handlePreviewPDF,
  handleToggleActive,
  handleDelete,
  searchQuery,
}: {
  contracts: Contract[];
  filteredContracts: Contract[];
  selectedIndex: number;
  setSelectedIndex: (idx: number) => void;
  router: any;
  slug: string;
  deleting: string | null;
  handlePreviewPDF: (contractId: string, employeeName: string) => void;
  handleToggleActive: (contract: Contract) => void;
  handleDelete: (id: string, name: string) => void;
  searchQuery: string;
}) {
  if (filteredContracts.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <div className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <HiOutlineDocumentText className="size-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Aucun contrat</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery
                  ? "Aucun résultat pour cette recherche"
                  : "Commencez par ajouter votre premier contrat"}
              </p>
            </div>
            {!searchQuery && (
              <Can permission={COMMON_PERMISSIONS.HR.CREATE_CONTRACTS}>
                <Button asChild>
                  <Link href={`/apps/${slug}/hr/contracts/create`}>
                    <HiOutlinePlusCircle className="size-4 mr-2" />
                    Ajouter un contrat
                  </Link>
                </Button>
              </Can>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employé</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Période</TableHead>
            <TableHead>Salaire de base</TableHead>
            <TableHead>Heures/sem</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredContracts.map((contract, index) => (
            <ContractRow
              key={contract.id}
              contract={contract}
              index={index}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
              onDoubleClick={() =>
                router.push(`/apps/${slug}/hr/contracts/${contract.id}`)
              }
              slug={slug}
              deleting={deleting}
              handlePreviewPDF={handlePreviewPDF}
              handleToggleActive={handleToggleActive}
              handleDelete={handleDelete}
            />
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
