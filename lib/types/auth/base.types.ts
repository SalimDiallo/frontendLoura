/**
 * Types de base pour l'authentification
 * ========================================
 * Interfaces atomiques suivant le principe ISP (Interface Segregation Principle)
 * Chaque interface a une responsabilité unique
 */

/**
 * Type d'utilisateur dans le système
 */
export type UserType = 'admin' | 'employee';

/**
 * Informations de base d'un utilisateur
 */
export interface BaseUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: UserType;
  is_active: boolean;
  email_verified?: boolean;
  created_at: string;
  updated_at?: string;
  last_login?: string;
}

/**
 * Informations de profil utilisateur
 */
export interface UserProfile {
  phone?: string;
  avatar_url?: string;
  language?: string;
  timezone?: string;
}

/**
 * Informations personnelles
 */
export interface PersonalInfo {
  date_of_birth?: string;
  address?: string;
  city?: string;
  country?: string;
  emergency_contact?: string;
}

/**
 * Contact d'urgence structuré
 */
export interface EmergencyContact {
  name?: string;
  phone?: string;
  relationship?: string;
}

/**
 * Organisation
 */
export interface Organization {
  id: string;
  name: string;
  subdomain: string;
  logo_url?: string;
  is_active: boolean;
  settings?: {
    currency?: string;
    country?: string;
    timezone?: string;
  };
}

/**
 * Département
 */
export interface Department {
  id: string;
  name: string;
  description?: string;
}

/**
 * Position/Poste
 */
export interface Position {
  id: string;
  title: string;
  level?: string;
}

/**
 * Rôle avec permissions
 */
export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: string[];
}

/**
 * Contrat
 */
export interface Contract {
  id: string;
  name: string;
  type?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * Manager (version simplifiée d'un utilisateur)
 */
export type Manager = Pick<BaseUser, 'id' | 'first_name' | 'last_name' | 'email' | 'user_type'>;

/**
 * Statut d'emploi dans une organisation
 */
export type EmploymentStatus = 'active' | 'on_leave' | 'suspended' | 'terminated';

/**
 * Membership d'un employé dans une organisation
 * Représente l'appartenance à une organisation avec rôle, département, etc.
 */
export interface OrganizationMembership {
  id: string;
  name: string;
  subdomain: string;
  logo_url?: string;
  is_active: boolean;
  is_primary: boolean;
  employment_status: EmploymentStatus;
  hire_date?: string;
  department?: Department;
  position?: Position;
  assigned_role?: Role;
}

/**
 * Réponse de l'API pour la liste des organisations d'un employé
 */
export interface MyOrganizationsResponse {
  organizations: OrganizationMembership[];
  count: number;
}

/**
 * Requête pour sélectionner/changer d'organisation
 */
export interface SelectOrganizationRequest {
  organization_id: string;
}

/**
 * Réponse après sélection/changement d'organisation
 */
export interface SelectOrganizationResponse {
  message: string;
  organization: OrganizationMembership;
  access: string;
  refresh: string;
}