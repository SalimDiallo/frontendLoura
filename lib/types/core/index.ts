/**
 * Types TypeScript pour le module Core
 * (Authentification, Organisations, Catégories)
 */

// ============================================================================
// USER & AUTHENTICATION
// ============================================================================


export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  user_type: 'admin';
  is_active: boolean;
  created_at: string;
  organizations: Array<{
    id: string;
    name: string;
    subdomain: string;
    logo_url?: string;
    is_active: boolean;
  }>;
  organizations_count?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  organization_name: string;
  organization_subdomain: string;
  organization_category?: string;
}

export interface AuthResponse {
  user: AdminUser;
  user_type: 'admin' | 'employee';
  access: string;
  refresh: string;
  message: string;
  organization?: {
    id: string;
    name: string;
    subdomain: string;
  };
}

// ============================================================================
// CATEGORY
// ============================================================================

export interface Category {
  id: string;
  name: string;
  description: string;
}

// ============================================================================
// ORGANIZATION
// ============================================================================

export interface OrganizationSettings {
  country: string | null;
  currency: string;
  theme: string | null;
  contact_email: string | null;
}

export interface Organization {
  id: string;
  name: string;
  subdomain: string;
  logo_url: string | null;
  logo: string | null;
  category: number | null;
  category_details: Category | null;
  admin: string;
  admin_email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  settings: OrganizationSettings;
}

// ============================================================================
// MODULE
// ============================================================================

export interface Module {
  id: string;
  code: string;
  name: string;
  description: string;
  app_name: string;
  icon: string;
  category: string;
  default_for_all: boolean;
  default_categories: string[];
  requires_subscription_tier: string;
  depends_on: string[];
  is_core: boolean;
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface OrganizationModuleSettings {
  [key: string]: any;
}

export interface OrganizationModule {
  id: string;
  module: string;
  module_details: Module;
  is_enabled: boolean;
  settings: OrganizationModuleSettings;
  enabled_at: string;
  enabled_by: string | null;
}

export interface ModuleCreateData {
  module_code: string;
  is_enabled?: boolean;
  settings?: OrganizationModuleSettings;
}

export interface DefaultModulesResponse {
  category: Category;
  default_modules: Module[];
  count: number;
}

// ============================================================================
// ORGANIZATION (Updated with modules)
// ============================================================================

export interface OrganizationCreateData {
  name: string;
  subdomain: string;
  logo_url?: string;
  category?: number;
  settings?: Partial<OrganizationSettings>;
  modules?: ModuleCreateData[];
}

export interface OrganizationUpdateData {
  name?: string;
  subdomain?: string;
  logo_url?: string;
  category?: number;
  is_active?: boolean;
  settings?: Partial<OrganizationSettings>;
}
