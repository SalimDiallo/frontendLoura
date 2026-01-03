"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Alert, Button, Card, Form } from "@/components/ui";
import {
  FormInputField,
  FormTextareaField,
} from "@/components/ui/form-fields";
import {
  getRole,
  updateRole,
} from "@/lib/services/hr/role.service";
import type { Role } from "@/lib/types/hr";
import { AVAILABLE_PERMISSIONS } from "@/lib/constants/hr";
import { PermissionSelector } from "@/components/apps/hr/permission-selector";
import {
  HiOutlineShieldCheck,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

const roleSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  code: z.string().min(2, "Le code doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  is_active: z.boolean(),
});

type RoleFormData = z.infer<typeof roleSchema>;

export default function EditRolePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [role, setRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      is_active: true,
    },
  });

  const loadFormData = useCallback(async () => {
    try {
      setLoadingData(true);
      const roleData = await getRole(id);

      setRole(roleData);
      // Extract permission codes from permission objects
      const permissionCodes = roleData.permissions?.map(p => p.code) || [];
      setSelectedPermissions(permissionCodes);

      form.reset({
        name: roleData.name,
        code: roleData.code,
        description: roleData.description || "",
        is_active: roleData.is_active,
      });
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err);
      setError("Erreur lors du chargement des données du formulaire");
    } finally {
      setLoadingData(false);
    }
  }, [id, form]);

  useEffect(() => {
    loadFormData();
  }, [id, loadFormData]);

  const onSubmit = async (data: RoleFormData) => {
    // Prevent submission for system roles
    if (role?.is_system_role) {
      setError("Les rôles système ne peuvent pas être modifiés");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await updateRole(id, {
        ...data,
        permission_codes: selectedPermissions,
      });
      router.push(`/apps/${slug}/hr/roles`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur lors de la mise à jour du rôle");
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

  if (!role) {
    return (
      <div className="space-y-6">
        <Alert variant="error">Rôle non trouvé</Alert>
        <Button asChild>
          <Link href={`/apps/${slug}/hr/roles`}>
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
              <Link href={`/apps/${slug}/hr/roles`}>
                <HiOutlineArrowLeft className="size-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <HiOutlineShieldCheck className="size-7" />
              Modifier Rôle
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 ml-10">
            {role.name}
          </p>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {role.is_system_role && (
        <Alert variant="warning">
          Ce rôle est un rôle système et ne peut pas être modifié. Les rôles système sont prédéfinis et protégés.
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Informations générales */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Informations générales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInputField
                name="name"
                label="Nom du rôle"
                placeholder="Ex: Responsable RH"
                required
                disabled={role.is_system_role}
              />
              <FormInputField
                name="code"
                label="Code (généré automatiquement)"
                placeholder="Ex: HR_MANAGER"
                required
                disabled
                className="bg-muted"
              />
              <FormTextareaField
                className="md:col-span-2"
                name="description"
                label="Description"
                placeholder="Description du rôle..."
                rows={3}
                disabled={role.is_system_role}
              />
            </div>
          </Card>

          {/* Permissions avec le nouveau composant */}
          <Card className="p-6 border-0 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">
                Permissions
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({selectedPermissions.length} sélectionnées)
                </span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {role.is_system_role
                  ? "Permissions du rôle système (non modifiables)"
                  : "Sélectionnez les permissions à attribuer à ce rôle"}
              </p>
            </div>

            {role.is_system_role ? (
              // Affichage simple pour les rôles système
              <div className="flex flex-wrap gap-2">
                {selectedPermissions.map((code) => {
                  const perm = AVAILABLE_PERMISSIONS.find(p => p.code === code);
                  return (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium"
                    >
                      {perm?.label || code}
                    </span>
                  );
                })}
                {selectedPermissions.length === 0 && (
                  <p className="text-muted-foreground text-sm">Aucune permission</p>
                )}
              </div>
            ) : (
              <PermissionSelector
                permissions={AVAILABLE_PERMISSIONS}
                selectedPermissions={selectedPermissions}
                onSelectionChange={setSelectedPermissions}
                maxHeight="450px"
              />
            )}
          </Card>

          {/* Statut */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Statut</h2>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                {...form.register("is_active")}
                disabled={role.is_system_role}
                className="size-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <label htmlFor="is_active" className="text-sm font-medium">
                Rôle actif
              </label>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href={`/apps/${slug}/hr/roles`}>
                {role.is_system_role ? "Retour" : "Annuler"}
              </Link>
            </Button>
            {!role.is_system_role && (
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
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
