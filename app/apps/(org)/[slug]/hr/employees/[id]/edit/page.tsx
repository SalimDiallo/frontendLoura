"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { getEmployee, updateEmployee }from "@/lib/services/hr/employee.service";
import { getDepartments } from "@/lib/services/hr/department.service";
import { getPositions } from "@/lib/services/hr/position.service";
import { getRoles } from "@/lib/services/hr/role.service";
import { getEmployees } from "@/lib/services/hr/employee.service";
import { getPermissions } from "@/lib/services/hr/permission.service";
import type { Department, Position, Employee, EmployeeListItem, Role, Permission } from "@/lib/types/hr";
import {
  EmploymentStatus,
  Gender,
} from "@/lib/types/hr";
import {
  HiOutlineUserCircle,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import { Alert, Button, Card, Form } from "@/components/ui";
import {
  FormInputField,
  FormSelectField,
} from "@/components/ui/form-fields";

// Schema de validation
const employeeSchema = z.object({
  first_name: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  last_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  employee_id: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.nativeEnum(Gender).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  manager: z.string().optional(),
  employment_status: z.nativeEnum(EmploymentStatus),
  hire_date: z.string().min(1, "La date d'embauche est requise"),
  termination_date: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  
  // Rôle
  role: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [managers, setManagers] = useState<EmployeeListItem[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employment_status: EmploymentStatus.ACTIVE,
    },
  });

  useEffect(() => {
    loadFormData();
  }, [id]);

  const loadFormData = async () => {
    try {
      setLoadingData(true);
      const [employeeData, depts, positionsData, employeesData, rolesData, permsData] = await Promise.all([
        getEmployee(id),
        getDepartments({ is_active: true, organization_subdomain: slug }),
        getPositions({ is_active: true }),
        getEmployees(slug),
        getRoles({ is_active: true, organization_subdomain: slug }),
        getPermissions(),
      ]);

      setEmployee(employeeData);
      setDepartments(depts);
      setPositions(positionsData);
      setManagers(employeesData.results.filter(e => e.id !== id)); // Exclure l'employé actuel
      setRoles(rolesData);
      setPermissions(permsData);

      // Set existing custom permissions
      if (employeeData.custom_permissions && Array.isArray(employeeData.custom_permissions)) {
        setSelectedPermissions(employeeData.custom_permissions.map((p: any) => p.id));
      }

      // Remplir le formulaire avec les données existantes
      form.reset({
        first_name: employeeData.first_name,
        last_name: employeeData.last_name,
        email: employeeData.email,
        phone: employeeData.phone || "",
        employee_id: employeeData.employee_id || "",
        date_of_birth: employeeData.date_of_birth || "",
        gender: employeeData.gender,
        address: employeeData.address || "",
        city: employeeData.city || "",
        country: employeeData.country || "",
        department: employeeData.department || "",
        position: employeeData.position || "",
        manager: employeeData.manager || "",
        employment_status: employeeData.employment_status,
        hire_date: employeeData.hire_date,
        termination_date: employeeData.termination_date || "",
        emergency_contact_name: employeeData.emergency_contact?.name || "",
        emergency_contact_phone: employeeData.emergency_contact?.phone || "",
        emergency_contact_relationship: employeeData.emergency_contact?.relationship || "",
        role: employeeData.role?.id || "",
      });
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

      // Build update payload - only include non-empty values
      const employeeData: any = {
        first_name: data.first_name,
        last_name: data.last_name,
        // email is not editable - removed from update payload
        employment_status: data.employment_status,
        hire_date: data.hire_date,
      };

      // Add optional fields only if they have values
      if (data.phone) employeeData.phone = data.phone;
      if (data.employee_id) employeeData.employee_id = data.employee_id;
      if (data.date_of_birth) employeeData.date_of_birth = data.date_of_birth;
      if (data.gender) employeeData.gender = data.gender;
      if (data.address) employeeData.address = data.address;
      if (data.city) employeeData.city = data.city;
      if (data.country) employeeData.country = data.country;
      if (data.department) employeeData.department = data.department;
      if (data.position) employeeData.position = data.position;
      if (data.manager) employeeData.manager = data.manager;
      if (data.termination_date) employeeData.termination_date = data.termination_date;

      // Emergency contact
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

      await updateEmployee(id, employeeData);
      router.push(`/apps/${slug}/hr/employees/${id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur lors de la mise à jour de l'employé");
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
          <Link href={`/apps/${slug}/hr/employees`}>
            <HiOutlineArrowLeft className="size-4 mr-2" />
            Retour à la liste
          </Link>
        </Button>
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
              <Link href={`/apps/${slug}/hr/employees/${id}`}>
                <HiOutlineArrowLeft className="size-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <HiOutlineUserCircle className="size-7" />
              Modifier Employé
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 ml-10">
            {employee.first_name} {employee.last_name}
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
                label="Prénom"
                placeholder="Jean"
                required
              />
              <FormInputField
                name="last_name"
                label="Nom"
                placeholder="Dupont"
                required
              />
              <FormInputField
                name="email"
                label="Email"
                placeholder="jean.dupont@example.com"
                type="email"
                required
                disabled
              />
              <FormInputField
                name="phone"
                label="Téléphone"
                placeholder="+224 XXX XXX XXX"
                type="tel"
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
              <FormInputField
                name="employee_id"
                label="Matricule"
                placeholder="EMP001"
              />
              <FormSelectField
                name="department"
                label="Département"
                placeholder="Sélectionner un département"
                options={Array.isArray(departments) ? departments.map((dept) => ({
                  value: dept.id,
                  label: dept.name,
                })) : []}
              />
              <FormSelectField
                name="position"
                label="Poste"
                placeholder="Sélectionner un poste"
                options={Array.isArray(positions) ? positions.map((pos) => ({
                  value: pos.id,
                  label: pos.title,
                })) : []}
              />
              <FormSelectField
                name="manager"
                label="Manager"
                placeholder="Sélectionner un manager"
                options={Array.isArray(managers) ? managers.map((manager) => ({
                  value: manager.id,
                  label: manager.full_name || "Sans nom",
                })) : []}
              />
              <FormSelectField
                name="employment_status"
                label="Statut d'emploi"
                placeholder="Sélectionner un statut"
                required
                options={[
                  { value: EmploymentStatus.ACTIVE, label: "Actif" },
                  { value: EmploymentStatus.INACTIVE, label: "Inactif" },
                  { value: EmploymentStatus.ON_LEAVE, label: "En congé" },
                  { value: EmploymentStatus.TERMINATED, label: "Terminé" },
                ]}
              />
              <FormInputField
                name="hire_date"
                label="Date d'embauche"
                type="date"
                required
              />
              <FormInputField
                name="termination_date"
                label="Date de fin"
                type="date"
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
              <Link href={`/apps/${slug}/hr/employees/${id}`}>
                Annuler
              </Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>Enregistrement...</>
              ) : (
                <>
                  <HiOutlineCheckCircle className="size-4 mr-2" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
