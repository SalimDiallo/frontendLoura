'use client';

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

interface ModuleSelectorProps {
  modules: Module[];
  selectedModules: string[];
  onChange: (selectedModules: string[]) => void;
  disabled?: boolean;
}

// Mapping icons
const iconMap: Record<string, LucideIcon> = {
  Users,
  DollarSign,
  Calendar,
  Clock,
  FileText,
  Shield,
  Package,
  Warehouse,
  ShoppingCart,
  TrendingUp,
  ArrowLeftRight,
  BarChart,
};

// Sobriété : couleurs neutres, typographie plus discrète, moins de badges, design épuré
const categoryConfig: Record<string, { label: string; borderColor: string }> = {
  hr: {
    label: 'Ressources Humaines',
    borderColor: 'border-border',
  },
  inventory: {
    label: 'Gestion des stocks',
    borderColor: 'border-border',
  },
};

export function ModuleSelector({
  modules,
  selectedModules,
  onChange,
  disabled = false,
}: ModuleSelectorProps) {
  // Plus de hover visuel : comportement sobre
  // Enlève la colorisation vive, effet réduit
  // Icône et "core" plus sobres

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

    return [...new Set(deps)];
  };

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
      const dependentModules = isRequiredByOthers(moduleCode);
      if (dependentModules.length > 0) {
        const toRemove = new Set([moduleCode, ...dependentModules]);
        const newSelection = selectedModules.filter((code) => !toRemove.has(code));
        onChange(newSelection);
      } else {
        const newSelection = selectedModules.filter((code) => code !== moduleCode);
        onChange(newSelection);
      }
    } else {
      const dependencies = getAllDependencies(moduleCode);
      const newSelection = [...new Set([...selectedModules, moduleCode, ...dependencies])];
      onChange(newSelection);
    }
  };

  const isSelected = (moduleCode: string) => selectedModules.includes(moduleCode);

  const groupedModules = modules.reduce((acc, module) => {
    if (!acc[module.category]) acc[module.category] = [];
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, Module[]>);

  return (
    <div className="space-y-10">
      {Object.entries(groupedModules).map(([category, categoryModules]) => {
        const config = categoryConfig[category] || {
          label: category,
          borderColor: 'border-border',
        };

        const categorySelectedCount = categoryModules.filter((m) =>
          isSelected(m.code)
        ).length;

        return (
          <div key={category} className="space-y-3">
            <div className={`border ${config.borderColor} rounded-lg p-4 bg-background`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 bg-muted rounded-lg border ${config.borderColor}`}>
                    {category === 'hr' ? (
                      <Users className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <Package className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground">{config.label}</h3>
                    <p className="text-xs text-muted-foreground">
                      {categoryModules.length} module{categoryModules.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {categorySelectedCount} / {categoryModules.length}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categoryModules.map((module) => {
                const Icon = iconMap[module.icon] || Package;
                const selected = isSelected(module.code);

                return (
                  <div
                    key={module.code}
                    className={`
                      rounded-lg transition-all duration-200 cursor-pointer p-4 border
                      ${selected ? 'border-primary bg-muted' : 'border-border bg-background'}
                      ${module.is_core ? 'opacity-90' : ''}
                      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    onClick={() => toggleModule(module.code, module.is_core)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="p-2 rounded-lg bg-muted">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      {module.is_core && (
                        <span className="ml-2 px-2 py-0.5 text-xs rounded border border-amber-200 text-amber-700 bg-amber-50">
                          Core
                        </span>
                      )}
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center mb-1">
                        <h4 className="font-medium text-sm text-foreground">
                          {module.name}
                        </h4>
                        <span
                          className={`
                            ml-2 w-4 h-4 flex items-center justify-center rounded-full border
                            ${selected ? 'border-primary bg-primary' : 'border-border'}
                          `}
                        >
                          {selected && <Check className="w-3 h-3 text-white" />}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {module.description}
                      </p>
                    </div>
                    {module.depends_on && module.depends_on.length > 0 && (
                      <div className="mt-2 border-t border-border pt-2">
                        <ul className="flex flex-wrap gap-1">
                          {module.depends_on.map((dep) => {
                            const depModule = modules.find((m) => m.code === dep);
                            return (
                              <li key={dep}>
                                <span className="text-xs text-muted-foreground px-2 py-0.5 border rounded bg-muted">
                                  Dépend: {depModule?.name || dep}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Footer épuré */}
      <div className="sticky bottom-0 bg-background pt-4 pb-2 border-t border-border">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 flex items-center justify-center rounded bg-muted"
            >
              <Check className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm text-foreground">
                {selectedModules.length} module{selectedModules.length > 1 ? 's' : ''} sélectionné{selectedModules.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground tracking-tight">
            {selectedModules.length} / {modules.length}
          </span>
        </div>
      </div>
    </div>
  );
}
