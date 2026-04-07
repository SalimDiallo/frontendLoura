"use client";

import { Card } from "@/components/ui";
import Link from "next/link";
import {
    HiOutlineArrowTopRightOnSquare,
    HiOutlineUser
} from "react-icons/hi2";


export function ContractEmployeeCard({ employeeId, employeeName, slug }: { employeeId: any, employeeName: string | null | undefined, slug: string }) {
  return (
    <Card className="p-6 border-0 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
        <HiOutlineUser className="size-4" />
        EMPLOYÉ
      </div>
      <Link 
        href={`/apps/${slug}/hr/employees/${employeeId}`}
        className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
          {employeeName?.charAt(0) || '?'}
        </div>
        <div className="flex-1">
          <div className="font-semibold">{employeeName}</div>
          <div className="text-sm text-muted-foreground">Voir le profil</div>
        </div>
        <HiOutlineArrowTopRightOnSquare className="size-4 text-muted-foreground" />
      </Link>
    </Card>
  );
}
