"use client";

import {
  Card,
} from "@/components/ui";

import {
  HiOutlineBriefcase,

} from "react-icons/hi2";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export function EmployeeDocumentsTab() {
  return (
    <TabsContent value="documents" className="space-y-4">
      <Card className="p-12 text-center border-0 shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <HiOutlineBriefcase className="size-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Aucun document</h3>
            <p className="text-sm text-muted-foreground mt-1">
              La gestion des documents sera bientôt disponible
            </p>
          </div>
        </div>
      </Card>
    </TabsContent>
  );
}
