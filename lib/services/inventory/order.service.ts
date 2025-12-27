/**
 * Service pour la gestion des commandes
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { addOrganizationToData } from '@/lib/utils/organization';
import type { Order, OrderCreate, OrderUpdate, OrderList } from '@/lib/types/inventory';

/**
 * Liste toutes les commandes
 */
export async function getOrders(params?: {
  status?: string;
  supplier?: string;
  warehouse?: string;
}): Promise<OrderList[]> {
  const searchParams = new URLSearchParams();

  if (params?.status) searchParams.append('status', params.status);
  if (params?.supplier) searchParams.append('supplier', params.supplier);
  if (params?.warehouse) searchParams.append('warehouse', params.warehouse);

  const queryString = searchParams.toString();
  const url = queryString ? `${API_ENDPOINTS.INVENTORY.ORDERS.LIST}?${queryString}` : API_ENDPOINTS.INVENTORY.ORDERS.LIST;

  const response = await apiClient.get<{ count: number; results: OrderList[] }>(url);
  return response.results || [];
}

/**
 * Récupère les détails d'une commande
 */
export async function getOrder(id: string): Promise<Order> {
  return apiClient.get<Order>(API_ENDPOINTS.INVENTORY.ORDERS.DETAIL(id));
}

/**
 * Crée une nouvelle commande
 * Note: L'organization est automatiquement ajoutée par le backend
 */
export async function createOrder(data: OrderCreate): Promise<Order> {
  return apiClient.post<Order>(API_ENDPOINTS.INVENTORY.ORDERS.CREATE, data);
}

/**
 * Met à jour une commande
 */
export async function updateOrder(id: string, data: OrderUpdate): Promise<Order> {
  return apiClient.patch<Order>(API_ENDPOINTS.INVENTORY.ORDERS.UPDATE(id), data);
}

/**
 * Supprime une commande
 */
export async function deleteOrder(id: string): Promise<void> {
  return apiClient.delete<void>(API_ENDPOINTS.INVENTORY.ORDERS.DELETE(id));
}

/**
 * Confirme une commande
 */
export async function confirmOrder(id: string): Promise<Order> {
  return apiClient.post<Order>(API_ENDPOINTS.INVENTORY.ORDERS.CONFIRM(id));
}

/**
 * Marque une commande comme reçue
 */
export async function receiveOrder(id: string): Promise<Order> {
  return apiClient.post<Order>(API_ENDPOINTS.INVENTORY.ORDERS.RECEIVE(id));
}

/**
 * Annule une commande
 */
export async function cancelOrder(id: string): Promise<Order> {
  return apiClient.post<Order>(API_ENDPOINTS.INVENTORY.ORDERS.CANCEL(id));
}

/**
 * Exporte une commande en PDF
 */
export async function exportOrderPdf(id: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const token = localStorage.getItem('access_token');
  const orgSlug = localStorage.getItem('current_organization_slug');
  
  let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}${API_ENDPOINTS.INVENTORY.ORDERS.EXPORT_PDF(id)}`;
  
  if (orgSlug) {
    url += `?organization_subdomain=${orgSlug}`;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur lors du téléchargement: ${response.statusText}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `commande_${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Erreur lors du téléchargement du PDF:', error);
    throw error;
  }
}

