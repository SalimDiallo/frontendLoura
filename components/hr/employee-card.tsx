import Link from 'next/link';
import { Card } from '@/components/ui';
import { EmploymentStatusBadge } from './status-badge';
import type { Employee } from '@/lib/types/hr';
import { User, Mail, Phone, Briefcase } from 'lucide-react';

interface EmployeeCardProps {
  employee: Employee;
  orgSlug: string;
}

export function EmployeeCard({ employee, orgSlug }: EmployeeCardProps) {
  return (
    <Link href={`/apps/${orgSlug}/hr/employees/${employee.id}`}>
      <Card className="hover:border-primary p-4 transition-colors cursor-pointer">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            {employee.photo_url ? (
              <img
                src={employee.photo_url}
                alt={`${employee.first_name} ${employee.last_name}`}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <User className="h-6 w-6 text-primary" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="font-semibold truncate">
                {employee.first_name} {employee.last_name}
              </h3>
              <EmploymentStatusBadge status={employee.employment_status} />
            </div>

            <div className="space-y-1 text-sm text-muted-foreground">
              {employee.role_details && (
                <div className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  <span className="truncate">{employee.role_details.name}</span>
                </div>
              )}

              {employee.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate">{employee.email}</span>
                </div>
              )}

              {employee.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  <span className="truncate">{employee.phone}</span>
                </div>
              )}
            </div>

            {employee.department_details && (
              <div className="mt-2 text-xs text-muted-foreground">
                Département: {employee.department_details.name}
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
