"use client";

import { PermissionSelector } from "@/components/apps/hr/permission-selector";
import { Alert, Badge, Button, Card, Form } from "@/components/ui";
import { FormInputField, FormSelectField, FormTextareaField } from "@/components/ui/form-fields";
import { AVAILABLE_PERMISSIONS } from "@/lib/constants/permissions-data-label";
import { getDepartments } from "@/lib/services/hr/department.service";
import { invitationService } from "@/lib/services/hr/invitation.service";
import { getPositions } from "@/lib/services/hr/position.service";
import { getRoles } from "@/lib/services/hr/role.service";
import type { Department, EmployeeInvitationCreate, Position, Role } from "@/lib/types/hr";
import { cn } from "@/lib/utils";
import { formatApiErrorsForDisplay } from "@/lib/utils/format-api-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlinePaperAirplane,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import * as z from "zod";

// Validation schema
const invitationSchema = z.object({
  email: z.string().email("Email invalide"),
  role_id: z.string().min(1, "Le rôle est requis"),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  department_id: z.string().optional(),
  position_id: z.string().optional(),
  invitation_message: z.string().optional(),
});

type InvitationFormData = z.infer<typeof invitationSchema>;

export default function InviteEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Array<{ field: string; messages: string[] }>>([]);
  const [errorTitle, setErrorTitle] = useState<string>("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const form = useForm<InvitationFormData>({
    resolver: zodResolver(invitationSchema),
  });

  const selectedRoleId = form.watch('role_id');

  // Get role permission codes for the selected role
  const rolePermissionCodes = useMemo(() => {
    if (!selectedRoleId) return [];
    const role = roles.find(r => r.id === selectedRoleId);
    return role?.permissions?.map(p => p.code) || [];
  }, [selectedRoleId, roles]);

  // Transform data to SelectOption format
  const departmentOptions = useMemo(
    () => departments.map((dept) => ({ value: dept.id, label: dept.name })),
    [departments]
  );

  const positionOptions = useMemo(
    () => positions.map((pos) => ({ value: pos.id, label: pos.title })),
    [positions]
  );

  // Load departments, positions, and roles
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        console.log('[InvitePage] Starting data load with slug:', slug);

        // Load data independently to avoid one failure blocking others
        const [deptResult, posResult, roleResult] = await Promise.allSettled([
          getDepartments({ organization_subdomain: slug }),
          getPositions({ organization_subdomain: slug }),
          getRoles({ organization_subdomain: slug }),
        ]);

        // Extract successful results
        const deptData = deptResult.status === 'fulfilled' ? deptResult.value : [];
        const posData = posResult.status === 'fulfilled' ? posResult.value : [];
        const roleData = roleResult.status === 'fulfilled' ? roleResult.value : [];

        // Log errors
        if (deptResult.status === 'rejected') {
          console.error('[InvitePage] Departments error:', deptResult.reason);
        }
        if (posResult.status === 'rejected') {
          console.error('[InvitePage] Positions error:', posResult.reason);
        }
        if (roleResult.status === 'rejected') {
          console.error('[InvitePage] Roles error:', roleResult.reason);
        }

        console.log('[InvitePage] Data loaded:', {
          departments: deptData?.length || 0,
          positions: posData?.length || 0,
          roles: roleData?.length || 0,
        });
        console.log('[InvitePage] Roles data:', roleData);

        setDepartments(deptData || []);
        setPositions(posData || []);
        setRoles(roleData || []);
      } catch (error) {
        console.error("[InvitePage] Error loading data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [slug]);

  const onSubmit = async (data: InvitationFormData) => {
    try {
      setLoading(true);
      setErrors([]);
      setErrorTitle("");
      setSuccessMessage("");

      const invitationData: EmployeeInvitationCreate = {
        email: data.email,
        role_id: data.role_id,
        first_name: data.first_name,
        last_name: data.last_name,
        department_id: data.department_id,
        position_id: data.position_id,
        invitation_message: data.invitation_message,
      };

      // Add custom permissions if any selected
      if (selectedPermissions.length > 0) {
        invitationData.custom_permission_codes = selectedPermissions;
      }

      await invitationService.create(invitationData);

      setSuccessMessage(`Invitation envoyée à ${data.email} avec succès !`);

      // Reset form
      form.reset();

      // Redirect to invitations list after 2 seconds
      setTimeout(() => {
        router.push(`/apps/${slug}/hr/employees/invitations`);
      }, 2000);
    } catch (error: any) {
      console.error("Error creating invitation:", error);

      const formattedErrors = formatApiErrorsForDisplay(error);
      setErrorTitle(formattedErrors.title);
      setErrors(formattedErrors.errors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inviter un employé</h1>
          <p className="mt-1 text-sm text-gray-500">
            Envoyez une invitation par email pour créer un compte employé
          </p>
        </div>
        <Link href={`/apps/${slug}/hr/employees`}>
          <Button variant="outline" size="sm">
            <HiOutlineArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </Link>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert variant="success">
          <HiOutlineCheckCircle className="h-5 w-5" />
          <div>
            <h3 className="font-semibold">Invitation envoyée</h3>
            <p className="text-sm">{successMessage}</p>
            <p className="mt-1 text-xs opacity-80">
              Redirection vers la liste des invitations...
            </p>
          </div>
        </Alert>
      )}

      {/* Error Alert */}
      {errors.length > 0 && (
        <Alert variant="error">
          <div>
            <h3 className="font-semibold">{errorTitle || "Erreur"}</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {errors.map((error, index) => (
                <li key={index}>
                  <strong>{error.field}:</strong> {error.messages.join(", ")}
                </li>
              ))}
            </ul>
          </div>
        </Alert>
      )}

      {/* Form Card */}
      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Section */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Email de l'employé
                </h2>
              </div>

              <FormInputField
                name="email"
                label="Email *"
                type="email"
                placeholder="employee@example.com"
                description="L'employé recevra l'invitation à cette adresse"
              />
            </div>

            {/* Role Selection Section */}
            <div className="space-y-4 border-t pt-6">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <HiOutlineShieldCheck className="size-5 text-primary" />
                  Rôle et Permissions
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Sélectionnez un rôle à attribuer à l'employé
                </p>
              </div>

              {/* Role Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => form.setValue('role_id', role.id)}
                    disabled={loadingData}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all",
                      selectedRoleId === role.id
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-gray-200 hover:border-primary/50 hover:bg-gray-50",
                      loadingData && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "size-10 rounded-full flex items-center justify-center",
                        selectedRoleId === role.id ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
                      )}>
                        <HiOutlineShieldCheck className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{role.name}</p>
                        <p className="text-xs text-gray-500">
                          {role.permissions?.length || role.permission_count || 0} permissions
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Display selected role permissions */}
              {selectedRoleId && rolePermissionCodes.length > 0 && (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    Permissions incluses
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {rolePermissionCodes.slice(0, 12).map((code) => {
                      const perm = AVAILABLE_PERMISSIONS.find(p => p.code === code);
                      return (
                        <Badge key={code} variant="outline" className="text-xs bg-white">
                          {perm?.label || code}
                        </Badge>
                      );
                    })}
                    {rolePermissionCodes.length > 12 && (
                      <Badge variant="secondary" className="text-xs">
                        +{rolePermissionCodes.length - 12} autres
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {loadingData && (
                <div className="text-center text-sm text-gray-500 py-4">
                  Chargement des rôles...
                </div>
              )}

              {/* Custom Permissions */}
              <div>
                <h3 className="text-sm font-medium mb-3">
                  Permissions supplémentaires
                  <span className="ml-2 text-gray-500 font-normal">
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
            </div>

            {/* Optional Section */}
            <div className="space-y-4 border-t pt-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Informations optionnelles
                </h2>
                <p className="text-sm text-gray-500">
                  Ces informations peuvent être remplies par l'employé lors de l'acceptation
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormInputField
                  name="first_name"
                  label="Prénom"
                  placeholder="Jean"
                />

                <FormInputField
                  name="last_name"
                  label="Nom"
                  placeholder="Dupont"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormSelectField
                  name="department_id"
                  label="Département"
                  placeholder="Sélectionner un département"
                  options={departmentOptions}
                  disabled={loadingData}
                />

                <FormSelectField
                  name="position_id"
                  label="Poste"
                  placeholder="Sélectionner un poste"
                  options={positionOptions}
                  disabled={loadingData}
                />
              </div>

              <FormTextareaField
                name="invitation_message"
                label="Message personnalisé"
                placeholder="Bienvenue dans l'équipe ! Nous sommes ravis de vous accueillir..."
                rows={4}
                description="Ce message sera inclus dans l'email d'invitation"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t pt-6">
              <Link href={`/apps/${slug}/hr/employees`}>
                <Button type="button" variant="outline" disabled={loading}>
                  Annuler
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                <HiOutlinePaperAirplane className="mr-2 h-4 w-4" />
                Envoyer l'invitation
              </Button>
            </div>
          </form>
        </Form>
      </Card>

      {/* Info Box */}
      <Card className="border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3">
          <HiOutlineCheckCircle className="h-5 w-5 flex-shrink-0 text-blue-600" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold">Comment fonctionne l'invitation ?</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>L'employé reçoit un email avec un lien sécurisé</li>
              <li>Le lien est valide pendant 7 jours</li>
              <li>L'employé crée son mot de passe et complète son profil</li>
              <li>Le compte est activé automatiquement après acceptation</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
