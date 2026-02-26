"use client";
import { Card } from "@/components/ui";
import type { Contract } from "@/lib/types/hr";
import {
    HiOutlineCheckCircle,
    HiOutlineDocumentText,
    HiOutlineXCircle
} from "react-icons/hi2";


// Composant : Statistiques et filtres principaux
export function ContractsStatsCards({
  contracts, activeContracts, inactiveContracts,
  filterActive, setFilterActive,
  filterType, setFilterType,
}: {
  contracts: Contract[],
  activeContracts: Contract[],
  inactiveContracts: Contract[],
  filterActive: boolean|null,
  setFilterActive: (value: boolean|null) => void,
  filterType: string|null,
  setFilterType: (value: string|null) => void,
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card 
        className={`p-4 border-0 shadow-sm cursor-pointer transition-all hover:shadow-md ${
          filterActive === null && !filterType ? 'ring-2 ring-primary' : ''
        }`}
        onClick={() => {
          setFilterActive(null);
          setFilterType(null);
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <HiOutlineDocumentText className="size-5 text-primary" />
          </div>
          <div>
            <div className="text-2xl font-bold">{contracts.length}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>
      </Card>
      <Card 
        className={`p-4 border-0 shadow-sm cursor-pointer transition-all hover:shadow-md ${
          filterActive === true ? 'ring-2 ring-green-500' : ''
        }`}
        onClick={() => setFilterActive(filterActive === true ? null : true)}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-green-100">
            <HiOutlineCheckCircle className="size-5 text-green-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{activeContracts.length}</div>
            <div className="text-xs text-muted-foreground">Actifs</div>
          </div>
        </div>
      </Card>
      <Card 
        className={`p-4 border-0 shadow-sm cursor-pointer transition-all hover:shadow-md ${
          filterActive === false ? 'ring-2 ring-gray-400' : ''
        }`}
        onClick={() => setFilterActive(filterActive === false ? null : false)}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-gray-100">
            <HiOutlineXCircle className="size-5 text-gray-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-600">{inactiveContracts.length}</div>
            <div className="text-xs text-muted-foreground">Inactifs</div>
          </div>
        </div>
      </Card>
      <Card 
        className={`p-4 border-0 shadow-sm cursor-pointer transition-all hover:shadow-md ${
          filterType === 'permanent' ? 'ring-2 ring-foreground' : ''
        }`}
        onClick={() => setFilterType(filterType === 'permanent' ? null : 'permanent')}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100">
            <span className="text-sm font-bold text-foreground">CDI</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">
              {contracts.filter((c) => c.contract_type === 'permanent').length}
            </div>
            <div className="text-xs text-muted-foreground">Permanents</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
