/**
 * Employee Invitation Service
 *
 * Handles all employee invitation operations:
 * - Creating invitations (admin)
 * - Listing invitations (admin)
 * - Resending invitations (admin)
 * - Cancelling invitations (admin)
 * - Verifying invitation tokens (public)
 * - Accepting invitations (public)
 */

import { apiClient } from '@/lib/api/client';
import type {
  EmployeeInvitation,
  EmployeeInvitationCreate,
  EmployeeInvitationListResponse,
  EmployeeAcceptInvitation,
  EmployeeAcceptInvitationResponse,
  EmployeeInvitationVerify,
  InvitationStatus,
} from '@/lib/types/hr';
import type { PaginatedResponse } from '@/lib/types/index';

export interface InvitationFilters {
  status?: InvitationStatus;
  assigned_role?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

class InvitationService {
  private readonly baseUrl = '/hr/invitations';

  /**
   * List all invitations for the current organization
   * @param filters - Optional filters for the list
   * @returns Paginated list of invitations
   */
  async list(filters?: InvitationFilters): Promise<PaginatedResponse<EmployeeInvitation>> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.status) params.append('status', filters.status);
      if (filters.assigned_role) params.append('assigned_role', filters.assigned_role);
      if (filters.search) params.append('search', filters.search);
      if (filters.ordering) params.append('ordering', filters.ordering);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.page_size) params.append('page_size', filters.page_size.toString());
    }

    const url = params.toString() ? `${this.baseUrl}/?${params}` : `${this.baseUrl}/`;
    return apiClient.get<PaginatedResponse<EmployeeInvitation>>(url);
  }

  /**
   * Get a single invitation by ID
   * @param id - Invitation ID
   * @returns Invitation details
   */
  async get(id: string): Promise<EmployeeInvitation> {
    return apiClient.get<EmployeeInvitation>(`${this.baseUrl}/${id}/`);
  }

  /**
   * Create a new invitation
   * @param data - Invitation data
   * @returns Created invitation
   */
  async create(data: EmployeeInvitationCreate): Promise<EmployeeInvitation> {
    return apiClient.post<EmployeeInvitation>(this.baseUrl + '/', data);
  }

  /**
   * Resend an invitation (regenerates token and extends expiration)
   * @param id - Invitation ID
   * @returns Updated invitation
   */
  async resend(id: string): Promise<{ message: string; invitation: EmployeeInvitation }> {
    return apiClient.post<{ message: string; invitation: EmployeeInvitation }>(
      `${this.baseUrl}/${id}/resend/`
    );
  }

  /**
   * Cancel a pending invitation
   * @param id - Invitation ID
   * @returns Success message
   */
  async cancel(id: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.baseUrl}/${id}/cancel/`);
  }

  /**
   * Verify an invitation token (public endpoint)
   * @param token - Invitation token
   * @returns Invitation verification data
   */
  async verify(token: string): Promise<EmployeeInvitationVerify> {
    return apiClient.get<EmployeeInvitationVerify>(
      `${this.baseUrl}/verify/${token}/`,
      { requiresAuth: false }
    );
  }

  /**
   * Accept an invitation and create employee account (public endpoint)
   * @param token - Invitation token
   * @param data - Employee data (password, personal info)
   * @returns Employee data with JWT tokens
   */
  async accept(
    token: string,
    data: EmployeeAcceptInvitation
  ): Promise<EmployeeAcceptInvitationResponse> {
    return apiClient.post<EmployeeAcceptInvitationResponse>(
      `${this.baseUrl}/accept/${token}/`,
      data,
      { requiresAuth: false }
    );
  }

  /**
   * Delete an invitation
   * @param id - Invitation ID
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/${id}/`);
  }
}

export const invitationService = new InvitationService();
