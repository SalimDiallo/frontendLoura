/**
 * Formulaire de création/modification d'organisation
 */

'use client';

import { useState, FormEvent } from 'react';
import type { Category, OrganizationCreateData, Organization } from '@/lib/types/core';
import { Input, Select, Button } from '@/components/ui';

export interface OrganizationFormProps {
  categories: Category[];
  initialData?: Organization;
  onSubmit: (data: OrganizationCreateData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function OrganizationForm({
  categories,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: OrganizationFormProps) {
  const [formData, setFormData] = useState<OrganizationCreateData>({
    name: initialData?.name || '',
    subdomain: initialData?.subdomain || '',
    logo_url: initialData?.logo_url || '',
    category: initialData?.category || undefined,
    settings: {
      country: initialData?.settings.country || 'GN',
      currency: initialData?.settings.currency || 'GNF',
      theme: initialData?.settings.theme || 'light',
      contact_email: initialData?.settings.contact_email || '',
    },
  });

  const handleSubdomainChange = (value: string) => {
    // Nettoyer le sous-domaine: que des lettres, chiffres et tirets
    const cleaned = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-+|-+$/g, '');
    setFormData({ ...formData, subdomain: cleaned });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: cat.name,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informations de base */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-900">
          Informations de base
        </h2>

        <Input
         
          required
          placeholder="Ma Super Entreprise"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sous-domaine <span className="text-red-500">*</span>
          </label>
          <div className="flex rounded-mdm">
            <input
              type="text"
              required
              className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
              placeholder="super-entreprise"
              value={formData.subdomain}
              onChange={(e) => handleSubdomainChange(e.target.value)}
            />
            <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
              .loura.app
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Lettres, chiffres et tirets uniquement
          </p>
        </div>

        <Select
          label="Catégorie"
          options={categoryOptions}
          placeholder="Sélectionner une catégorie"
          value={formData.category || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              category: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL du logo
          </label>
          <Input
            type="url"
            placeholder="https://example.com/logo.png"
            value={formData.logo_url}
            onChange={(e) =>
              setFormData({ ...formData, logo_url: e.target.value })
            }
          />
        </div>
      </div>

      {/* Paramètres */}
      <div className="space-y-4 pt-6 border-t border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Paramètres</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pays
            </label>
            <Input
              maxLength={2}
              placeholder="GN"
              value={formData.settings?.country || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  settings: {
                    ...formData.settings,
                    country: e.target.value.toUpperCase(),
                  },
                })
              }
            />
            <p className="mt-1 text-sm text-gray-500">Code ISO (2 lettres)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Devise
            </label>
            <Input
              maxLength={3}
              placeholder="GNF"
              value={formData.settings?.currency || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  settings: {
                    ...formData.settings,
                    currency: e.target.value.toUpperCase(),
                  },
                })
              }
            />
            <p className="mt-1 text-sm text-gray-500">Code ISO (3 lettres)</p>
          </div>
        </div>

        <Select
          label="Thème"
          options={[
            { value: 'light', label: 'Clair' },
            { value: 'dark', label: 'Sombre' },
          ]}
          value={formData.settings?.theme || 'light'}
          onChange={(e) =>
            setFormData({
              ...formData,
              settings: {
                ...formData.settings,
                theme: e.target.value,
              },
            })
          }
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email de contact
          </label>
          <Input
            type="email"
            placeholder="contact@exemple.com"
            value={formData.settings?.contact_email || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                settings: {
                  ...formData.settings,
                  contact_email: e.target.value,
                },
              })
            }
          />
        </div>
      </div>

      {/* Actions */}
      <div className="pt-6 border-t border-gray-200 flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" >
          {initialData ? 'Mettre à jour' : 'Créer l\'organisation'}
        </Button>
      </div>
    </form>
  );
}
