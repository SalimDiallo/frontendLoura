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
  is_active: boolean;
  created_at: string;
  organizations_count: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
}

export interface AuthResponse {
  user: AdminUser;
  access: string;
  refresh: string;
  message: string;
}

// ============================================================================
// CATEGORY
// ============================================================================

export interface Category {
  id: number;
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

export interface OrganizationCreateData {
  name: string;
  subdomain: string;
  logo_url?: string;
  category?: number;
  settings?: Partial<OrganizationSettings>;
}

export interface OrganizationUpdateData {
  name?: string;
  subdomain?: string;
  logo_url?: string;
  category?: number;
  is_active?: boolean;
  settings?: Partial<OrganizationSettings>;
}
