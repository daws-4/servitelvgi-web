// types/inventory.ts
// TypeScript types for inventory and equipment instances

export interface EquipmentInstance {
  _id?: string;
  uniqueId: string;
  serialNumber?: string;
  macAddress?: string;
  status: "in-stock" | "assigned" | "installed" | "damaged" | "retired";
  assignedTo?: {
    crewId?: string;
    orderId?: string;
    assignedAt?: Date;
  };
  installedAt?: {
    orderId?: string;
    installedDate?: Date;
    location?: string;
  };
  notes?: string;
  createdAt?: Date;
}

export interface InventoryItem {
  _id: string;
  code: string;
  description: string;
  type: "material" | "equipment" | "tool";
  unit: string;
  currentStock: number;
  minimumStock: number;
  instances?: EquipmentInstance[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateInstanceInput {
  uniqueId: string;
  serialNumber?: string;
  macAddress?: string;
  notes?: string;
}

export interface AssignInstanceInput {
  instanceId: string;
  crewId: string;
  orderId?: string;
}

export interface InstallInstanceInput {
  instanceId: string;
  orderId: string;
  location: string;
  installedDate?: Date;
}
