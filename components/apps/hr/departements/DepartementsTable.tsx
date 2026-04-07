
import { useState } from "react";
import { Can } from "@/components/apps/common";
import { Badge, Button } from "@/components/ui";
import {
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib";
import { Department } from "@/lib/types";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";
import { HiOutlineEye, HiOutlinePencilSquare, HiOutlineTrash } from "react-icons/hi2";

import { DeleteConfirmation } from "@/components/common/confirmation-dialog";

// Typage pour DepartmentsTable
type DepartmentsTableProps = {
  departments: Department[];
  selectedIndex: number;
  setSelectedIndex: Dispatch<SetStateAction<number>>;
  router: ReturnType<typeof useRouter>;
  slug: string;
  handleDeleteDepartment: (id: string) => void;
  deleting: string | null;
};

// Composant DépartementsTable
export function DepartmentsTable({
  departments,
  selectedIndex,
  setSelectedIndex,
  router,
  slug,
  handleDeleteDepartment,
  deleting,
}: DepartmentsTableProps) {
  const [deleteDialogOpenId, setDeleteDialogOpenId] = useState<string | null>(null);

  const departmentBeingDeleted = departments.find((d) => d.id === deleteDialogOpenId);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-base p-4">Nom</TableHead>
            <TableHead className="text-base p-4">Code</TableHead>
            <TableHead className="text-base p-4">Description</TableHead>
            <TableHead className="text-base p-4">Statut</TableHead>
            <TableHead className="text-base p-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments?.map((department, index) => (
            <TableRow
              key={department.id}
              className={cn(
                "cursor-pointer transition-colors text-lg",
                selectedIndex === index && "bg-primary/10 ring-2 ring-primary"
              )}
              style={{ minHeight: "52px" }}
              onClick={() => setSelectedIndex(index)}
              onDoubleClick={() =>
                router.push(`/apps/${slug}/hr/departments/${department.id}`)
              }
              tabIndex={0}
              role="row"
              aria-selected={selectedIndex === index}
            >
              <TableCell className="font-medium text-base p-4">{department.name}</TableCell>
              <TableCell className="p-4">
                <code className="text-sm bg-muted px-3 py-1 rounded">{department.code}</code>
              </TableCell>
              <TableCell className="p-4">
                <span className="text-base text-muted-foreground">
                  {department.description || "-"}
                </span>
              </TableCell>
              <TableCell className="p-4">
                <Badge
                  variant={department.is_active ? "success" : "outline"}
                  className="text-sm px-3 py-1"
                >
                  {department.is_active ? "Actif" : "Inactif"}
                </Badge>
              </TableCell>
              <TableCell className="text-right p-4">
                <TooltipProvider delayDuration={300}>
                  <div className="flex items-center justify-end gap-2">
                    <Can permission={COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="default" className="size-9" asChild>
                            <Link href={`/apps/${slug}/hr/departments/${department.id}`}>
                              <HiOutlineEye className="size-5" />
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-base p-2 px-3">
                          Voir les détails
                        </TooltipContent>
                      </Tooltip>
                    </Can>
                    <Can permission={COMMON_PERMISSIONS.HR.UPDATE_DEPARTMENTS}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="default" className="size-9" asChild>
                            <Link href={`/apps/${slug}/hr/departments/${department.id}/edit`}>
                              <HiOutlinePencilSquare className="size-5" />
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-base p-2 px-3">
                          Modifier
                        </TooltipContent>
                      </Tooltip>
                    </Can>
                    <Can permission={COMMON_PERMISSIONS.HR.DELETE_DEPARTMENTS}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="default"
                            className="size-9 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteDialogOpenId(department.id);
                            }}
                            disabled={deleting === department.id}
                          >
                            <HiOutlineTrash className="size-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-base p-2 px-3">
                          Supprimer
                        </TooltipContent>
                      </Tooltip>
                    </Can>
                  </div>
                </TooltipProvider>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Delete confirmation dialog */}
      <DeleteConfirmation
        open={!!deleteDialogOpenId}
        onOpenChange={(open) =>
          setDeleteDialogOpenId(open ? deleteDialogOpenId : null)
        }
        itemName={departmentBeingDeleted?.name}
        onConfirm={() => {
          if (deleteDialogOpenId) {
            handleDeleteDepartment(deleteDialogOpenId);
          }
        }}
        loading={deleting === deleteDialogOpenId}
      />
    </>
  );
}
