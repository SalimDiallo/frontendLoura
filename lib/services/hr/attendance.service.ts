// Attendance Service
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
  Attendance,
  AttendanceCreate,
  AttendanceUpdate,
  AttendanceCheckIn,
  AttendanceCheckOut,
  AttendanceApproval,
  AttendanceStats,
  AttendanceListResponse,
} from '@/lib/types/hr';

/**
 * Get all attendance records with optional filters
 */
export async function getAttendances(
  orgSlug: string,
  params?: {
    employee_id?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
    is_approved?: boolean;
    page?: number;
    page_size?: number;
  }
): Promise<AttendanceListResponse> {
  const queryParams = new URLSearchParams();

  if (params?.employee_id) queryParams.append('employee_id', params.employee_id);
  if (params?.start_date) queryParams.append('start_date', params.start_date);
  if (params?.end_date) queryParams.append('end_date', params.end_date);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.is_approved !== undefined) queryParams.append('is_approved', String(params.is_approved));
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.page_size) queryParams.append('page_size', String(params.page_size));

  const url = queryParams.toString() ? `${API_ENDPOINTS.HR.ATTENDANCES.LIST}?${queryParams}` : `${API_ENDPOINTS.HR.ATTENDANCES.LIST}`;
  return apiClient.get<AttendanceListResponse>(url, {
    headers: {
      'X-Organization-Slug': orgSlug,
    },
  });
}

/**
 * Get a single attendance record by ID
 */
export async function getAttendance(id: string, orgSlug: string): Promise<Attendance> {
  return apiClient.get<Attendance>(`${API_ENDPOINTS.HR.ATTENDANCES.DETAIL(id)}`, {
    headers: {
      'X-Organization-Slug': orgSlug,
    },
  });
}

/**
 * Get today's attendance for the current employee
 */
export async function getTodayAttendance(orgSlug: string): Promise<Attendance> {
  return apiClient.get<Attendance>(`${API_ENDPOINTS.HR.ATTENDANCES.TODAY}`, {
    headers: {
      'X-Organization-Slug': orgSlug,
    },
  });
}

/**
 * Create a new attendance record
 */
export async function createAttendance(
  data: AttendanceCreate,
  orgSlug: string
): Promise<Attendance> {
    return apiClient.post<Attendance>(`${API_ENDPOINTS.HR.ATTENDANCES.CREATE}`, data, {
    headers: {
      'X-Organization-Slug': orgSlug,
    }
  });
}

/**
 * Update an attendance record
 */
export async function updateAttendance(
  id: string,
  data: AttendanceUpdate,
  orgSlug: string
): Promise<Attendance> {
  return apiClient.patch<Attendance>(`${API_ENDPOINTS.HR.ATTENDANCES.UPDATE(id)}`, data, {
    headers: {
      'X-Organization-Slug': orgSlug,
    }
  });
}

/**
 * Delete an attendance record
 */
export async function deleteAttendance(id: string, orgSlug: string): Promise<void> {
  await apiClient.delete<void>(`${API_ENDPOINTS.HR.ATTENDANCES.DELETE(id)}`, {
    headers: {
      'X-Organization-Slug': orgSlug,
    }
  });
}

/**
 * Check in for the current employee
 */
export async function checkIn(
  data: AttendanceCheckIn,
  orgSlug: string
): Promise<Attendance> {
  return apiClient.post<Attendance>(`${API_ENDPOINTS.HR.ATTENDANCES.CHECK_IN}`, data, {
    headers: {
      'X-Organization-Slug': orgSlug,
    }
  });
}

/**
 * Check out for the current employee
 */
export async function checkOut(
  data: AttendanceCheckOut,
  orgSlug: string
): Promise<Attendance> {
  return apiClient.post<Attendance>(`${API_ENDPOINTS.HR.ATTENDANCES.CHECK_OUT}`, data, {
    headers: {
      'X-Organization-Slug': orgSlug,
    }
  });
}

/**
 * Approve or reject an attendance record
 */
export async function approveAttendance(
  id: string,
  data: AttendanceApproval,
  orgSlug: string
): Promise<Attendance> {
  return apiClient.post<Attendance>(`${API_ENDPOINTS.HR.ATTENDANCES.APPROVE(id)}`, data, {
    headers: {
      'X-Organization-Slug': orgSlug,
    }
  });
}

/**
 * Start a break for today's attendance
 */
export async function startBreak(orgSlug: string): Promise<Attendance> {
  return apiClient.post<Attendance>(`${API_ENDPOINTS.HR.ATTENDANCES.START_BREAK}`, {}, {
    headers: {
      'X-Organization-Slug': orgSlug,
    }
  });
}

/**
 * End the current break for today's attendance
 */
export async function endBreak(orgSlug: string): Promise<Attendance> {
  return apiClient.post<Attendance>(`${API_ENDPOINTS.HR.ATTENDANCES.END_BREAK}`, {}, {
    headers: {
      'X-Organization-Slug': orgSlug,
    }
  });
}

/**
 * Get attendance statistics
 */
export async function getAttendanceStats(
  orgSlug: string,
  params?: {
    employee_id?: string;
    start_date?: string;
    end_date?: string;
  }
): Promise<AttendanceStats> {
  const queryParams = new URLSearchParams();

  if (params?.employee_id) queryParams.append('employee_id', params.employee_id);
  if (params?.start_date) queryParams.append('start_date', params.start_date);
  if (params?.end_date) queryParams.append('end_date', params.end_date);

    const url = queryParams.toString() ? `${API_ENDPOINTS.HR.ATTENDANCES.STATS}?${queryParams}` : `${API_ENDPOINTS.HR.ATTENDANCES.STATS}`;
  return apiClient.get<AttendanceStats>(url, {
    headers: {
      'X-Organization-Slug': orgSlug,
    }
  });
}
