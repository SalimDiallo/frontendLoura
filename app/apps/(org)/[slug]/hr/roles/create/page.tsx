"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { createRole } from "@/lib/services/hr/role.service";
import { AVAILABLE_PERMISSIONS, type PermissionItem } from "@/lib/constants/hr";
import {
  HiOutlineShieldCheck,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiMagnifyingGlass,
  HiOutlineCheck,
  HiOutlineChevronDown,
  HiOutlineChevronRight,
} from "react-icons/hi2";

// Schema de validation
const roleSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  code: z.string().min(2, "Le code doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  is_active: z.boolean(),
});

type RoleFormData = z.infer<typeof roleSchema>;

export default function CreateRolePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      is_active: true,
    },
  });

  // Generate code from name automatically
  const nameValue = form.watch("name");

  useEffect(() => {
    if (nameValue) {
      const generatedCode = nameValue
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      form.setValue("code", generatedCode);
    }
  }, [nameValue, form]);

  const onSubmit = async (data: RoleFormData) => {
    try {
      setLoading(true);
      setError(null);

      await createRole({
        ...data,
        permission_codes: selectedPermissions,
      });
      router.push(`/apps/${slug}/hr/roles`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur lors de la création du rôle");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((p) => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  // Filter permissions based on search
  const filteredPermissions = useMemo(() => {
    if (!searchTerm) return AVAILABLE_PERMISSIONS;
    const lowerTerm = searchTerm.toLowerCase();
    return AVAILABLE_PERMISSIONS.filter(
      (p) =>
        p.label.toLowerCase().includes(lowerTerm) ||
        p.category.toLowerCase().includes(lowerTerm) ||
        p.code.toLowerCase().includes(lowerTerm)
    );
  }, [searchTerm]);

  const permissionsByCategory = useMemo(() => {
    return filteredPermissions.reduce((acc: Record<string, PermissionItem[]>, permission: PermissionItem) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, PermissionItem[]>);
  }, [filteredPermissions]);

  // Expand all categories by default or when search changes
  useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    Object.keys(permissionsByCategory).forEach(cat => {
      if (expandedCategories[cat] === undefined || searchTerm) {
        initialExpanded[cat] = true;
      } else {
        initialExpanded[cat] = expandedCategories[cat];
      }
    });
    setExpandedCategories(initialExpanded);
  }, [permissionsByCategory]);

  const toggleCategoryExpand = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleCategorySelection = (category: string) => {
    const categoryPermissions = permissionsByCategory[category] || [];
    const categoryCodes = categoryPermissions.map(p => p.code);
    
    const allSelected = categoryCodes.every(code => selectedPermissions.includes(code));
    
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(code => !categoryCodes.includes(code)));
    } else {
      setSelectedPermissions(prev => {
        const newSelected = [...prev];
        categoryCodes.forEach(code => {
          if (!newSelected.includes(code)) {
            newSelected.push(code);
          }
        });
        return newSelected;
      });
    }
  };

  const selectAll = () => {
    const allCodes = filteredPermissions.map(p => p.code);
    setSelectedPermissions(prev => {
      const newSelected = [...prev];
      allCodes.forEach(code => {
        if (!newSelected.includes(code)) {
          newSelected.push(code);
        }
      });
      return newSelected;
    });
  };

  const deselectAll = () => {
    const allCodes = filteredPermissions.map(p => p.code);
    setSelectedPermissions(prev => prev.filter(code => !allCodes.includes(code)));
  };

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
              Nouveau Rôle
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 ml-10">
            Créer un nouveau rôle avec des permissions
          </p>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

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
              />
            </div>
          </Card>

          {/* Permissions */}
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Permissions ({selectedPermissions.length})
                </h2>
                <p className="text-sm text-muted-foreground">
                  Sélectionnez les permissions à attribuer à ce rôle
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
                <div className="flex bg-muted p-1 rounded-md">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="px-3 py-1 text-xs font-medium rounded hover:bg-background hover:shadow-sm transition-all"
                  >
                    Tout cocher
                  </button>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="px-3 py-1 text-xs font-medium rounded hover:bg-background hover:shadow-sm transition-all text-destructive"
                  >
                    Tout décocher
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries(permissionsByCategory).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune permission trouvée pour "{searchTerm}"
                </p>
              ) : (
                Object.entries(permissionsByCategory).map(([category, permissions]) => {
                  const categoryPermissionCodes = permissions.map((p) => p.code);
                  const allSelected = categoryPermissionCodes.every((p) =>
                    selectedPermissions.includes(p)
                  );
                  const someSelected = categoryPermissionCodes.some((p) =>
                    selectedPermissions.includes(p)
                  );
                  const isExpanded = expandedCategories[category] !== false;

                  return (
                    <div key={category} className="border rounded-md overflow-hidden">
                      <div className="bg-muted/30 px-4 py-2 flex items-center justify-between hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <button 
                            type="button" 
                            onClick={() => toggleCategoryExpand(category)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                             {isExpanded ? <HiOutlineChevronDown className="size-4" /> : <HiOutlineChevronRight className="size-4" />}
                          </button>
                          
                          <div className="flex items-center gap-2">
                             <div 
                               className={`size-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                                 allSelected ? "bg-primary border-primary text-primary-foreground" : 
                                 someSelected ? "bg-primary/20 border-primary" : "border-gray-300 bg-background"
                               }`}
                               onClick={() => toggleCategorySelection(category)}
                             >
                               {allSelected && <HiOutlineCheck className="size-3" />}
                               {someSelected && !allSelected && <div className="size-2 bg-primary rounded-sm" />}
                             </div>
                             <span 
                               className="font-medium text-sm cursor-pointer select-none"
                               onClick={() => toggleCategoryExpand(category)}
                             >
                               {category}
                             </span>
                             <span className="text-xs text-muted-foreground ml-2 px-2 py-0.5 bg-background rounded-full border">
                               {permissions.filter((p) => selectedPermissions.includes(p.code)).length}/{permissions.length}
                             </span>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-card">
                          {permissions.map((permission) => (
                            <div 
                              key={permission.code} 
                              className={`flex items-start gap-2 p-2 rounded-md transition-colors cursor-pointer hover:bg-muted/50 ${
                                selectedPermissions.includes(permission.code) ? "bg-primary/5 border border-primary/20" : ""
                              }`}
                              onClick={() => togglePermission(permission.code)}
                            >
                              <div className={`mt-0.5 size-4 min-w-4 rounded border flex items-center justify-center transition-colors ${
                                selectedPermissions.includes(permission.code) ? "bg-primary border-primary text-primary-foreground" : "border-gray-300"
                              }`}>
                                {selectedPermissions.includes(permission.code) && <HiOutlineCheck className="size-3" />}
                              </div>
                              <div className="text-sm select-none">
                                <p className="font-medium leading-none mb-0.5">{permission.label}</p>
                                {permission.code.includes(searchTerm) && searchTerm && (
                                  <p className="text-xs text-muted-foreground font-mono mt-1">{permission.code}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Statut */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Statut</h2>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                {...form.register("is_active")}
                className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
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
                Annuler
              </Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>Création en cours...</>
              ) : (
                <>
                  <HiOutlineCheckCircle className="size-4 mr-2" />
                  Créer le rôle
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
