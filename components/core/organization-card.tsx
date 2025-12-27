"use client";

import { useState, useRef } from "react";
import type { Organization } from "@/lib/types/core";
import { Badge, Button } from "@/components/ui";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { organizationService } from "@/lib/services/core";
import { API_CONFIG } from "@/lib/api/config";
import {
  HiOutlineArrowRight,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlinePower,
  HiOutlineCalendar,
  HiOutlineCurrencyDollar,
  HiOutlineEllipsisVertical,
  HiOutlinePhoto,
} from "react-icons/hi2";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface OrganizationCardProps {
  organization: Organization;
  onEdit?: (org: Organization) => void;
  onDelete?: (org: Organization) => void;
  onToggleActive?: (org: Organization) => void;
  onLogoUpdate?: (org: Organization) => void;
}

export function OrganizationCard({
  organization,
  onEdit,
  onDelete,
  onToggleActive,
  onLogoUpdate,
}: OrganizationCardProps) {
  const isActive = organization.is_active;
  const [uploading, setUploading] = useState(false);
  const [localOrg, setLocalOrg] = useState(organization);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const logoUrl = localOrg.logo 
    ? (localOrg.logo.startsWith('http') ? localOrg.logo : `${API_CONFIG.baseURL}/media/${localOrg.logo}`)
    : null;

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      alert('Format non supporté. Utilisez JPG, PNG, GIF, WebP ou SVG.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Fichier trop volumineux (max 5 Mo)');
      return;
    }

    try {
      setUploading(true);
      const result = await organizationService.uploadLogo(localOrg.id, file);
      setLocalOrg(result.organization);
      if (onLogoUpdate) onLogoUpdate(result.organization);
    } catch (err) {
      console.error("Error uploading logo:", err);
      alert('Erreur lors de l\'upload du logo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteLogo = async () => {
    if (!logoUrl) return;
    
    try {
      setUploading(true);
      await organizationService.deleteLogo(localOrg.id);
      setLocalOrg({ ...localOrg, logo: null });
      if (onLogoUpdate) onLogoUpdate({ ...localOrg, logo: null });
    } catch (err) {
      console.error("Error deleting logo:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="group relative overflow-hidden border bg-background hover:border-foreground/20 transition-colors">
      <div className="p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Logo/Avatar avec upload */}
            <div 
              className="relative flex size-12 items-center justify-center rounded-xl bg-muted font-semibold text-lg text-foreground overflow-hidden cursor-pointer group/logo"
              onClick={handleLogoClick}
            >
              {uploading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : logoUrl ? (
                <img
                  src={logoUrl}
                  alt={localOrg.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                organization.name.charAt(0).toUpperCase()
              )}
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="size-4 text-white" />
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground truncate">
                {organization.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-muted-foreground font-mono">
                  {organization.subdomain}
                </span>
              </div>
            </div>
          </div>

          {/* Status Badge & Menu */}
          <div className="flex items-center gap-1.5">
            <Badge
              variant={isActive ? "success" : "outline"}
              className="text-xs"
            >
              {isActive ? "Active" : "Inactif"}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 transition-opacity"
                  aria-label="Ouvrir les actions"
                >
                  <HiOutlineEllipsisVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={handleLogoClick}
                  className="gap-2"
                >
                  <HiOutlinePhoto className="size-4" />
                  {logoUrl ? "Changer le logo" : "Ajouter un logo"}
                </DropdownMenuItem>
                {logoUrl && (
                  <DropdownMenuItem
                    onClick={handleDeleteLogo}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <X className="size-4" />
                    Supprimer le logo
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onEdit && (
                  <DropdownMenuItem
                    onClick={() => onEdit(organization)}
                    className="gap-2"
                  >
                    <HiOutlinePencilSquare className="size-4" />
                    Modifier
                  </DropdownMenuItem>
                )}
                {onToggleActive && (
                  <DropdownMenuItem
                    onClick={() => onToggleActive(organization)}
                    className="gap-2"
                  >
                    <HiOutlinePower className="size-4" />
                    {isActive ? "Désactiver" : "Activer"}
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(organization)}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <HiOutlineTrash className="size-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-3 items-center mb-4 text-xs text-muted-foreground">
          {organization.category_details && (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-foreground text-xs font-medium">
                {organization.category_details.name}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <HiOutlineCurrencyDollar className="size-3.5" />
            <span>{organization.settings.currency}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <HiOutlineCalendar className="size-3.5" />
            <span suppressHydrationWarning>
              {new Date(organization.created_at).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        <div className="mt-auto flex items-end">
          <Link
            href={`/apps/${organization.subdomain}/dashboard`}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={-1}
            className="block w-full"
          >
            <Button
              variant="outline"
              className="w-full justify-between"
            >
              Accéder au dashboard
              <HiOutlineArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
