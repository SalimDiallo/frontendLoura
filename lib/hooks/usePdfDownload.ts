/**
 * Hook réutilisable pour télécharger des PDF depuis l'API
 */

import { useState } from "react";
import { API_CONFIG, STORAGE_KEYS } from "@/lib/api/config";

interface UsePdfDownloadOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function usePdfDownload(options?: UsePdfDownloadOptions) {
  const [downloading, setDownloading] = useState(false);

  const downloadPdf = async (endpoint: string, filename: string) => {
    try {
      setDownloading(true);

      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const orgSlug = localStorage.getItem("current_organization_slug");

      const url = `${API_CONFIG.baseURL}${endpoint}${
        endpoint.includes("?") ? "&" : "?"
      }organization_subdomain=${orgSlug}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la génération du PDF");
      }

      const blob = await response.blob();
      const objUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(objUrl);

      options?.onSuccess?.();
    } catch (err: any) {
      options?.onError?.(err.message || "Erreur lors du téléchargement du PDF");
    } finally {
      setDownloading(false);
    }
  };

  return { downloadPdf, downloading };
}
