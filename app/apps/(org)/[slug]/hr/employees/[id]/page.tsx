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
import { EmploymentStatusBadge } from "@/components/hr";
import { getEmployee, deleteEmployee, activateEmployee, deactivateEmployee } from "@/lib/services/hr/employee.service";
import { contractService } from "@/lib/services/hr";
import type { Employee, Contract } from "@/lib/types/hr";
import {
  HiOutlineArrowLeft,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineMapPin,
  HiOutlineCalendar,
  HiOutlineBriefcase,
  HiOutlineUserCircle,
  HiOutlineIdentification,
  HiOutlineBanknotes,
  HiOutlineExclamationCircle,
  HiOutlineShieldCheck,
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlinePlusCircle,
  HiOutlineEye,
  HiOutlineCog,
} from "react-icons/hi2";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Can } from "@/components/apps/common";
import { COMMON_PERMISSIONS, PermissionAction, ResourceType } from "@/lib/types/shared";

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const id = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    loadEmployee();
    loadContracts();
  }, [id]);

  const loadEmployee = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEmployee(id);
      setEmployee(data);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement de l'employé");
    } finally {
      setLoading(false);
    }
  };

  const loadContracts = async () => {
    try {
      setLoadingContracts(true);
      const data = await contractService.getEmployeeContracts(slug, id);
      setContracts(data);
    } catch (err) {
      console.error('Error loading contracts:', err);
    } finally {
      setLoadingContracts(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) return;

    try {
      setDeleting(true);
      await deleteEmployee(id);
      router.push(`/apps/${slug}/hr/employees`);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!employee) return;

    try {
      setToggling(true);
      if (employee.is_active) {
        await deactivateEmployee(id);
      } else {
        await activateEmployee(id);
      }
      await loadEmployee();
    } catch (err: any) {
      console.error('Error toggling status:', err);
      setError(err.message || 'Erreur lors du changement de statut');
    } finally {
      setToggling(false);
    }
  };

  const getContractTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      permanent: "CDI",
      temporary: "CDD",
      contract: "Contractuel",
      internship: "Stage",
      freelance: "Freelance",
    };
    return labels[type] || type;
  };

  const getGenderLabel = (gender?: string) => {
    const labels: Record<string, string> = {
      male: "Homme",
      female: "Femme",
      other: "Autre",
    };
    return gender ? labels[gender] || gender : "-";
  };

  if (loading) {
    return (
      <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES} showMessage={true}>
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </Can>
    );
  }

  console.log(employee);


  if (error || !employee) {
    return (
      <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES} showMessage={true}>
        <div className="space-y-6">
          <Alert variant="error">{error || "Employé non trouvé"}</Alert>
          <Button asChild>
            <Link href={`/apps/${slug}/hr/employees`}>
              <HiOutlineArrowLeft className="size-4 mr-2" />
              Retour à la liste
            </Link>
          </Button>
        </div>
      </Can>
    );
  }

  return (
  <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>
  <div className="space-y-6">
      {/* Header */}
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

      {/* Employee Header Card */}
      <Card className="p-6 border-0 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="flex size-24 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-3xl">
              {employee.first_name[0]}
              {employee.last_name[0]}
            </div>
          </div>

          {/* Basic Info */}
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {employee.first_name} {employee.last_name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {employee.role?.name || employee.role_name || "Aucun rôle"} •{" "}
                {employee.department_name || "Aucun département"}
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm">
                <HiOutlineEnvelope className="size-4 text-muted-foreground" />
                <a href={`mailto:${employee.email}`} className="hover:underline">
                  {employee.email}
                </a>
              </div>
              {employee.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <HiOutlinePhone className="size-4 text-muted-foreground" />
                  <a href={`tel:${employee.phone}`} className="hover:underline">
                    {employee.phone}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <HiOutlineIdentification className="size-4 text-muted-foreground" />
                <span>Matricule: {employee.employee_id || "Non renseigné"}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <EmploymentStatusBadge status={employee.employment_status} />
              {employee.is_active ? (
                <Badge variant="success">Actif</Badge>
              ) : (
                <Badge variant="outline">Inactif</Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs with Details */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="employment">Emploi</TabsTrigger>
          <TabsTrigger value="contracts">
            Contrats
            {contracts.length > 0 && (
              <Badge className="ml-2 bg-primary/10 text-primary">{contracts.length}</Badge>
            )}
          </TabsTrigger>
          <Can permission={COMMON_PERMISSIONS.HR.MANAGE_EMPLOYEE_PERMISSIONS}>
              <TabsTrigger value="permissions">Rôles & Permissions</TabsTrigger>
          </Can>
          <TabsTrigger value="compensation">Compensation</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal Information */}
            <Card className="p-6 border-0 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <HiOutlineUserCircle className="size-5 text-primary" />
                Informations personnelles
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Date de naissance</div>
                  <div className="text-sm font-medium">
                    {employee.date_of_birth
                      ? new Date(employee.date_of_birth).toLocaleDateString("fr-FR")
                      : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Genre</div>
                  <div className="text-sm font-medium">
                    {getGenderLabel(employee.gender)}
                  </div>
                </div>
                {employee.address && (
                  <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <HiOutlineMapPin className="size-4" />
                      Adresse
                    </div>
                    <div className="text-sm font-medium">
                      {employee.address}
                      {employee.city && `, ${employee.city}`}
                      {employee.country && `, ${employee.country}`}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Employment Information */}
            <Card className="p-6 border-0 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <HiOutlineBriefcase className="size-5 text-primary" />
                Informations d'emploi
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Date d'embauche</div>
                  <div className="text-sm font-medium flex items-center gap-1">
                    <HiOutlineCalendar className="size-4" />
                    {employee.hire_date
                      ? new Date(employee.hire_date).toLocaleDateString("fr-FR")
                      : "Non renseignée"} 
                  </div>
                </div>
                {employee.manager_name && (
                  <div>
                    <div className="text-sm text-muted-foreground">Manager</div>
                    <div className="text-sm font-medium">
                      {employee.manager_name}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-muted-foreground">Position</div>
                  <div className="text-sm font-medium">
                    {employee.position_title || "Non renseignée"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Statut</div>
                  <div className="mt-1">
                    <EmploymentStatusBadge status={employee.employment_status} />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Emergency Contact */}
          {employee.emergency_contact && (
            <Card className="p-6 border-0 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <HiOutlineExclamationCircle className="size-5 text-primary" />
                Contact d'urgence
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Nom</div>
                  <div className="text-sm font-medium">
                    {employee.emergency_contact.name}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Téléphone</div>
                  <div className="text-sm font-medium">
                    {employee.emergency_contact.phone}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Relation</div>
                  <div className="text-sm font-medium">
                    {employee.emergency_contact.relationship}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Employment Tab */}
        <TabsContent value="employment" className="space-y-4">
          <Card className="p-6 border-0 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Détails d'emploi</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-muted-foreground">Matricule</div>
                <div className="text-base font-medium">
                  {employee.employee_id || "Non renseigné"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Département</div>
                <div className="text-base font-medium">
                  {employee.department_name || "Non renseigné"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Position</div>
                <div className="text-base font-medium">
                  {employee.position_title || "Non renseignée"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Manager</div>
                <div className="text-base font-medium">
                  {employee.manager_name || "Aucun"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Date d'embauche</div>
                <div className="text-base font-medium">
                  {employee.hire_date
                    ? new Date(employee.hire_date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Non renseignée"}
                </div>
              </div>
              {employee.termination_date && (
                <div>
                  <div className="text-sm text-muted-foreground">Date de fin</div>
                  <div className="text-base font-medium">
                    {new Date(employee.termination_date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground">Statut d'emploi</div>
                <div className="mt-1">
                  <EmploymentStatusBadge status={employee.employment_status} />
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Statut du compte</div>
                <div className="mt-1">
                  {employee.is_active ? (
                    <Badge variant="success">Actif</Badge>
                  ) : (
                    <Badge variant="outline">Inactif</Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
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
                                <div className="size-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
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

        {/* Compensation Tab */}
        <TabsContent value="compensation" className="space-y-4">
          <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEE_COMPENSATION}>
            <Card className="p-6 border-0 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <HiOutlineBanknotes className="size-5 text-primary" />
                Salaire et compensation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground">Salaire de base</div>
                  <div className="text-2xl font-bold text-foreground">
                    {employee.salary
                      ? `${employee.salary.toLocaleString()} ${employee.currency || "GNF"}`
                      : "Non renseigné"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Devise</div>
                  <div className="text-base font-medium">
                    {employee.currency || "GNF"}
                  </div>
                </div>
              </div>
            </Card>
          </Can>
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Contrats de l'employé</h3>
            <Can permission={COMMON_PERMISSIONS.HR.CREATE_CONTRACTS}>
              <Button asChild size="sm">
                <Link href={`/apps/${slug}/hr/contracts/create?employee=${id}`}>
                  <HiOutlinePlusCircle className="size-4 mr-2" />
                  Nouveau contrat
                </Link>
              </Button>
            </Can>
          </div>

          {loadingContracts ? (
            <Card className="p-8 border-0 shadow-sm">
              <div className="animate-pulse space-y-4">
                <div className="h-20 bg-muted rounded"></div>
                <div className="h-20 bg-muted rounded"></div>
              </div>
            </Card>
          ) : contracts.length === 0 ? (
            <Card className="p-12 text-center border-0 shadow-sm">
              <div className="flex flex-col items-center gap-4">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                  <HiOutlineDocumentText className="size-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Aucun contrat</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Cet employé n'a pas encore de contrat enregistré
                  </p>
                </div>
                <Can permission={COMMON_PERMISSIONS.HR.CREATE_CONTRACTS}>
                  <Button asChild>
                    <Link href={`/apps/${slug}/hr/contracts/create?employee=${id}`}>
                      <HiOutlinePlusCircle className="size-4 mr-2" />
                      Créer un contrat
                    </Link>
                  </Button>
                </Can>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {contracts.map((contract) => {
                const isActive = contract.is_active;
                const contractTypeLabels: Record<string, string> = {
                  permanent: "CDI",
                  temporary: "CDD",
                  contract: "Contractuel",
                  internship: "Stage",
                  freelance: "Freelance",
                };
                const contractTypeColors: Record<string, string> = {
                  permanent: "bg-green-100 text-green-800 border-green-200",
                  temporary: "bg-blue-100 text-blue-800 border-blue-200",
                  contract: "bg-purple-100 text-purple-800 border-purple-200",
                  internship: "bg-orange-100 text-orange-800 border-orange-200",
                  freelance: "bg-pink-100 text-pink-800 border-pink-200",
                };

                return (
                  <Card key={contract.id} className="p-6 border-0 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <Badge className={contractTypeColors[contract.contract_type] || ""}>
                            {contractTypeLabels[contract.contract_type] || contract.contract_type}
                          </Badge>
                          {isActive ? (
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
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Période</div>
                            <div className="text-sm font-medium">
                              {new Date(contract.start_date).toLocaleDateString('fr-FR')}
                              {contract.end_date && (
                                <> → {new Date(contract.end_date).toLocaleDateString('fr-FR')}</>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Salaire de base</div>
                            <div className="text-sm font-medium">
                              {contract.base_salary?.toLocaleString('fr-FR')} {contract.currency}
                              <span className="text-muted-foreground ml-1">
                                /{contract.salary_period === 'monthly' ? 'mois' : contract.salary_period === 'hourly' ? 'h' : contract.salary_period === 'annual' ? 'an' : 'jour'}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Heures/semaine</div>
                            <div className="text-sm font-medium">
                              {contract.hours_per_week || '-'}h
                            </div>
                          </div>
                        </div>

                        {contract.description && (
                          <div>
                            <div className="text-sm text-muted-foreground">Description</div>
                            <div className="text-sm mt-1">{contract.description}</div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Can permission={COMMON_PERMISSIONS.HR.VIEW_CONTRACTS}>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/apps/${slug}/hr/contracts/${contract.id}`}>
                              <HiOutlineEye className="size-4 mr-1" />
                              Voir
                            </Link>
                          </Button>
                        </Can>
                        <Can permission={COMMON_PERMISSIONS.HR.UPDATE_CONTRACTS}>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/apps/${slug}/hr/contracts/${contract.id}/edit`}>
                              <HiOutlinePencil className="size-4 mr-1" />
                              Modifier
                            </Link>
                          </Button>
                        </Can>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card className="p-12 text-center border-0 shadow-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <HiOutlineBriefcase className="size-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Aucun document</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  La gestion des documents sera bientôt disponible
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>

  </Can>
  );
}
