"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  HiOutlineCheck,
  HiOutlineChevronDown,
  HiOutlineChevronRight,
  HiOutlineMagnifyingGlass,
  HiOutlineUserGroup,
  HiOutlineCube,
} from "react-icons/hi2";
import { LuLock } from "react-icons/lu";
import { LucideUnlock } from "lucide-react";

// ============================================
// Types
// ============================================

export interface PermissionItem {
  code: string;
  label: string;
  category: string;
  module: "hr" | "inventory";
}

interface PermissionSelectorProps {
  /** All available permissions */
  permissions: PermissionItem[];
  /** Currently selected permission codes */
  selectedPermissions: string[];
  /** Callback when selection changes */
  onSelectionChange: (codes: string[]) => void;
  /** Permission codes from role (locked, cannot be toggled) */
  rolePermissionCodes?: string[];
  /** Whether to show module-level grouping (default: true) */
  groupByModule?: boolean;
  /** Max height for the container */
  maxHeight?: string;
  /** Compact mode for smaller forms */
  compact?: boolean;
}

// ============================================
// Module Configuration
// ============================================

const MODULE_CONFIG = {
  hr: {
    label: "Ressources Humaines",
    icon: HiOutlineUserGroup,
    color: "blue",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    textColor: "text-blue-700 dark:text-blue-300",
    iconColor: "text-blue-500",
  },
  inventory: {
    label: "Inventaire & Ventes",
    icon: HiOutlineCube,
    color: "emerald",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    textColor: "text-emerald-700 dark:text-emerald-300",
    iconColor: "text-emerald-500",
  },
} as const;

// ============================================
// Sub-components
// ============================================

interface PermissionCheckboxProps {
  permission: PermissionItem;
  isSelected: boolean;
  isFromRole: boolean;
  onToggle: () => void;
  compact?: boolean;
}

function PermissionCheckbox({
  permission,
  isSelected,
  isFromRole,
  onToggle,
  compact,
}: PermissionCheckboxProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isFromRole}
      className={cn(
        "flex items-center gap-2 rounded-lg text-left transition-all w-full",
        compact ? "p-2 text-xs" : "p-3",
        isFromRole
          ? "bg-blue-50/50 dark:bg-blue-950/20 cursor-not-allowed opacity-70"
          : isSelected
            ? "bg-primary/5 ring-1 ring-primary/30 hover:bg-primary/10"
            : "bg-muted/30 hover:bg-muted/60"
      )}
    >
      {/* Checkbox */}
      <div
        className={cn(
          "shrink-0 rounded border-2 flex items-center justify-center transition-all",
          compact ? "size-4" : "size-5",
          isFromRole
            ? "bg-blue-500 border-blue-500 text-white"
            : isSelected
              ? "bg-primary border-primary text-white"
              : "border-muted-foreground/30"
        )}
      >
        {(isSelected || isFromRole) && (
          <HiOutlineCheck className={compact ? "size-2.5" : "size-3"} />
        )}
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-medium truncate",
            compact ? "text-xs" : "text-sm",
            isFromRole && "text-blue-700 dark:text-blue-300"
          )}
        >
          {permission.label}
        </p>
        {isFromRole && (
          <span className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <LuLock className="size-2.5" />
            Du rôle
          </span>
        )}
      </div>
    </button>
  );
}

interface CategoryGroupProps {
  category: string;
  permissions: PermissionItem[];
  selectedPermissions: string[];
  rolePermissionCodes: string[];
  onToggle: (code: string) => void;
  onToggleAll: () => void;
  isExpanded: boolean;
  onExpandToggle: () => void;
  compact?: boolean;
}

