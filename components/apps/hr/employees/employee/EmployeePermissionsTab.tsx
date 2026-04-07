"use client";

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
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";



export function EmployeePermissionsTab({
  employee,
  slug,
  id,
}: {
  employee: Employee;
  slug: string;
  id: string;
}) {
  return (
    <TabsContent value="permissions" className="space-y-4">
      {/* Header with Edit Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Rôles & Permissions</h3>
          <p className="text-sm text-muted-foreground">
            Gérez les accès et les autorisations de l'employé
          </p>
        </div>
        <Button variant="default" asChild>
          <Link href={`/apps/${slug}/hr/employees/${id}/roles-permissions`}>
            <HiOutlinePencil className="size-4 mr-2" />
            Modifier
          </Link>
        </Button>
      </div>

      {/* Role Card */}
      <Card className="p-6 border-0 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <HiOutlineShieldCheck className="size-5 text-primary" />
            <h4 className="text-base font-semibold">Rôle principal</h4>
          </div>
          {employee.role && (
            <Badge variant="info">
              {employee.role.permission_count || employee.role.permissions?.length || 0} permissions
            </Badge>
          )}
        </div>

        {employee.role ? (
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-base">{employee.role.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {employee.role.description || `Code: ${employee.role.code}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  {employee.role.is_system_role && (
                    <Badge variant="info" className="text-xs">
                      Système
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {/* Permissions grouped by category */}
            {employee.role.permissions && employee.role.permissions.length > 0 && (
              <div className="pt-2">
                <div className="text-sm font-medium text-muted-foreground mb-3">
                  Permissions incluses ({employee.role.permissions.length})
                </div>
                <div className="space-y-3">
                  {Object.entries(
                    employee.role.permissions.reduce((acc, perm) => {
                      if (!acc[perm.category]) acc[perm.category] = [];
                      acc[perm.category].push(perm);
                      return acc;
                    }, {} as Record<string, typeof employee.role.permissions>)
                  ).map(([category, perms]) => (
                    <div key={category} className="space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {category} ({perms.length})
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {perms.map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-center gap-2 text-sm px-3 py-2 bg-muted/50 rounded-md"
                          >
                            <div className="size-1.5 rounded-full bg-foreground flex-shrink-0"></div>
                            <span className="truncate">{permission.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <HiOutlineShieldCheck className="size-12 opacity-50" />
              <p>Aucun rôle attribué</p>
              <Button variant="outline" size="sm" asChild className="mt-2">
                <Link href={`/apps/${slug}/hr/employees/${id}/roles-permissions`}>
                  Attribuer un rôle
                </Link>
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Custom Permissions Card */}
      {employee.custom_permissions && employee.custom_permissions.length > 0 && (
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineShieldCheck className="size-5 text-amber-600" />
            <h4 className="text-base font-semibold">Permissions supplémentaires</h4>
            <Badge variant="warning">{employee.custom_permissions.length}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Permissions additionnelles en plus de celles du rôle
          </p>

          <div className="space-y-3">
            {Object.entries(
              employee.custom_permissions.reduce((acc, perm) => {
                if (!acc[perm.category]) acc[perm.category] = [];
                acc[perm.category].push(perm);
                return acc;
              }, {} as Record<string, typeof employee.custom_permissions>)
            ).map(([category, perms]) => (
              <div key={category} className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {category} ({perms.length})
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {perms.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center gap-2 text-sm px-3 py-2 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800"
                    >
                      <div className="size-1.5 rounded-full bg-amber-600 flex-shrink-0"></div>
                      <span className="truncate">{permission.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Summary Info */}
      <div className="p-4 bg-muted/50 rounded-lg border border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total des permissions actives</span>
          <span className="font-semibold">
            {employee.all_permissions?.length || 0} permissions
          </span>
        </div>
      </div>
    </TabsContent>
  );
}
