"use client";

import { useState, useEffect, useCallback } from "react";
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

import type { Department, Position, Employee, EmployeeListItem, Role } from "@/lib/types/hr";
import {
  EmploymentStatus,
  Gender,
} from "@/lib/types/hr";
import { AVAILABLE_PERMISSIONS, type PermissionItem } from "@/lib/constants/hr";
import {
  HiOutlineUserCircle,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiMagnifyingGlass,
  HiOutlineChevronDown,
  HiOutlineChevronRight,
  HiOutlineCheck,
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

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);

  // UX States for permissions
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employment_status: EmploymentStatus.ACTIVE,
    },
  });

  const loadFormData = useCallback(async () => {
    try {
      setLoadingData(true);
      const [employeeData, depts, positionsData, employeesData, rolesData] = await Promise.all([
        getEmployee(id),
        getDepartments({ is_active: true, organization_subdomain: slug }),
        getPositions({ is_active: true }),
        getEmployees(slug),
        getRoles({ is_active: true, organization_subdomain: slug }),
      ]);

      setEmployee(employeeData);
      setDepartments(depts);
      setPositions(positionsData);
      setManagers(employeesData.results.filter(e => e.id !== id)); // Exclure l'employé actuel
      setRoles(rolesData);

      // Set existing custom permissions (using codes)
      if (employeeData.custom_permissions && Array.isArray(employeeData.custom_permissions)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setSelectedPermissions(employeeData.custom_permissions.map((p: any) => p.code));
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
  }, [id, slug, form]);

  useEffect(() => {
    loadFormData();
  }, [id, loadFormData]);

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      setLoading(true);
      setError(null);

      // Build update payload - only include non-empty values
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        employeeData.custom_permission_codes = selectedPermissions;
      }

      await updateEmployee(id, employeeData);
      router.push(`/apps/${slug}/hr/employees/${id}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            <h2 className="text-lg font-semibold mb-4">Informations d&apos;emploi</h2>
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
            <h2 className="text-lg font-semibold mb-4">Contact d&apos;urgence</h2>
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
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
              <div>
                <h2 className="text-lg font-semibold">
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
                <p className="text-sm text-muted-foreground mb-1">
                  {form.watch('role')
                    ? "Les permissions du rôle sont automatiquement incluses (grisées). Vous pouvez ajouter des permissions supplémentaires."
                    : "Sélectionnez un rôle pour voir ses permissions, puis ajoutez des permissions supplémentaires si nécessaire."
                  }
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="relative">
                  <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                  <input 
                    type="text" 
                    placeholder="Rechercher..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries(
                (() => {
                  const filtered = searchTerm 
                    ? AVAILABLE_PERMISSIONS.filter(p => 
                        p.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.code.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                    : AVAILABLE_PERMISSIONS;
                  
                  return filtered.reduce((acc: Record<string, PermissionItem[]>, permission) => {
                    if (!acc[permission.category]) {
                      acc[permission.category] = [];
                    }
                    acc[permission.category].push(permission);
                    return acc;
                  }, {} as Record<string, PermissionItem[]>);
                })()
              ).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune permission trouvée
                </div>
              ) : (
                Object.entries(
                  (() => {
                    const filtered = searchTerm 
                      ? AVAILABLE_PERMISSIONS.filter(p => 
                          p.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.code.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                      : AVAILABLE_PERMISSIONS;
                    
                    return filtered.reduce((acc: Record<string, PermissionItem[]>, permission) => {
                      if (!acc[permission.category]) {
                        acc[permission.category] = [];
                      }
                      acc[permission.category].push(permission);
                      return acc;
                    }, {} as Record<string, PermissionItem[]>);
                  })()
                ).map(([category, permissions]) => {
                  // Get permissions from selected role
                  const selectedRoleObj = roles.find(r => r.id === form.watch('role'));
                  const rolePermissionCodes = selectedRoleObj?.permissions?.map(p => p.code) || [];
                  const isExpanded = expandedCategories[category] !== false || !!searchTerm;

                  const toggleCategoryExpand = () => {
                     setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
                  };

                  const categoryCodes = permissions.map(p => p.code);
                  // Check if all available non-role permissions in this category are selected
                  const availableNonRoleCodes = categoryCodes.filter(c => !rolePermissionCodes.includes(c));
                  const allSelected = availableNonRoleCodes.length > 0 && availableNonRoleCodes.every(c => selectedPermissions.includes(c));
                  const someSelected = availableNonRoleCodes.some(c => selectedPermissions.includes(c));

                  const toggleCategorySelection = () => {
                    if (allSelected) {
                      // Deselect all
                      setSelectedPermissions(prev => prev.filter(c => !availableNonRoleCodes.includes(c)));
                    } else {
                      // Select all
                      setSelectedPermissions(prev => {
                        const newSelected = [...prev];
                        availableNonRoleCodes.forEach(c => {
                          if (!newSelected.includes(c)) newSelected.push(c);
                        });
                        return newSelected;
                      });
                    }
                  };

                  return (
                    <div key={category} className="border rounded-md overflow-hidden">
                      <div className="bg-muted/30 px-4 py-2 flex items-center justify-between hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <button 
                            type="button" 
                            onClick={toggleCategoryExpand}
                            className="text-muted-foreground hover:text-foreground"
                          >
                             {isExpanded ? <HiOutlineChevronDown className="size-4" /> : <HiOutlineChevronRight className="size-4" />}
                          </button>
                          
                          <div className="flex items-center gap-2">
                             <div 
                               className={`size-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                                 availableNonRoleCodes.length === 0 ? "opacity-50 cursor-not-allowed" : ""
                               } ${
                                 allSelected ? "bg-primary border-primary text-primary-foreground" : 
                                 someSelected ? "bg-primary/20 border-primary" : "border-gray-300 bg-background"
                               }`}
                               onClick={availableNonRoleCodes.length > 0 ? toggleCategorySelection : undefined}
                             >
                               {allSelected && <HiOutlineCheck className="size-3" />}
                               {someSelected && !allSelected && <div className="size-2 bg-primary rounded-sm" />}
                             </div>
                             <span 
                               className="font-medium text-sm cursor-pointer select-none"
                               onClick={toggleCategoryExpand}
                             >
                               {category}
                             </span>
                             <span className="text-xs text-muted-foreground ml-2 px-2 py-0.5 bg-background rounded-full border">
                               {permissions.filter((p) => selectedPermissions.includes(p.code) || rolePermissionCodes.includes(p.code)).length}/{permissions.length}
                             </span>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-card">
                          {permissions.map((permission) => {
                            const isFromRole = rolePermissionCodes.includes(permission.code);
                            const isSelected = selectedPermissions.includes(permission.code);
                            
                            return (
                            <div 
                              key={permission.code} 
                              className={`flex items-start gap-2 p-2 rounded-md transition-colors ${
                                isFromRole ? "cursor-default opacity-80" : "cursor-pointer hover:bg-muted/50"
                              } ${
                                isSelected ? "bg-primary/5 border border-primary/20" : ""
                              }`}
                              onClick={() => {
                                if (!isFromRole) {
                                  setSelectedPermissions((prev) =>
                                    prev.includes(permission.code)
                                      ? prev.filter((p) => p !== permission.code)
                                      : [...prev, permission.code]
                                  );
                                }
                              }}
                            >
                              <div className={`mt-0.5 size-4 min-w-4 rounded border flex items-center justify-center transition-colors ${
                                isFromRole ? "border-primary/50 bg-primary/20 text-primary" : 
                                isSelected ? "bg-primary border-primary text-primary-foreground" : "border-gray-300"
                              }`}>
                                {(isSelected || isFromRole) && <HiOutlineCheck className="size-3" />}
                              </div>
                              <div className="text-sm select-none">
                                <p className="font-medium leading-none mb-0.5">{permission.label}</p>
                                {permission.code.includes(searchTerm) && searchTerm && (
                                  <p className="text-xs text-muted-foreground font-mono mt-1">{permission.code}</p>
                                )}
                                {isFromRole && (
                                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                    (du rôle)
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
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
