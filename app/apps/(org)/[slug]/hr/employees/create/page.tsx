"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { createEmployee } from "@/lib/services/hr/employee.service";
import { getDepartments } from "@/lib/services/hr/department.service";
import { getPositions, createPosition } from "@/lib/services/hr/position.service";
import { getRoles } from "@/lib/services/hr/role.service";
import { getEmployees } from "@/lib/services/hr/employee.service";
import { getPermissions } from "@/lib/services/hr/permission.service";
import { organizationService } from "@/lib/services/core";
import type { Department, Position, Role, Permission, EmployeeListItem } from "@/lib/types/hr";
import type { Organization } from "@/lib/types/core";
import {
  EmploymentStatus,
  Gender,
} from "@/lib/types/hr";
import {
  HiOutlineUserCircle,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineSparkles,
  HiOutlinePlusCircle,
  HiOutlineXMark,
} from "react-icons/hi2";
import { Alert, Button, Card, Form } from "@/components/ui";
import {
  FormInputField,
  FormSelectField,
} from "@/components/ui/form-fields";
import { Can } from "@/components/apps/common";
import { COMMON_PERMISSIONS } from "@/lib/types/shared";

// Schema de validation
const employeeSchema = z.object({
  // Informations personnelles
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

  // Informations d'emploi
  employee_id: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  manager: z.string().optional(),
  employment_status: z.nativeEnum(EmploymentStatus).optional(),
  hire_date: z.string().min(1, "La date d'embauche est requise"),

  // Contact d'urgence
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),

  // Rôle
  role: z.string().min(1, "Le rôle est requis"),
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
  const [permissions, setPermissions] = useState<Permission[]>([]);
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

  // Générer un matricule automatique unique
  const generateEmployeeId = () => {
    const now = new Date();
    const prefix = 'EMP';
    // Date: YYMMDD
    const date = now.toISOString().slice(2, 10).replace(/-/g, '');
    // Heure: HHMMSS
    const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
    // Millisecondes pour plus d'unicité
    const ms = now.getMilliseconds().toString().padStart(3, '0');
    // Partie aléatoire: 4 caractères
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    // Format: EMP-YYMMDD-HHMMSS-XXX-RAND
    const matricule = `${prefix}-${date}-${time.slice(0, 4)}-${ms}${random}`;
    form.setValue('employee_id', matricule);
  };

  useEffect(() => {
    loadFormData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFormData = async () => {
    try {
      setLoadingData(true);
      const [org, depts, positionsData, rolesData, employeesData, permsData] = await Promise.all([
        organizationService.getBySlug(slug),
        getDepartments({ is_active: true, organization_subdomain: slug }),
        getPositions({ is_active: true }),
        getRoles({ is_active: true, organization_subdomain: slug }),
        getEmployees(slug),
        getPermissions(),
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
      setPermissions(permsData);
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err);
      setError("Erreur lors du chargement des données du formulaire");
    } finally {
      setLoadingData(false);
    }
  };

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      setLoading(true);
      setError(null);

      if (!currentOrganization) {
        throw new Error("Organisation non trouvée");
      }

      // Préparer les données pour l'API
      const employeeData: any = {
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
        department: data.department,
        position: data.position,
        manager: data.manager,
        employment_status: data.employment_status,
        hire_date: data.hire_date,
      };

      // Ajouter le contact d'urgence si renseigné
      if (data.emergency_contact_name && data.emergency_contact_phone) {
        employeeData.emergency_contact = {
          name: data.emergency_contact_name,
          phone: data.emergency_contact_phone,
          relationship: data.emergency_contact_relationship || "",
        };
      }

      // Ajouter le rôle sélectionné
      const selectedRoleValue = form.getValues('role');
      if (selectedRoleValue) {
        employeeData.role_id = selectedRoleValue;
      }

      // Ajouter les permissions personnalisées supplémentaires
      if (selectedPermissions.length > 0) {
        employeeData.custom_permission_codes = selectedPermissions.map(id => {
          const perm = permissions.find(p => p.id === id);
          return perm?.code || '';
        }).filter(Boolean);
      }

      await createEmployee(employeeData);
      router.push(`/apps/${slug}/hr/employees`);
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
              <FormInputField
                name="first_name"
                label="Prénom *"
                placeholder="Jean"
                required
              />
              <FormInputField
                name="last_name"
                label="Nom *"
                placeholder="Dupont"
                required
              />
              <FormInputField
                name="email"
                label="Email *"
                placeholder="jean.dupont@example.com"
                type="email"
                required
              />
              <FormInputField
                name="phone"
                label="Téléphone"
                placeholder="+224 XXX XXX XXX"
                type="tel"
              />
              <FormInputField
                name="password"
                label="Mot de passe *"
                placeholder="••••••••"
                type="password"
                required
              />
              <FormInputField
                name="password_confirm"
                label="Confirmer le mot de passe *"
                placeholder="••••••••"
                type="password"
                required
              />
              <FormInputField
                name="date_of_birth"
                label="Date de naissance"
                type="date"
              />
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
              <FormInputField
                className="md:col-span-2"
                name="address"
                label="Adresse"
                placeholder="123 Rue Example"
              />
              <FormInputField
                name="city"
                label="Ville"
                placeholder="Conakry"
              />
              <FormInputField
                name="country"
                label="Pays"
                placeholder="Guinée"
              />
            </div>
          </Card>

          {/* Informations d'emploi */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Informations d'emploi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Matricule</label>
                <div className="flex gap-2">
                  <input
                    {...form.register('employee_id')}
                    placeholder="EMP-241224-ABCD"
                    className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateEmployeeId}
                    className="h-10 gap-1"
                  >
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
                options={departments?.map((dept) => ({
                  value: dept.id,
                  label: dept.name,
                })) || []}
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPositionModal(true)}
                    className="h-10 gap-1"
                  >
                    <HiOutlinePlusCircle className="size-4" />
                    Créer
                  </Button>
                </div>
              </div>
              <FormSelectField
                name="manager"
                label="Manager"
                placeholder="Sélectionner un manager"
                options={managers?.map((manager) => ({
                  value: manager.id,
                  label: `${manager.full_name}`,
                })) || []}
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
              <FormInputField
                name="hire_date"
                label="Date d'embauche *"
                type="date"
                required
              />
            </div>
          </Card>

          {/* Contact d'urgence */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Contact d'urgence</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormInputField
                name="emergency_contact_name"
                label="Nom"
                placeholder="Nom du contact"
              />
              <FormInputField
                name="emergency_contact_phone"
                label="Téléphone"
                placeholder="+224 XXX XXX XXX"
                type="tel"
              />
              <FormInputField
                name="emergency_contact_relationship"
                label="Relation"
                placeholder="Ex: Conjoint, Parent..."
              />
            </div>
          </Card>

          {/* Sélection du rôle */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Rôle et Permissions</h2>
            <div className="space-y-4">
              <FormSelectField
                name="role"
                label="Rôle"
                placeholder="Sélectionner un rôle"
                required
                description="Le rôle définit l'ensemble de permissions de base de l'employé"
                options={Array.isArray(roles) ? roles.map((role) => ({
                  value: role.id,
                  label: `${role.name}${role.is_system_role ? ' (Système)' : ''} - ${role.permission_count} permission(s)`,
                })) : []}
              />

              {form.watch('role') && Array.isArray(roles) && (
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Permissions du rôle sélectionné:
                  </h4>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    {roles.find(r => r.id === form.watch('role'))?.permissions?.map(p => p.name).join(', ') || 'Aucune permission'}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Permissions personnalisées supplémentaires */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">
              Permissions
              {form.watch('role') && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({roles.find(r => r.id === form.watch('role'))?.permission_count || 0} du rôle + {selectedPermissions.length} supplémentaires)
                </span>
              )}
              {!form.watch('role') && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({selectedPermissions.length} sélectionnées)
                </span>
              )}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {form.watch('role')
                ? "Les permissions du rôle sont automatiquement incluses (grisées). Vous pouvez ajouter des permissions supplémentaires."
                : "Sélectionnez un rôle pour voir ses permissions, puis ajoutez des permissions supplémentaires si nécessaire."
              }
            </p>

            <div className="space-y-6">
              {permissions && Array.isArray(permissions) && permissions.length > 0 ? (
                Object.entries(
                  permissions.reduce((acc, perm) => {
                    if (!acc[perm.category]) {
                      acc[perm.category] = [];
                    }
                    acc[perm.category].push(perm);
                    return acc;
                  }, {} as Record<string, Permission[]>)
                ).map(([category, categoryPermissions]) => {
                // Get permissions from selected role
                const selectedRoleObj = roles.find(r => r.id === form.watch('role'));
                const rolePermissionIds = selectedRoleObj?.permissions?.map(p => p.id) || [];

                const categoryPermissionIds = categoryPermissions.map((p) => p.id);

                // Count how many permissions are selected (from role + custom)
                const selectedInCategory = categoryPermissions.filter(p =>
                  rolePermissionIds.includes(p.id) || selectedPermissions.includes(p.id)
                ).length;

                // Check if all non-role permissions are selected
                const nonRolePerms = categoryPermissionIds.filter(id => !rolePermissionIds.includes(id));
                const allNonRoleSelected = nonRolePerms.length > 0 && nonRolePerms.every((p) =>
                  selectedPermissions.includes(p)
                );
                const someSelected = categoryPermissions.some((p) =>
                  selectedPermissions.includes(p.id)
                );

                const toggleCategory = () => {
                  // Only toggle non-role permissions
                  if (allNonRoleSelected) {
                    setSelectedPermissions((prev) =>
                      prev.filter((p) => !nonRolePerms.includes(p))
                    );
                  } else {
                    setSelectedPermissions((prev) => [
                      ...prev,
                      ...nonRolePerms.filter((p) => !prev.includes(p)),
                    ]);
                  }
                };

                return (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <input
                        type="checkbox"
                        id={`category-${category}`}
                        checked={allNonRoleSelected}
                        onChange={toggleCategory}
                        disabled={nonRolePerms.length === 0}
                        className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                        style={{
                          opacity: someSelected && !allNonRoleSelected ? 0.5 : 1,
                        }}
                      />
                      <label
                        htmlFor={`category-${category}`}
                        className="text-sm font-semibold cursor-pointer"
                      >
                        {category}
                      </label>
                      <span className="text-xs text-muted-foreground">
                        ({selectedInCategory}/{categoryPermissions.length})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                      {categoryPermissions.map((permission) => {
                        // Check if this permission is from the selected role
                        const selectedRoleObj2 = roles.find(r => r.id === form.watch('role'));
                        const isFromRole = selectedRoleObj2?.permissions?.some(p => p.id === permission.id) || false;
                        const isChecked = isFromRole || selectedPermissions.includes(permission.id);

                        return (
                          <div key={permission.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={permission.id}
                              checked={isChecked}
                              disabled={isFromRole}
                              onChange={() => {
                                if (!isFromRole) {
                                  setSelectedPermissions((prev) =>
                                    prev.includes(permission.id)
                                      ? prev.filter((p) => p !== permission.id)
                                      : [...prev, permission.id]
                                  );
                                }
                              }}
                              className={`size-4 rounded border-gray-300 text-primary focus:ring-primary ${
                                isFromRole ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            />
                            <label
                              htmlFor={permission.id}
                              className={`text-sm ${isFromRole ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                            >
                              {permission.name}
                              {isFromRole && (
                                <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                                  (du rôle)
                                </span>
                              )}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune permission disponible
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href={`/apps/${slug}/hr/employees`}>
                Annuler
              </Link>
            </Button>
          <Can permission={COMMON_PERMISSIONS.HR.CREATE_EMPLOYEES}>
              <Button type="submit" disabled={loading}>
              {loading ? (
                <>Création en cours...</>
              ) : (
                <>
                  <HiOutlineCheckCircle className="size-4 mr-2" />
                  Créer l'employé
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
                      // Refresh positions list
                      const positionsData = await getPositions({ is_active: true });
                      setPositions(positionsData);
                      // Select the new position
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
