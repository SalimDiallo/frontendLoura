"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getEmployee, updateEmployee } from "@/lib/services/hr/employee.service";
import { getRoles } from "@/lib/services/hr/role.service";
import type { Employee, Role } from "@/lib/types/hr";
import { AVAILABLE_PERMISSIONS } from "@/lib/constants/hr";
import { PermissionSelector } from "@/components/apps/hr/permission-selector";
import { HiOutlineCheckCircle, HiOutlineShieldCheck, HiOutlineArrowLeft } from "react-icons/hi2";
import { Alert, Button, Card, Badge } from "@/components/ui";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

export default function EmployeeRolesPermissionsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoadingData(true);
      const [employeeData, rolesData] = await Promise.all([
        getEmployee(id),
        getRoles({ is_active: true, organization_subdomain: slug }),
      ]);

      setEmployee(employeeData);
      setRoles(rolesData);
      
      setSelectedRole(employeeData.role?.id || "");
      setSelectedPermissions(employeeData.custom_permissions?.map(p => p.code) || []);
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err);
      setError("Erreur lors du chargement des données");
    } finally {
      setLoadingData(false);
    }
  }, [id, slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get selected role object
  const selectedRoleObj = useMemo(() => 
    roles.find(r => r.id === selectedRole),
    [roles, selectedRole]
  );

  // Get role permission codes
  const rolePermissionCodes = useMemo(() => 
    selectedRoleObj?.permissions?.map(p => p.code) || [],
    [selectedRoleObj]
  );

  // Stats
  const stats = useMemo(() => {
    const totalPermissions = AVAILABLE_PERMISSIONS.length;
    const fromRole = rolePermissionCodes.length;
    const custom = selectedPermissions.length;
    const total = new Set([...rolePermissionCodes, ...selectedPermissions]).size;
    return { totalPermissions, fromRole, custom, total };
  }, [rolePermissionCodes, selectedPermissions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {};

      if (selectedRole) {
        updateData.role_id = selectedRole;
      }

      updateData.custom_permission_codes = selectedPermissions;

      await updateEmployee(id, updateData);
      setSuccess("Permissions mises à jour avec succès");
      setTimeout(() => {
        router.push(`/apps/${slug}/hr/employees/${id}`);
      }, 1500);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-6">
        <Alert variant="error">Employé non trouvé</Alert>
        <Button asChild>
          <Link href={`/apps/${slug}/hr/employees`}>Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Rôles & Permissions"
        subtitle={`Gérer les accès de ${employee.first_name} ${employee.last_name}`}
        icon={HiOutlineShieldCheck}
        backLink={`/apps/${slug}/hr/employees/${id}`}
      />

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sélection du Rôle */}
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <HiOutlineShieldCheck className="size-5 text-primary" />
                Rôle Principal
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Le rôle définit les permissions de base de l&apos;employé
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Option sans rôle */}
            <button
              type="button"
              onClick={() => setSelectedRole("")}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all",
                selectedRole === ""
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "size-10 rounded-full flex items-center justify-center",
                  selectedRole === "" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                )}>
                  <HiOutlineShieldCheck className="size-5" />
                </div>
                <div>
                  <p className="font-medium">Sans rôle</p>
                  <p className="text-xs text-muted-foreground">Permissions personnalisées uniquement</p>
                </div>
              </div>
            </button>

            {/* Rôles disponibles */}
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRole(role.id)}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all",
                  selectedRole === role.id
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "size-10 rounded-full flex items-center justify-center",
                    selectedRole === role.id ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                  )}>
                    <HiOutlineShieldCheck className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{role.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {role.permissions?.length || 0} permissions
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Afficher les permissions du rôle sélectionné */}
          {selectedRoleObj && (
            <div className="mt-4 p-4 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                Permissions du rôle &quot;{selectedRoleObj.name}&quot;
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {rolePermissionCodes.slice(0, 8).map((code) => {
                  const perm = AVAILABLE_PERMISSIONS.find(p => p.code === code);
                  return (
                    <Badge key={code} variant="outline" className="text-xs bg-white dark:bg-background">
                      {perm?.label || code}
                    </Badge>
                  );
                })}
                {rolePermissionCodes.length > 8 && (
                  <Badge variant="secondary" className="text-xs">
                    +{rolePermissionCodes.length - 8} autres
                  </Badge>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Permissions Personnalisées */}
        <Card className="p-6 border-0 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Permissions Personnalisées
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({stats.custom} custom, {stats.total} total)
              </span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Ajoutez des permissions supplémentaires en plus de celles du rôle
            </p>
          </div>

          <PermissionSelector
            permissions={AVAILABLE_PERMISSIONS}
            selectedPermissions={selectedPermissions}
            onSelectionChange={setSelectedPermissions}
            rolePermissionCodes={rolePermissionCodes}
            maxHeight="400px"
          />
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" asChild>
            <Link href={`/apps/${slug}/hr/employees/${id}`}>
              <HiOutlineArrowLeft className="size-4 mr-2" />
              Annuler
            </Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>Enregistrement...</>
            ) : (
              <>
                <HiOutlineCheckCircle className="size-4 mr-2" />
                Enregistrer les permissions
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
