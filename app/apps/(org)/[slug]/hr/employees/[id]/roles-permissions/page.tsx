"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getEmployee, updateEmployee } from "@/lib/services/hr/employee.service";
import { getRoles } from "@/lib/services/hr/role.service";
import { getPermissions } from "@/lib/services/hr/permission.service";
import type { Employee, Role, Permission } from "@/lib/types/hr";
import {
  HiOutlineCheckCircle,
  HiOutlineShieldCheck,
  HiOutlineMagnifyingGlass,
  HiOutlineChevronDown,
  HiOutlineChevronRight,
} from "react-icons/hi2";
import { Shield, Check, X, Search, Lock, Unlock, ChevronDown, ChevronUp } from "lucide-react";
import { Alert, Button, Card, Badge, Input } from "@/components/ui";
import { PageHeader } from "@/components/hr/page-header";
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
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [employeeData, rolesData, permsData] = await Promise.all([
        getEmployee(id),
        getRoles({ is_active: true, organization_subdomain: slug }),
        getPermissions(),
      ]);

      setEmployee(employeeData);
      setRoles(rolesData);
      setPermissions(permsData);
      setSelectedRole(employeeData.role?.id || "");
      setSelectedPermissions(employeeData.custom_permissions?.map(p => p.id) || []);
      
      // Expand all categories by default
      const categories = [...new Set(permsData.map((p: Permission) => p.category))];
      setExpandedCategories(categories);
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err);
      setError("Erreur lors du chargement des données");
    } finally {
      setLoadingData(false);
    }
  };

  // Get selected role object
  const selectedRoleObj = useMemo(() => 
    roles.find(r => r.id === selectedRole),
    [roles, selectedRole]
  );

  // Get role permission IDs
  const rolePermissionIds = useMemo(() => 
    selectedRoleObj?.permissions?.map(p => p.id) || [],
    [selectedRoleObj]
  );

  // Group permissions by category
  const permissionsByCategory = useMemo(() => {
    return permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    }, {} as Record<string, Permission[]>);
  }, [permissions]);

  // Filter permissions by search
  const filteredPermissionsByCategory = useMemo(() => {
    if (!searchQuery.trim()) return permissionsByCategory;
    
    const filtered: Record<string, Permission[]> = {};
    Object.entries(permissionsByCategory).forEach(([category, perms]) => {
      const matchingPerms = perms.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matchingPerms.length > 0) {
        filtered[category] = matchingPerms;
      }
    });
    return filtered;
  }, [permissionsByCategory, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const totalPermissions = permissions.length;
    const fromRole = rolePermissionIds.length;
    const custom = selectedPermissions.length;
    const total = new Set([...rolePermissionIds, ...selectedPermissions]).size;
    return { totalPermissions, fromRole, custom, total };
  }, [permissions, rolePermissionIds, selectedPermissions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const updateData: any = {};

      if (selectedRole) {
        updateData.role_id = selectedRole;
      }

      updateData.custom_permission_codes = selectedPermissions.map(permId => {
        const perm = permissions.find(p => p.id === permId);
        return perm?.code || '';
      }).filter(Boolean);

      await updateEmployee(id, updateData);
      setSuccess("Permissions mises à jour avec succès");
      setTimeout(() => {
        router.push(`/apps/${slug}/hr/employees/${id}`);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleAllCategoryPermissions = (category: string, permissions: Permission[]) => {
    const nonRolePerms = permissions.filter(p => !rolePermissionIds.includes(p.id));
    const allSelected = nonRolePerms.every(p => selectedPermissions.includes(p.id));
    
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(p => !nonRolePerms.map(np => np.id).includes(p)));
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...nonRolePerms.map(p => p.id)])]);
    }
  };

  const togglePermission = (permissionId: string) => {
    if (rolePermissionIds.includes(permissionId)) return;
    
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
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
        subtitle={`${employee.first_name} ${employee.last_name}`}
        icon={Shield}
        backLink={`/apps/${slug}/hr/employees/${id}`}
      />

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 border-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total actives</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Lock className="size-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.fromRole}</p>
                <p className="text-xs text-muted-foreground">Du rôle</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Unlock className="size-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.custom}</p>
                <p className="text-xs text-muted-foreground">Custom</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-muted flex items-center justify-center">
                <HiOutlineShieldCheck className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalPermissions}</p>
                <p className="text-xs text-muted-foreground">Disponibles</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Role Selection */}
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <HiOutlineShieldCheck className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Rôle principal</h2>
              <p className="text-sm text-muted-foreground">
                Définit les permissions de base
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* No role option */}
            <button
              type="button"
              onClick={() => setSelectedRole("")}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all",
                !selectedRole
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Aucun rôle</span>
                {!selectedRole && <Check className="size-5 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground">
                Permissions personnalisées uniquement
              </p>
            </button>

            {/* Role options */}
            {Array.isArray(roles) && roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRole(role.id)}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all",
                  selectedRole === role.id
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{role.name}</span>
                  {selectedRole === role.id && <Check className="size-5 text-primary" />}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {role.permission_count || 0} permissions
                  </Badge>
                  {role.is_system_role && (
                    <Badge className="text-[10px] bg-blue-100 text-blue-700">
                      Système
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Selected role permissions preview */}
          {selectedRoleObj && selectedRoleObj.permissions && selectedRoleObj.permissions.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <Lock className="size-4" />
                Permissions incluses dans "{selectedRoleObj.name}"
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedRoleObj.permissions.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs font-medium"
                  >
                    <Check className="size-3" />
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Permissions */}
        <Card className="border-0 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Unlock className="size-5 text-green-500" />
                  Permissions personnalisées
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Ajoutez des permissions supplémentaires au-delà du rôle
                </p>
              </div>
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setExpandedCategories(Object.keys(permissionsByCategory))}
              >
                Tout déplier
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setExpandedCategories([])}
              >
                Tout replier
              </Button>
              {selectedPermissions.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPermissions([])}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="size-4 mr-1" />
                  Réinitialiser ({selectedPermissions.length})
                </Button>
              )}
            </div>
          </div>

          {/* Permission Categories */}
          <div className="divide-y divide-border/50">
            {Object.entries(filteredPermissionsByCategory).map(([category, categoryPermissions]) => {
              const isExpanded = expandedCategories.includes(category);
              const nonRolePerms = categoryPermissions.filter(p => !rolePermissionIds.includes(p.id));
              const selectedInCategory = categoryPermissions.filter(p =>
                rolePermissionIds.includes(p.id) || selectedPermissions.includes(p.id)
              ).length;
              const allNonRoleSelected = nonRolePerms.length > 0 && 
                nonRolePerms.every(p => selectedPermissions.includes(p.id));
              const someSelected = nonRolePerms.some(p => selectedPermissions.includes(p.id));

              return (
                <div key={category}>
                  {/* Category Header */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors",
                      isExpanded && "bg-muted/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Category checkbox */}
                      <div
                        role="checkbox"
                        aria-checked={allNonRoleSelected}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAllCategoryPermissions(category, categoryPermissions);
                        }}
                        className={cn(
                          "size-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer",
                          allNonRoleSelected
                            ? "bg-primary border-primary text-white"
                            : someSelected
                              ? "bg-primary/30 border-primary"
                              : "border-border hover:border-primary"
                        )}
                      >
                        {allNonRoleSelected && <Check className="size-3" />}
                        {someSelected && !allNonRoleSelected && <div className="size-2 bg-primary rounded-sm" />}
                      </div>
                      
                      <span className="font-semibold">{category}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {selectedInCategory}/{categoryPermissions.length}
                      </Badge>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="size-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-5 text-muted-foreground" />
                    )}
                  </button>

                  {/* Permissions Grid */}
                  {isExpanded && (
                    <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {categoryPermissions.map((permission) => {
                        const isFromRole = rolePermissionIds.includes(permission.id);
                        const isSelected = isFromRole || selectedPermissions.includes(permission.id);

                        return (
                          <button
                            key={permission.id}
                            type="button"
                            onClick={() => togglePermission(permission.id)}
                            disabled={isFromRole}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg text-left transition-all",
                              isFromRole
                                ? "bg-blue-50 dark:bg-blue-950/30 cursor-not-allowed opacity-80"
                                : isSelected
                                  ? "bg-green-50 dark:bg-green-950/30 ring-1 ring-green-500/30"
                                  : "bg-muted/30 hover:bg-muted/60"
                            )}
                          >
                            {/* Checkbox */}
                            <div
                              className={cn(
                                "size-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                                isFromRole
                                  ? "bg-blue-500 border-blue-500 text-white"
                                  : isSelected
                                    ? "bg-green-500 border-green-500 text-white"
                                    : "border-border"
                              )}
                            >
                              {isSelected && <Check className="size-3" />}
                            </div>
                            
                            {/* Permission info */}
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "text-sm font-medium truncate",
                                isFromRole && "text-blue-700 dark:text-blue-300"
                              )}>
                                {permission.name}
                              </p>
                              {isFromRole && (
                                <p className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5">
                                  <Lock className="size-3" />
                                  Inclus dans le rôle
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {Object.keys(filteredPermissionsByCategory).length === 0 && (
              <div className="text-center py-12">
                <Search className="size-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Aucune permission trouvée</p>
              </div>
            )}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{stats.total}</span> permissions seront appliquées
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" asChild>
              <Link href={`/apps/${slug}/hr/employees/${id}`}>
                Annuler
              </Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                "Enregistrement..."
              ) : (
                <>
                  <HiOutlineCheckCircle className="size-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
