"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { createEmployee, getEmployees } from "@/lib/services/hr/employee.service";
import { getDepartments } from "@/lib/services/hr/department.service";
import { getPositions, createPosition } from "@/lib/services/hr/position.service";
import { getRoles } from "@/lib/services/hr/role.service";
import { organizationService } from "@/lib/services/core";
import type { Department, Position, Role, EmployeeListItem, EmployeeCreate } from "@/lib/types/hr";
import type { Organization } from "@/lib/types/core";
import { AVAILABLE_PERMISSIONS } from "@/lib/constants/hr";
import { PermissionSelector } from "@/components/apps/hr/permission-selector";
import { EmploymentStatus, Gender } from "@/lib/types/hr";
import {
  HiOutlineUserCircle,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineSparkles,
  HiOutlinePlusCircle,
  HiOutlineXMark,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import { Alert, Button, Card, Form, Badge } from "@/components/ui";
import { FormInputField, FormSelectField } from "@/components/ui/form-fields";
import { Can } from "@/components/apps/common";
import { COMMON_PERMISSIONS } from "@/lib/types/shared";
import { cn } from "@/lib/utils";

// Schema de validation
const employeeSchema = z.object({
  first_name: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  last_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  password_confirm: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.nativeEnum(Gender).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  employee_id: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  manager: z.string().optional(),
  employment_status: z.nativeEnum(EmploymentStatus).optional(),
  hire_date: z.string().min(1, "La date d'embauche est requise"),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  role: z.string().optional(),
}).refine((data) => data.password === data.password_confirm, {
  message: "Les mots de passe ne correspondent pas",
  path: ["password_confirm"],
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export default function CreateEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [managers, setManagers] = useState<EmployeeListItem[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [newPositionTitle, setNewPositionTitle] = useState("");
  const [creatingPosition, setCreatingPosition] = useState(false);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employment_status: EmploymentStatus.ACTIVE,
      hire_date: new Date().toISOString().split('T')[0],
    },
  });

  const selectedRoleId = form.watch('role');

  // Get role permission codes for the selected role
  const rolePermissionCodes = useMemo(() => {
    if (!selectedRoleId) return [];
    const role = roles.find(r => r.id === selectedRoleId);
    return role?.permissions?.map(p => p.code) || [];
  }, [selectedRoleId, roles]);

  const generateEmployeeId = () => {
    const now = new Date();
    const prefix = 'EMP';
    const date = now.toISOString().slice(2, 10).replace(/-/g, '');
    const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const ms = now.getMilliseconds().toString().padStart(3, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const matricule = `${prefix}-${date}-${time.slice(0, 4)}-${ms}${random}`;
    form.setValue('employee_id', matricule);
  };

  const loadFormData = useCallback(async () => {
    try {
      setLoadingData(true);
      const [org, depts, positionsData, rolesData, employeesData] = await Promise.all([
        organizationService.getBySlug(slug),
        getDepartments({ is_active: true, organization_subdomain: slug }),
        getPositions({ is_active: true }),
        getRoles({ is_active: true, organization_subdomain: slug }),
        getEmployees(slug),
      ]);

      if (!org) {
        setError("Organisation non trouvée");
        return;
      }

      setCurrentOrganization(org);
      setDepartments(depts);
      setPositions(positionsData);
      setRoles(rolesData);
      setManagers(employeesData?.results || []);
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err);
      setError("Erreur lors du chargement des données du formulaire");
    } finally {
      setLoadingData(false);
    }
  }, [slug]);

  useEffect(() => {
    loadFormData();
  }, [loadFormData]);

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      setLoading(true);
      setError(null);

      if (!currentOrganization) {
        throw new Error("Organisation non trouvée");
      }

      const employeeData: EmployeeCreate & { organization: string } = {
        organization: currentOrganization.id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password: data.password,
        password_confirm: data.password_confirm,
        phone: data.phone,
        employee_id: data.employee_id,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        address: data.address,
        city: data.city,
        country: data.country,
        department: data.department || undefined,
        position: data.position || undefined,
        manager: data.manager || undefined,
        employment_status: data.employment_status,
        hire_date: data.hire_date,
      };

      if (data.emergency_contact_name && data.emergency_contact_phone) {
        employeeData.emergency_contact = {
          name: data.emergency_contact_name,
          phone: data.emergency_contact_phone,
          relationship: data.emergency_contact_relationship || "",
        };
      }

      if (data.role) {
        employeeData.role_id = data.role;
      }

      if (selectedPermissions.length > 0) {
        employeeData.custom_permission_codes = selectedPermissions;
      }

      await createEmployee(employeeData);
      router.push(`/apps/${slug}/hr/employees`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur lors de la création de l'employé");
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

  return (
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
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <HiOutlineUserCircle className="size-7" />
              Nouvel Employé
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 ml-10">
            Créer un nouveau profil employé
          </p>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Informations personnelles */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Informations personnelles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInputField name="first_name" label="Prénom *" placeholder="Jean" required />
              <FormInputField name="last_name" label="Nom *" placeholder="Dupont" required />
              <FormInputField name="email" label="Email *" placeholder="jean.dupont@example.com" type="email" required />
              <FormInputField name="phone" label="Téléphone" placeholder="+224 XXX XXX XXX" type="tel" />
              <FormInputField name="password" label="Mot de passe *" placeholder="••••••••" type="password" required />
              <FormInputField name="password_confirm" label="Confirmer le mot de passe *" placeholder="••••••••" type="password" required />
              <FormInputField name="date_of_birth" label="Date de naissance" type="date" />
              <FormSelectField
                name="gender"
                label="Genre"
                placeholder="Sélectionner"
                options={[
                  { value: Gender.MALE, label: "Homme" },
                  { value: Gender.FEMALE, label: "Femme" },
                  { value: Gender.OTHER, label: "Autre" },
                ]}
              />
              <FormInputField className="md:col-span-2" name="address" label="Adresse" placeholder="123 Rue Example" />
              <FormInputField name="city" label="Ville" placeholder="Conakry" />
              <FormInputField name="country" label="Pays" placeholder="Guinée" />
            </div>
          </Card>

          {/* Informations d'emploi */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Informations d&apos;emploi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Matricule</label>
                <div className="flex gap-2">
                  <input
                    {...form.register('employee_id')}
                    placeholder="EMP-241224-ABCD"
                    className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={generateEmployeeId} className="h-10 gap-1">
                    <HiOutlineSparkles className="size-4" />
                    Auto
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Cliquez sur Auto pour générer automatiquement</p>
              </div>
              <FormSelectField
                name="department"
                label="Département"
                placeholder="Sélectionner un département"
                options={departments?.map((dept) => ({ value: dept.id, label: dept.name })) || []}
              />
              <div className="space-y-2">
                <label className="text-sm font-medium">Poste</label>
                <div className="flex gap-2">
                  <select
                    {...form.register('position')}
                    className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Sélectionner un poste</option>
                    {positions?.map((pos) => (
                      <option key={pos.id} value={pos.id}>{pos.title}</option>
                    ))}
                  </select>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowPositionModal(true)} className="h-10 gap-1">
                    <HiOutlinePlusCircle className="size-4" />
                    Créer
                  </Button>
                </div>
              </div>
              <FormSelectField
                name="manager"
                label="Manager"
                placeholder="Sélectionner un manager"
                options={managers?.map((manager) => ({ value: manager.id, label: manager.full_name })) || []}
              />
              <FormSelectField
                name="employment_status"
                label="Statut d'emploi *"
                placeholder="Sélectionner un statut"
                required
                options={[
                  { value: EmploymentStatus.ACTIVE, label: "Actif" },
                  { value: EmploymentStatus.ON_LEAVE, label: "En congé" },
                  { value: EmploymentStatus.TERMINATED, label: "Terminé" },
                ]}
              />
              <FormInputField name="hire_date" label="Date d'embauche *" type="date" required />
            </div>
          </Card>

          {/* Contact d'urgence */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Contact d&apos;urgence</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormInputField name="emergency_contact_name" label="Nom" placeholder="Nom du contact" />
              <FormInputField name="emergency_contact_phone" label="Téléphone" placeholder="+224 XXX XXX XXX" type="tel" />
              <FormInputField name="emergency_contact_relationship" label="Relation" placeholder="Ex: Conjoint, Parent..." />
            </div>
          </Card>

          {/* Rôle et Permissions */}
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <HiOutlineShieldCheck className="size-5 text-primary" />
                  Rôle et Permissions
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Sélectionnez un rôle et ajoutez des permissions personnalisées si nécessaire
                </p>
              </div>
            </div>

            {/* Sélection du rôle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {/* Option sans rôle */}
              <button
                type="button"
                onClick={() => form.setValue('role', '')}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all",
                  !selectedRoleId
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "size-10 rounded-full flex items-center justify-center",
                    !selectedRoleId ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                  )}>
                    <HiOutlineShieldCheck className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium">Sans rôle</p>
                    <p className="text-xs text-muted-foreground">Permissions personnalisées</p>
                  </div>
                </div>
              </button>

              {/* Rôles disponibles */}
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => form.setValue('role', role.id)}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all",
                    selectedRoleId === role.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50 hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "size-10 rounded-full flex items-center justify-center",
                      selectedRoleId === role.id ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                    )}>
                      <HiOutlineShieldCheck className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{role.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {role.permissions?.length || role.permission_count || 0} permissions
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Afficher les permissions du rôle sélectionné */}
            {selectedRoleId && (
              <div className="mb-6 p-4 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                  Permissions du rôle sélectionné
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
                  {rolePermissionCodes.length === 0 && (
                    <span className="text-sm text-muted-foreground">Aucune permission</span>
                  )}
                </div>
              </div>
            )}

            {/* Permissions personnalisées */}
            <div>
              <h3 className="text-sm font-medium mb-3">
                Permissions supplémentaires
                <span className="ml-2 text-muted-foreground font-normal">
                  ({selectedPermissions.length} sélectionnées)
                </span>
              </h3>
              <PermissionSelector
                permissions={AVAILABLE_PERMISSIONS}
                selectedPermissions={selectedPermissions}
                onSelectionChange={setSelectedPermissions}
                rolePermissionCodes={rolePermissionCodes}
                maxHeight="350px"
                compact
              />
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href={`/apps/${slug}/hr/employees`}>Annuler</Link>
            </Button>
            <Can permission={COMMON_PERMISSIONS.HR.CREATE_EMPLOYEES}>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>Création en cours...</>
                ) : (
                  <>
                    <HiOutlineCheckCircle className="size-4 mr-2" />
                    Créer l&apos;employé
                  </>
                )}
              </Button>
            </Can>
          </div>
        </form>
      </Form>

      {/* Modal création rapide de poste */}
      {showPositionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Créer un poste rapidement</h3>
              <button
                onClick={() => {
                  setShowPositionModal(false);
                  setNewPositionTitle("");
                }}
                className="p-1 hover:bg-muted rounded"
              >
                <HiOutlineXMark className="size-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre du poste *</label>
                <input
                  type="text"
                  value={newPositionTitle}
                  onChange={(e) => setNewPositionTitle(e.target.value)}
                  placeholder="ex: Développeur Senior"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  autoFocus
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPositionModal(false);
                    setNewPositionTitle("");
                  }}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  disabled={!newPositionTitle.trim() || creatingPosition}
                  onClick={async () => {
                    if (!newPositionTitle.trim()) return;
                    try {
                      setCreatingPosition(true);
                      const newPos = await createPosition({
                        title: newPositionTitle.trim(),
                        is_active: true,
                      });
                      const positionsData = await getPositions({ is_active: true });
                      setPositions(positionsData);
                      form.setValue('position', newPos.id);
                      setShowPositionModal(false);
                      setNewPositionTitle("");
                    } catch (err) {
                      console.error("Erreur création poste:", err);
                      alert("Erreur lors de la création du poste");
                    } finally {
                      setCreatingPosition(false);
                    }
                  }}
                >
                  {creatingPosition ? "Création..." : "Créer"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
