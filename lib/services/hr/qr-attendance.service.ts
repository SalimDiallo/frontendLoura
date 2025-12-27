// QR Code Attendance Service
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
  QRCodeSession,
  QRCodeSessionCreate,
  QRAttendanceCheckIn,
  QRAttendanceResponse,
} from '@/lib/types/hr';

/**
 * Create a new QR code session for attendance
 * Only accessible by AdminUsers
 */
export async function createQRSession(
  data: QRCodeSessionCreate,
  orgSlug: string
): Promise<QRCodeSession> {
  return apiClient.post<QRCodeSession>(
    API_ENDPOINTS.HR.ATTENDANCES.QR_SESSION_CREATE,
    data,
    {
      headers: {
        'X-Organization-Slug': orgSlug,
      },
    }
  );
}

/**
 * Get QR session details
 */
export async function getQRSession(
  sessionId: string,
  orgSlug: string
): Promise<QRCodeSession> {
  return apiClient.get<QRCodeSession>(
    API_ENDPOINTS.HR.ATTENDANCES.QR_SESSION_DETAIL(sessionId),
    {
      headers: {
        'X-Organization-Slug': orgSlug,
      },
    }
  );
}

/**
 * Check in/out using QR code (automatically determined by backend)
 * Employee scans QR - backend detects if it's check-in or check-out
 */
export async function qrCheckIn(
  data: QRAttendanceCheckIn,
  orgSlug: string
): Promise<QRAttendanceResponse> {
  return apiClient.post<QRAttendanceResponse>(
    API_ENDPOINTS.HR.ATTENDANCES.QR_CHECK_IN,
    data,
    {
      headers: {
        'X-Organization-Slug': orgSlug,
      },
    }
  );
}
