'use client';

import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Briefcase, Building2, Calendar, Check } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  subdomain: string;
  logo_url?: string;
  is_primary: boolean;
  employment_status?: string;
  hire_date?: string;
  department?: {
    id: string;
    name: string;
  };
  position?: {
    id: string;
    title: string;
  };
  assigned_role?: {
    id: string;
    code: string;
    name: string;
  };
}

interface OrganizationSelectorProps {
  organizations: Organization[];
  onSelect: (organizationId: string) => void;
  selectedId?: string;
  loading?: boolean;
  title?: string;
  description?: string;
}

export function OrganizationSelector({
  organizations,
  onSelect,
  selectedId,
  loading = false,
  title = 'Sélectionnez une organisation',
  description = 'Choisissez l\'organisation dans laquelle vous souhaitez vous connecter',
}: OrganizationSelectorProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {/* Organizations Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {organizations.map((org) => (
          <Card
            key={org.id}
            className={cn(
              'relative cursor-pointer transition-all duration-200',
              'hover:shadow-lg hover:scale-[1.02]',
              'border-2',
              selectedId === org.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50',
              loading && 'pointer-events-none opacity-50'
            )}
            onClick={() => onSelect(org.id)}
          >
            <div className="p-6">
              {/* Selected Indicator */}
              {selectedId === org.id && (
                <div className="absolute top-4 right-4">
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              )}

              {/* Primary Badge */}
              {org.is_primary && (
                <div className="absolute top-4 left-4">
                  <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    Principal
                  </div>
                </div>
              )}

              {/* Logo & Name */}
              <div className="flex items-start gap-4 mb-4 mt-6">
                {org.logo_url ? (
                  <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                    <img
                      src={org.logo_url}
                      alt={org.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">{org.name}</h3>
                  <p className="text-sm text-muted-foreground">@{org.subdomain}</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm">
                {org.position && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    <span>{org.position.title}</span>
                    {org.department && (
                      <span className="text-xs">• {org.department.name}</span>
                    )}
                  </div>
                )}

                {org.assigned_role && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-4 w-4 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    <span>{org.assigned_role.name}</span>
                  </div>
                )}

                {org.hire_date && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Depuis le{' '}
                      {new Date(org.hire_date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}

                {org.employment_status && org.employment_status !== 'active' && (
                  <div className="mt-2">
                    <span
                      className={cn(
                        'px-2 py-1 text-xs font-medium rounded',
                        org.employment_status === 'on_leave' &&
                        'bg-yellow-100 text-yellow-700',
                        org.employment_status === 'suspended' &&
                        'bg-red-100 text-red-700',
                        org.employment_status === 'terminated' &&
                        'bg-gray-100 text-gray-700'
                      )}
                    >
                      {org.employment_status === 'on_leave' && 'En congé'}
                      {org.employment_status === 'suspended' && 'Suspendu'}
                      {org.employment_status === 'terminated' && 'Terminé'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {organizations.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Aucune organisation disponible
          </p>
        </div>
      )}
    </div>
  );
}
