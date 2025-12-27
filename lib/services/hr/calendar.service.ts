/**
 * Service pour la gestion du calendrier RH
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { CalendarEvent } from '@/lib/types/hr';

/**
 * Liste tous les événements du calendrier
 */
export async function getCalendarEvents(params?: {
  start_date?: string;
  end_date?: string;
  event_type?: string;
  employee?: string;
}): Promise<CalendarEvent[]> {
  const searchParams = new URLSearchParams();

  if (params?.start_date) searchParams.append('start_date', params.start_date);
  if (params?.end_date) searchParams.append('end_date', params.end_date);
  if (params?.event_type) searchParams.append('event_type', params.event_type);
  if (params?.employee) searchParams.append('employee', params.employee);

  const queryString = searchParams.toString();
  const url = queryString ? `${API_ENDPOINTS.HR.CALENDAR.LIST}?${queryString}` : API_ENDPOINTS.HR.CALENDAR.LIST;

  return apiClient.get<CalendarEvent[]>(url);
}

/**
 * Récupère les détails d'un événement
 */
export async function getCalendarEvent(id: string): Promise<CalendarEvent> {
  return apiClient.get<CalendarEvent>(API_ENDPOINTS.HR.CALENDAR.DETAIL(id));
}

/**
 * Crée un nouvel événement
 */
export async function createCalendarEvent(data: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>): Promise<CalendarEvent> {
  return apiClient.post<CalendarEvent>(API_ENDPOINTS.HR.CALENDAR.CREATE, data);
}

/**
 * Met à jour un événement
 */
export async function updateCalendarEvent(id: string, data: Partial<CalendarEvent>): Promise<CalendarEvent> {
  return apiClient.patch<CalendarEvent>(API_ENDPOINTS.HR.CALENDAR.UPDATE(id), data);
}

/**
 * Supprime un événement
 */
export async function deleteCalendarEvent(id: string): Promise<void> {
  return apiClient.delete<void>(API_ENDPOINTS.HR.CALENDAR.DELETE(id));
}
