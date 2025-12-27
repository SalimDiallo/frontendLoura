"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { initializeOrganizationFromSlug } from "@/lib/utils/organization";

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const slug = params.slug as string;
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeOrganizationFromSlug(slug);
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize organization:", error);
        setIsInitialized(true); // Continue anyway
      }
    };

    initialize();
  }, [slug]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Initialisation...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
