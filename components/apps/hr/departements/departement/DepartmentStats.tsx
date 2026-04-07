'use client';

import { Card } from '@/components/ui';

import {
  HiOutlineUsers,
  HiOutlineUserGroup,
  HiOutlineXCircle,

} from 'react-icons/hi2';


type DepartmentStatsProps = {
  activeCount: number;
  inactiveCount: number;
  totalCount: number;
};

export function DepartmentStats({ activeCount, inactiveCount, totalCount }: DepartmentStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
            <HiOutlineUsers className="size-6 text-foreground dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Employés Actifs</p>
            <p className="text-2xl font-bold">{activeCount}</p>
          </div>
        </div>
      </Card>
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
            <HiOutlineUserGroup className="size-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Employés</p>
            <p className="text-2xl font-bold">{totalCount}</p>
          </div>
        </div>
      </Card>
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900">
            <HiOutlineXCircle className="size-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Inactifs</p>
            <p className="text-2xl font-bold">{inactiveCount}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