function CategoryGroup({
  category,
  permissions,
  selectedPermissions,
  rolePermissionCodes,
  onToggle,
  onToggleAll,
  isExpanded,
  onExpandToggle,
  compact,
}: CategoryGroupProps) {
  const nonRolePerms = permissions.filter(
    (p) => !rolePermissionCodes.includes(p.code)
  );
  const selectedCount = permissions.filter(
    (p) =>
      selectedPermissions.includes(p.code) || rolePermissionCodes.includes(p.code)
  ).length;
  const allNonRoleSelected =
    nonRolePerms.length > 0 &&
    nonRolePerms.every((p) => selectedPermissions.includes(p.code));
  const someSelected = nonRolePerms.some((p) =>
    selectedPermissions.includes(p.code)
  );

  return (
    <div className="border-b border-border/50 last:border-b-0">
      {/* Category Header */}
      <button
        type="button"
        onClick={onExpandToggle}
        className={cn(
          "w-full flex items-center justify-between transition-colors",
          compact ? "px-3 py-2" : "px-4 py-3",
          "hover:bg-muted/30",
          isExpanded && "bg-muted/20"
        )}
      >
        <div className="flex items-center gap-2">
          {/* Expand icon */}
          {isExpanded ? (
            <HiOutlineChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <HiOutlineChevronRight className="size-4 text-muted-foreground" />
          )}

          {/* Category checkbox */}
          <div
            role="checkbox"
            aria-checked={allNonRoleSelected}
            onClick={(e) => {
              e.stopPropagation();
              onToggleAll();
            }}
            className={cn(
              "size-4 rounded border-2 flex items-center justify-center cursor-pointer transition-all",
              nonRolePerms.length === 0 && "opacity-50 cursor-not-allowed",
              allNonRoleSelected
                ? "bg-primary border-primary text-white"
                : someSelected
                  ? "bg-primary/30 border-primary"
                  : "border-muted-foreground/30 hover:border-primary"
            )}
          >
            {allNonRoleSelected && <HiOutlineCheck className="size-2.5" />}
            {someSelected && !allNonRoleSelected && (
              <div className="size-1.5 bg-primary rounded-sm" />
            )}
          </div>

          <span className={cn("font-medium", compact ? "text-xs" : "text-sm")}>
            {category}
          </span>

          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {selectedCount}/{permissions.length}
          </Badge>
        </div>
      </button>

      {/* Permissions Grid */}
      {isExpanded && (
        <div
          className={cn(
            "grid gap-2",
            compact
              ? "grid-cols-1 sm:grid-cols-2 p-2"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-3"
          )}
        >
          {permissions.map((permission) => (
            <PermissionCheckbox
              key={permission.code}
              permission={permission}
              isSelected={selectedPermissions.includes(permission.code)}
              isFromRole={rolePermissionCodes.includes(permission.code)}
              onToggle={() => onToggle(permission.code)}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function PermissionSelector({
  permissions,
  selectedPermissions,
  onSelectionChange,
  rolePermissionCodes = [],
  // groupByModule is always true for now
  maxHeight = "500px",
  compact = false,
}: PermissionSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    hr: true,
    inventory: true,
  });
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});

  // Filter permissions based on search
  const filteredPermissions = useMemo(() => {
    if (!searchTerm.trim()) return permissions;
    const term = searchTerm.toLowerCase();
    return permissions.filter(
      (p) =>
        p.label.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term)
    );
  }, [permissions, searchTerm]);

  // Group by module, then by category
  const groupedPermissions = useMemo(() => {
    const byModule: Record<string, Record<string, PermissionItem[]>> = {};

    filteredPermissions.forEach((perm) => {
      if (!byModule[perm.module]) {
        byModule[perm.module] = {};
      }
      if (!byModule[perm.module][perm.category]) {
        byModule[perm.module][perm.category] = [];
      }
      byModule[perm.module][perm.category].push(perm);
    });

    return byModule;
  }, [filteredPermissions]);

  // Toggle handlers
  const togglePermission = (code: string) => {
    if (rolePermissionCodes.includes(code)) return;
    const newSelection = selectedPermissions.includes(code)
      ? selectedPermissions.filter((c) => c !== code)
      : [...selectedPermissions, code];
    onSelectionChange(newSelection);
  };

  const toggleCategory = (categoryPermissions: PermissionItem[]) => {
    const nonRolePerms = categoryPermissions.filter(
      (p) => !rolePermissionCodes.includes(p.code)
    );
    const allSelected = nonRolePerms.every((p) =>
      selectedPermissions.includes(p.code)
    );

    if (allSelected) {
      onSelectionChange(
        selectedPermissions.filter(
          (c) => !nonRolePerms.map((p) => p.code).includes(c)
        )
      );
    } else {
      const newCodes = nonRolePerms
        .map((p) => p.code)
        .filter((c) => !selectedPermissions.includes(c));
      onSelectionChange([...selectedPermissions, ...newCodes]);
    }
  };

  const toggleModule = (module: string) => {
    const modulePerms = Object.values(groupedPermissions[module] || {}).flat();
    const nonRolePerms = modulePerms.filter(
      (p) => !rolePermissionCodes.includes(p.code)
    );
    const allSelected = nonRolePerms.every((p) =>
      selectedPermissions.includes(p.code)
    );

    if (allSelected) {
      onSelectionChange(
        selectedPermissions.filter(
          (c) => !nonRolePerms.map((p) => p.code).includes(c)
        )
      );
    } else {
      const newCodes = nonRolePerms
        .map((p) => p.code)
        .filter((c) => !selectedPermissions.includes(c));
      onSelectionChange([...selectedPermissions, ...newCodes]);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = permissions.length;
    const fromRole = rolePermissionCodes.length;
    const custom = selectedPermissions.length;
    const active = new Set([...rolePermissionCodes, ...selectedPermissions]).size;
    return { total, fromRole, custom, active };
  }, [permissions, rolePermissionCodes, selectedPermissions]);

  return (
    <div className="space-y-4">
      {/* Header with search and stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="default" className="px-2">
              {stats.active}
            </Badge>
            <span className="text-muted-foreground">actives</span>
          </div>
          {stats.fromRole > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400">
              <LuLock className="size-3" />
              <span>{stats.fromRole} du rôle</span>
            </div>
          )}
          {stats.custom > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
              <LucideUnlock className="size-3" />
              <span>{stats.custom} custom</span>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Modules */}
      <div
        className="border rounded-xl overflow-hidden"
        style={{ maxHeight }}
      >
        <div className="overflow-y-auto" style={{ maxHeight }}>
          {Object.entries(groupedPermissions).map(([module, categories]) => {
            const config = MODULE_CONFIG[module as keyof typeof MODULE_CONFIG];
            if (!config) return null;

            const Icon = config.icon;
            const isModuleExpanded = expandedModules[module] !== false;

            const modulePerms = Object.values(categories).flat();
            const nonRolePerms = modulePerms.filter(
              (p) => !rolePermissionCodes.includes(p.code)
            );
            const allModuleSelected =
              nonRolePerms.length > 0 &&
              nonRolePerms.every((p) => selectedPermissions.includes(p.code));
            const someModuleSelected = nonRolePerms.some((p) =>
              selectedPermissions.includes(p.code)
            );
            const moduleSelectedCount = modulePerms.filter(
              (p) =>
                selectedPermissions.includes(p.code) ||
                rolePermissionCodes.includes(p.code)
            ).length;

            return (
              <div key={module} className="border-b border-border last:border-b-0">
                {/* Module Header */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedModules((prev) => ({
                      ...prev,
                      [module]: !prev[module],
                    }))
                  }
                  className={cn(
                    "w-full flex items-center justify-between transition-colors",
                    compact ? "px-3 py-2" : "px-4 py-3",
                    config.bgColor
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Expand icon */}
                    {isModuleExpanded ? (
                      <HiOutlineChevronDown
                        className={cn("size-5", config.iconColor)}
                      />
                    ) : (
                      <HiOutlineChevronRight
                        className={cn("size-5", config.iconColor)}
                      />
                    )}

                    {/* Module checkbox */}
                    <div
                      role="checkbox"
                      aria-checked={allModuleSelected}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleModule(module);
                      }}
                      className={cn(
                        "size-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all",
                        allModuleSelected
                          ? "bg-primary border-primary text-white"
                          : someModuleSelected
                            ? "bg-primary/30 border-primary"
                            : "border-muted-foreground/40 hover:border-primary bg-white dark:bg-background"
                      )}
                    >
                      {allModuleSelected && <HiOutlineCheck className="size-3" />}
                      {someModuleSelected && !allModuleSelected && (
                        <div className="size-2 bg-primary rounded-sm" />
                      )}
                    </div>

                    {/* Module Icon & Label */}
                    <Icon className={cn("size-5", config.iconColor)} />
                    <span
                      className={cn(
                        "font-semibold",
                        config.textColor,
                        compact ? "text-sm" : "text-base"
                      )}
                    >
                      {config.label}
                    </span>

                    <Badge
                      variant="outline"
                      className={cn("text-xs", config.borderColor)}
                    >
                      {moduleSelectedCount}/{modulePerms.length}
                    </Badge>
                  </div>
                </button>

                {/* Categories */}
                {isModuleExpanded && (
                  <div className="bg-card">
                    {Object.entries(categories).map(([category, perms]) => {
                      const categoryKey = `${module}-${category}`;
                      const isCategoryExpanded =
                        expandedCategories[categoryKey] !== false || !!searchTerm;

                      return (
                        <CategoryGroup
                          key={categoryKey}
                          category={category}
                          permissions={perms}
                          selectedPermissions={selectedPermissions}
                          rolePermissionCodes={rolePermissionCodes}
                          onToggle={togglePermission}
                          onToggleAll={() => toggleCategory(perms)}
                          isExpanded={isCategoryExpanded}
                          onExpandToggle={() =>
                            setExpandedCategories((prev) => ({
                              ...prev,
                              [categoryKey]: !prev[categoryKey],
                            }))
                          }
                          compact={compact}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {Object.keys(groupedPermissions).length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <HiOutlineMagnifyingGlass className="size-12 mx-auto mb-3 opacity-30" />
              <p>Aucune permission trouvée</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PermissionSelector;
