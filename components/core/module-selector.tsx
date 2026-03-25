'use client';

import { Badge } from '@/components/ui';
import type { Module } from '@/lib/types/core';
import {
  ArrowLeftRight,
  BarChart,
  Calendar,
  Check,
  Clock,
  DollarSign,
  FileText,
  LucideIcon,
  Package,
  Shield,
  ShoppingCart,
  TrendingUp,
  Users,
  Warehouse,
} from 'lucide-react';
import { useState } from 'react';

interface ModuleSelectorProps {
  modules: Module[];
  selectedModules: string[];
  onChange: (selectedModules: string[]) => void;
  disabled?: boolean;
}

// Map icon names to Lucide icons
const iconMap: Record<string, LucideIcon> = {
  Users: Users,
  DollarSign: DollarSign,
  Calendar: Calendar,
  Clock: Clock,
  FileText: FileText,
  Shield: Shield,
  Package: Package,
  Warehouse: Warehouse,
  ShoppingCart: ShoppingCart,
  TrendingUp: TrendingUp,
  ArrowLeftRight: ArrowLeftRight,
  BarChart: BarChart,
};

// Category configurations
const categoryConfig: Record<string, { label: string; color: string; borderColor: string }> = {
  hr: {
    label: 'Ressources Humaines',
    color: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-900',
  },
  inventory: {
    label: 'Gestion des stocks',
    color: 'text-purple-600 dark:text-purple-400',
    borderColor: 'border-purple-200 dark:border-purple-900',
  },
};

export function ModuleSelector({
  modules,
  selectedModules,
  onChange,
  disabled = false,
}: ModuleSelectorProps) {
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);

  // Récupère toutes les dépendances d'un module récursivement
  const getAllDependencies = (moduleCode: string, visited = new Set<string>()): string[] => {
    if (visited.has(moduleCode)) return [];
    visited.add(moduleCode);

    const module = modules.find((m) => m.code === moduleCode);
    if (!module || !module.depends_on || module.depends_on.length === 0) {
      return [];
    }

    const deps: string[] = [];
    for (const dep of module.depends_on) {
      deps.push(dep);
      deps.push(...getAllDependencies(dep, visited));
    }

    return [...new Set(deps)]; // Retirer les doublons
  };

  // Vérifie si un module est requis par d'autres modules sélectionnés
  const isRequiredByOthers = (moduleCode: string): string[] => {
    return selectedModules.filter((selectedCode) => {
      if (selectedCode === moduleCode) return false;
      const module = modules.find((m) => m.code === selectedCode);
      if (!module) return false;

      const allDeps = getAllDependencies(selectedCode);
      return allDeps.includes(moduleCode);
    });
  };

  const toggleModule = (moduleCode: string, isCore: boolean) => {
    if (disabled || isCore) return;

    const isCurrentlySelected = selectedModules.includes(moduleCode);

    if (isCurrentlySelected) {
      // Désactivation : vérifier si d'autres modules actifs dépendent de celui-ci
      const dependentModules = isRequiredByOthers(moduleCode);
      if (dependentModules.length > 0) {
        // Désactiver aussi les modules dépendants
        const toRemove = new Set([moduleCode, ...dependentModules]);
        const newSelection = selectedModules.filter((code) => !toRemove.has(code));
        onChange(newSelection);
      } else {
        // Désactivation simple
        const newSelection = selectedModules.filter((code) => code !== moduleCode);
        onChange(newSelection);
      }
    } else {
      // Activation : ajouter le module et toutes ses dépendances
      const dependencies = getAllDependencies(moduleCode);
      const newSelection = [...new Set([...selectedModules, moduleCode, ...dependencies])];
      onChange(newSelection);
    }
  };

  const isSelected = (moduleCode: string) => selectedModules.includes(moduleCode);

  // Group modules by category
  const groupedModules = modules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, Module[]>);

  return (
    <div className="space-y-8">
      {Object.entries(groupedModules).map(([category, categoryModules]) => {
        const config = categoryConfig[category] || {
          label: category,
          color: 'text-foreground',
          borderColor: 'border-border',
        };

        const categorySelectedCount = categoryModules.filter((m) =>
          isSelected(m.code)
        ).length;

        return (
          <div key={category} className="space-y-4">
            {/* Category Header */}
            <div className={`bg-muted/30 border ${config.borderColor} rounded-lg p-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-background rounded-lg border ${config.borderColor}`}>
                    {category === 'hr' ? (
                      <Users className={`w-5 h-5 ${config.color}`} />
                    ) : (
                      <Package className={`w-5 h-5 ${config.color}`} />
                    )}
                  </div>
                  <div>
                    <h3 className={`text-base font-semibold ${config.color}`}>
                      {config.label}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {categoryModules.length} module{categoryModules.length > 1 ? 's' : ''} disponible{categoryModules.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={categorySelectedCount > 0 ? 'default' : 'outline'}
                  className="text-xs"
                >
                  {categorySelectedCount} / {categoryModules.length}
                </Badge>
              </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoryModules.map((module) => {
                const Icon = iconMap[module.icon] || Package;
                const selected = isSelected(module.code);
                const hovered = hoveredModule === module.code;

                return (
                  <div
                    key={module.code}
                    className={`
                      group relative rounded-lg transition-all duration-200 cursor-pointer p-4
                      ${
                        selected
                          ? 'bg-primary/5 border-2 border-primary'
                          : 'bg-card border border-border hover:border-primary/50'
                      }
                      ${module.is_core ? 'opacity-90' : ''}
                      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    onClick={() => toggleModule(module.code, module.is_core)}
                    onMouseEnter={() => setHoveredModule(module.code)}
                    onMouseLeave={() => setHoveredModule(null)}
                  >
                    <div className="space-y-3">
                      {/* Header with icon and badges */}
                      <div className="flex items-start justify-between">
                        <div
                          className={`
                            p-2.5 rounded-lg transition-colors
                            ${
                              selected
                                ? 'bg-primary text-white'
                                : 'bg-muted text-muted-foreground'
                            }
                          `}
                        >
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {module.is_core && (
                            <Badge
                              variant="outline"
                              className="text-xs border-amber-500/50 text-amber-600 dark:text-amber-400"
                            >
                              Core
                            </Badge>
                          )}
                          <div
                            className={`
                              w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                              ${
                                selected
                                  ? 'border-primary bg-primary'
                                  : 'border-muted-foreground/30'
                              }
                            `}
                          >
                            {selected && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-1.5">
                        <h4 className="font-semibold text-sm text-foreground">
                          {module.name}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {module.description}
                        </p>
                      </div>

                      {/* Dependencies */}
                      {module.depends_on && module.depends_on.length > 0 && (
                        <div className="pt-2 border-t border-border/50">
                          <div className="flex flex-wrap gap-1">
                            {module.depends_on.map((dep) => {
                              const depModule = modules.find((m) => m.code === dep);
                              return (
                                <Badge
                                  key={dep}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  Requiert: {depModule?.name || dep}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Summary Footer */}
      <div className="sticky bottom-0 bg-background pt-4 pb-2 border-t border-border">
        <div className="bg-muted/30 border border-border rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-primary/10 rounded">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {selectedModules.length} module{selectedModules.length > 1 ? 's' : ''} sélectionné{selectedModules.length > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  Les modules obligatoires sont automatiquement inclus
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {selectedModules.length} / {modules.length}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
