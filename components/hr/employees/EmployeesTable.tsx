"use client";

import {  useRouter } from "next/navigation";
import Link from "next/link";
import {
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineUserCircle,
  HiOutlineEnvelope,
  HiOutlineIdentification,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from "react-icons/hi2";
import {  Badge, Button, Card, Input } from "@/components/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Can } from "@/components/apps/common";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { cn, formatCurrency } from "@/lib/utils";
import type { EmployeeListItem } from "@/lib/types/hr";



export function EmployeesTable({
  employees,
  selectedIndex,
  setSelectedIndex,
  routerNav,
  slug,
  currentUserId,
  handleToggleStatus,
  handleDelete,
  deleting,
}: {
  employees: EmployeeListItem[];
  selectedIndex: number;
  setSelectedIndex: (i: number) => void;
  routerNav: ReturnType<typeof useRouter>;
  slug: string;
  currentUserId: string | undefined;
  handleToggleStatus: (id: string, is_active: boolean) => void;
  handleDelete: (id: string) => void;
  deleting: string | null;
}) {
  if (employees.length === 0) return null;
  return (
    <Table>
      <TableHeader>
        <TableRow className="h-8">
          <TableHead className="text-xs py-1">Employé</TableHead>
          <TableHead className="hidden md:table-cell text-xs py-1">Matricule</TableHead>
          <TableHead className="hidden lg:table-cell text-xs py-1">Département</TableHead>
          <TableHead className="hidden lg:table-cell text-xs py-1">Poste</TableHead>
          <TableHead className="hidden xl:table-cell text-xs py-1">Paiement</TableHead>
          <TableHead className="text-xs py-1">Statut</TableHead>
          <TableHead className="text-right text-xs py-1">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((employee, index) => {
          const isCurrentUser = employee.id === currentUserId;
          return (
            <TableRow
              key={employee.id}
              className={cn(
                "transition-colors",
                !isCurrentUser && "cursor-pointer",
                selectedIndex === index && "bg-primary/10 ring-1 ring-primary",
                isCurrentUser && "bg-accent/50 border-l-2 border-l-primary",
                "h-10"
              )}
              onClick={() => !isCurrentUser && setSelectedIndex(index)}
              onDoubleClick={() =>
                !isCurrentUser &&
                routerNav.push(`/apps/${slug}/hr/employees/${employee.id}`)
              }
              tabIndex={isCurrentUser ? -1 : 0}
              role="row"
              aria-selected={selectedIndex === index}
            >
              <TableCell className="py-1 align-middle">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full font-semibold text-xs shrink-0",
                      isCurrentUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {employee.full_name
                      ? employee.full_name
                          .split(" ")
                          .filter((n) => n)
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()
                      : "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate flex items-center gap-1.5 text-sm">
                      {employee.full_name || "Sans nom"}
                      {isCurrentUser && (
                        <span className="text-[10px] font-normal text-primary bg-primary/10 px-1 py-0.5 rounded-full">
                          Vous
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                      <HiOutlineEnvelope className="size-2.5 shrink-0" />
                      <span className="truncate">{employee.email}</span>
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell py-1">
                <div className="flex items-center gap-1 text-xs">
                  <HiOutlineIdentification className="size-3 text-muted-foreground" />
                  {employee.employee_id || "-"}
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell py-1">
                <span className="text-xs">{employee.department_name || "-"}</span>
              </TableCell>
              <TableCell className="hidden lg:table-cell py-1">
                <span className="text-xs text-muted-foreground">
                  {employee.position_title || "-"}
                </span>
              </TableCell>
              <TableCell className="hidden xl:table-cell py-1">
                {employee.base_salary ? (
                  <div className="text-xs">
                    <div className="font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(employee.base_salary)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {employee.salary_period_display || employee.salary_period}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="py-1">
                <Badge variant={employee.is_active ? "success" : "error"}>
                  {employee.is_active ? "Actif" : "Inactif"}
                </Badge>
              </TableCell>
              <TableCell className="text-right py-1">
                <TooltipProvider delayDuration={300}>
                  <div className="flex items-center justify-end gap-0.5">
                    {isCurrentUser ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-7"
                            asChild
                          >
                            <Link href={`/apps/${slug}/dashboard/profile`}>
                              <HiOutlineUserCircle className="size-3 text-primary" />
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Mon profil</TooltipContent>
                      </Tooltip>
                    ) : (
                      <>
                        <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="size-7"
                                asChild
                              >
                                <Link
                                  href={`/apps/${slug}/hr/employees/${employee.id}`}
                                >
                                  <HiOutlineEye className="size-3" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Voir le profil</TooltipContent>
                          </Tooltip>
                        </Can>
                        <Can permission={COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="size-7"
                                asChild
                              >
                                <Link
                                  href={`/apps/${slug}/hr/employees/${employee.id}/edit`}
                                >
                                  <HiOutlinePencil className="size-3" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Modifier</TooltipContent>
                          </Tooltip>
                        </Can>
                        <Can permission={COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="size-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStatus(employee.id, employee.is_active);
                                }}
                              >
                                {employee.is_active ? (
                                  <HiOutlineXCircle className="size-3 text-orange-500" />
                                ) : (
                                  <HiOutlineCheckCircle className="size-3 text-green-500" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {employee.is_active ? "Désactiver" : "Activer"}
                            </TooltipContent>
                          </Tooltip>
                        </Can>
                        <Can permission={COMMON_PERMISSIONS.HR.DELETE_EMPLOYEES}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="size-7 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(employee.id);
                                }}
                                disabled={deleting === employee.id}
                              >
                                <HiOutlineTrash className="size-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Supprimer</TooltipContent>
                          </Tooltip>
                        </Can>
                      </>
                    )}
                  </div>
                </TooltipProvider>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
