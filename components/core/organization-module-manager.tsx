'use client';

import { useState, useEffect, memo } from 'react';
import { Alert, Badge } from '@/components/ui';
import {
  moduleService,
  organizationModuleService,
} from '@/lib/services/core';
import type { Module, OrganizationModule } from '@/lib/types/core';
import {
  Users,
  DollarSign,
  Calendar,
  Clock,
  FileText,
  Shield,
  LucideIcon,
  Loader2,
  CheckCircle,
  XCircle,
  Package,
  Power,
  PowerOff,
  Warehouse,
  ShoppingCart,
  TrendingUp,
  ArrowLeftRight,
  BarChart,
} from 'lucide-react';
import { ApiError } from '@/lib/api/client';

interface OrganizationModuleManagerProps {
  organizationId: string;
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

export function OrganizationModuleManager({
  organizationId,
}: OrganizationModuleManagerProps) {
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [orgModules, setOrgModules] = useState<OrganizationModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [processingModules, setProcessingModules] = useState<Set<string>>(
    new Set()
  );

  console.log('🔄 OrganizationModuleManager render', {
    organizationId,
    orgModulesCount: orgModules.length,
    loading
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [modules, orgModulesData] = await Promise.all([
        moduleService.getAll(),
        organizationModuleService.getByOrganization(organizationId),
      ]);

      // Dédupliquer les modules par ID
      const uniqueOrgModules = Array.from(
        new Map(orgModulesData.map(om => [om.id, om])).values()
      );

      console.log('📦 Modules chargés:', {
        total: orgModulesData.length,
        unique: uniqueOrgModules.length,
        duplicates: orgModulesData.length - uniqueOrgModules.length
      });

      setAllModules(modules);
      setOrgModules(uniqueOrgModules);
    } catch (err) {
      console.error('Erreur lors du chargement des modules:', err);
      setError('Erreur lors du chargement des modules');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleModule = async (
    orgModuleId: string,
    currentState: boolean
  ) => {
    try {
      setProcessingModules((prev) => new Set(prev).add(orgModuleId));
      setError(null);
      setSuccessMessage(null);

      let response;
      if (currentState) {
        // Désactiver
        response = await organizationModuleService.disable(orgModuleId);
      } else {
        // Activer
        response = await organizationModuleService.enable(orgModuleId);
      }

      // Afficher le message de succès
      if (response && response.message) {
        setSuccessMessage(response.message);
        // Effacer le message après 5 secondes
        setTimeout(() => setSuccessMessage(null), 5000);
      }

      // Recharger les données
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Erreur lors de la modification du module');
      }
    } finally {
      setProcessingModules((prev) => {
        const next = new Set(prev);
        next.delete(orgModuleId);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Chargement des modules...
          </p>
        </div>
      </div>
    );
  }

  // Grouper les modules par catégorie et état
  const groupedModules = orgModules.reduce((acc, om) => {
    const category = om.module_details.category || 'Autres';
    if (!acc[category]) {
      acc[category] = { active: [], inactive: [] };
    }
    if (om.is_enabled) {
      acc[category].active.push(om);
    } else {
      acc[category].inactive.push(om);
    }
    return acc;
  }, {} as Record<string, { active: OrganizationModule[]; inactive: OrganizationModule[] }>);

  const totalActive = orgModules.filter((om) => om.is_enabled).length;

  console.log('📊 Modules groupés:', {
    categories: Object.keys(groupedModules),
    details: Object.entries(groupedModules).map(([cat, mods]) => ({
      category: cat,
      active: mods.active.length,
      inactive: mods.inactive.length,
      activeModules: mods.active.map(m => m.module_details.name),
      inactiveModules: mods.inactive.map(m => m.module_details.name)
    }))
  });

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-900 dark:text-emerald-100">Actifs</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{totalActive}</p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-medium text-slate-900 dark:text-slate-100">Inactifs</span>
          </div>
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-400">{orgModules.length - totalActive}</p>
        </div>
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-900 dark:text-blue-100">Total</span>
          </div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{orgModules.length}</p>
        </div>
      </div>

      {/* Modules groupés par catégorie */}
      <div className="space-y-6">
        {Object.entries(groupedModules).map(([category, { active, inactive }]) => (
          <div key={category} className="space-y-3">
            {/* Category Header */}
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                {category}
              </h4>
              <Badge variant="outline" className="text-xs">
                {active.length + inactive.length} module{active.length + inactive.length > 1 ? 's' : ''}
              </Badge>
            </div>

            {/* Active Modules in Category */}
            {active.length > 0 && (
              <div className="grid grid-cols-1 gap-2">
                {active.map((orgModule) => {
                  const module = orgModule.module_details;
                  const Icon = iconMap[module.icon] || Package;
                  const isProcessing = processingModules.has(orgModule.id);

                  return (
                    <div
                      key={orgModule.id}
                      className="group relative p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-all hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg shrink-0">
                          <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium text-sm text-foreground">{module.name}</h5>
                            {module.is_core && (
                              <Badge variant="outline" className="text-xs">Core</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{module.description}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleModule(orgModule.id, orgModule.is_enabled)}
                          disabled={module.is_core || isProcessing}
                          className={`
                            flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all shrink-0
                            ${
                              module.is_core
                                ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                                : 'bg-white dark:bg-slate-800 text-red-600 border border-red-200 hover:bg-red-50'
                            }
                            ${isProcessing ? 'opacity-50 cursor-wait' : ''}
                          `}
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <PowerOff className="w-3 h-3" />
                          )}
                          {module.is_core ? 'Core' : 'Désactiver'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Inactive Modules in Category */}
            {inactive.length > 0 && (
              <div className="grid grid-cols-1 gap-2">
                {inactive.map((orgModule) => {
                  const module = orgModule.module_details;
                  const Icon = iconMap[module.icon] || Package;
                  const isProcessing = processingModules.has(orgModule.id);

                  return (
                    <div
                      key={orgModule.id}
                      className="group relative p-3 bg-muted/30 border border-border rounded-lg transition-all hover:border-primary/50 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg shrink-0">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-sm text-muted-foreground">{module.name}</h5>
                          <p className="text-xs text-muted-foreground/70 line-clamp-1">{module.description}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleModule(orgModule.id, orgModule.is_enabled)}
                          disabled={isProcessing}
                          className={`
                            flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all shrink-0
                            bg-primary text-primary-foreground hover:bg-primary/90
                            ${isProcessing ? 'opacity-50 cursor-wait' : ''}
                          `}
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Power className="w-3 h-3" />
                          )}
                          Activer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium mb-1">À propos des modules</p>
            <ul className="space-y-1 text-blue-800 dark:text-blue-200">
              <li>
                • Les modules <strong>Core</strong> sont obligatoires et ne
                peuvent pas être désactivés
              </li>
              <li>
                • Certains modules peuvent avoir des <strong>dépendances</strong>{' '}
                avec d'autres modules
              </li>
              <li>
                • L'activation/désactivation prend effet immédiatement
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
