'use client';

import { useState, useEffect } from 'react';
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
  const [processingModules, setProcessingModules] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [modules, orgModulesData] = await Promise.all([
        moduleService.getAll(),
        organizationModuleService.getAll(),
      ]);

      setAllModules(modules);
      setOrgModules(orgModulesData);
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

      if (currentState) {
        // Désactiver
        await organizationModuleService.disable(orgModuleId);
      } else {
        // Activer
        await organizationModuleService.enable(orgModuleId);
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

  // Grouper les modules par état
  const activeModules = orgModules.filter((om) => om.is_enabled);
  const inactiveModules = orgModules.filter((om) => !om.is_enabled);

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Modules fonctionnels
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez les modules activés pour cette organisation
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {activeModules.length} / {orgModules.length} activés
        </Badge>
      </div>

      {/* Active Modules */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <h4 className="text-sm font-semibold text-foreground">
            Modules actifs ({activeModules.length})
          </h4>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {activeModules.length === 0 ? (
            <div className="p-4 bg-muted/30 border border-border rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                Aucun module actif
              </p>
            </div>
          ) : (
            activeModules.map((orgModule) => {
              const module = orgModule.module_details;
              const Icon = iconMap[module.icon] || Package;
              const isProcessing = processingModules.has(orgModule.id);

              return (
                <div
                  key={orgModule.id}
                  className="group relative p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-lg transition-all hover:shadow-md"
                >
                  {/* Module Info */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                      <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold text-foreground">
                          {module.name}
                        </h5>
                        {module.is_core && (
                          <Badge variant="outline" className="text-xs">
                            Core
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {module.description}
                      </p>

                      {/* Dependencies */}
                      {module.depends_on && module.depends_on.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {module.depends_on.map((dep) => {
                            const depModule = allModules.find(
                              (m) => m.code === dep
                            );
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
                      )}
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleModule(orgModule.id, orgModule.is_enabled)
                      }
                      disabled={module.is_core || isProcessing}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                        ${
                          module.is_core
                            ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                            : 'bg-white dark:bg-slate-800 text-destructive border border-destructive/20 hover:bg-destructive/10'
                        }
                        ${isProcessing ? 'opacity-50 cursor-wait' : ''}
                      `}
                      title={
                        module.is_core
                          ? 'Ce module ne peut pas être désactivé'
                          : 'Désactiver ce module'
                      }
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <PowerOff className="w-3 h-3" />
                      )}
                      {module.is_core
                        ? 'Obligatoire'
                        : isProcessing
                        ? 'Traitement...'
                        : 'Désactiver'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Inactive Modules */}
      {inactiveModules.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">
              Modules disponibles ({inactiveModules.length})
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {inactiveModules.map((orgModule) => {
              const module = orgModule.module_details;
              const Icon = iconMap[module.icon] || Package;
              const isProcessing = processingModules.has(orgModule.id);

              return (
                <div
                  key={orgModule.id}
                  className="group relative p-4 bg-muted/30 border border-border rounded-lg transition-all hover:border-primary/50 hover:shadow-sm"
                >
                  {/* Module Info */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold text-muted-foreground">
                          {module.name}
                        </h5>
                      </div>
                      <p className="text-sm text-muted-foreground/70 line-clamp-2">
                        {module.description}
                      </p>

                      {/* Dependencies */}
                      {module.depends_on && module.depends_on.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {module.depends_on.map((dep) => {
                            const depModule = allModules.find(
                              (m) => m.code === dep
                            );
                            return (
                              <Badge
                                key={dep}
                                variant="secondary"
                                className="text-xs opacity-60"
                              >
                                Requiert: {depModule?.name || dep}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleModule(orgModule.id, orgModule.is_enabled)
                      }
                      disabled={isProcessing}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                        bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm
                        ${isProcessing ? 'opacity-50 cursor-wait' : ''}
                      `}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Power className="w-3 h-3" />
                      )}
                      {isProcessing ? 'Activation...' : 'Activer'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
