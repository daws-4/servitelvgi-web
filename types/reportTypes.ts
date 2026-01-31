// types/reportTypes.ts
// Definiciones de tipos para el módulo de reportes

export type ReportType =
  | 'daily_installations'
  | 'daily_repairs'
  | 'monthly_installations'
  | 'monthly_repairs'
  | 'inventory_report'
  | 'netuno_orders'
  | 'crew_performance'
  | 'crew_inventory'
  | 'crew_visits';

export interface ReportFilters {
  reportType: ReportType;
  startDate: string;
  endDate: string;
  crewId?: string;
  includeCompleted?: boolean;
  includeAssigned?: boolean;
}

export interface OrderSummary {
  _id: string;
  subscriberNumber: string;
  subscriberName: string;
  address: string;
  ticket?: string; // Número de ticket
  type: 'instalacion' | 'averia' | 'recuperacion';
  status: string;
  completionDate?: Date;
  assignmentDate?: Date;
  assignedTo?: {
    _id: string;
    number: number | null;
  };
  node?: string;
  servicesToInstall?: string[];
}

export interface DailyReportData {
  fecha: string;
  cuadrillas: CrewDailyData[];
  totales: {
    completadas: number;
    noCompletadas: number;
  };
}

export interface CrewDailyData {
  crewId: string;
  crewNumber: number;
  crewName: string;
  completadas: OrderSummary[];
  noCompletadas: OrderSummary[];
  totales: {
    completadas: number;
    noCompletadas: number;
  };
}

export type MonthlyReportData = DailyReportData;

export interface MaterialSummary {
  code: string;
  description: string;
  stockBodega?: number;
  asignado?: number;
  usado?: number;
  disponible?: number;
  quantity?: number;
  crew?: string;
}

export interface MaterialMovement {
  _id: string;
  itemCode: string;
  itemDescription: string;
  quantity: number;
  date: Date;
  crewNumber?: number;
  crewName?: string;
  reason?: string;
}

export interface WarehouseMovementData {
  entradasNetuno: MaterialMovement[];
  salidasCuadrillas: MaterialMovement[];
  devolucionesInventario: MaterialMovement[];
}

export interface InventoryReportData {
  instalaciones: MaterialSummary[];
  averias: MaterialSummary[];
  materialAveriado: MaterialSummary[];
  materialRecuperado: MaterialSummary[];
}

export interface NetunoReportData {
  pendientes: OrderSummary[];
  totales: {
    instalaciones: number;
    averias: number;
  };
}

export interface CrewPerformanceData {
  crewId: string;
  crewNumber: number;
  totalOrders: number;
  instalaciones: number;
  averias: number;
  tiempoPromedioDias: number;
}

export interface CrewInventoryData {
  crewId: string;
  crewNumber: number;
  inventory: Array<{
    itemId: string;
    code: string;
    description: string;
    quantity: number;
    unit: string;
    lastUpdated?: Date;
  }>;
}

export interface CrewVisitsData {
  crewId: string;
  crewNumber: number;
  crewName: string;
  totalVisits: number;
  orderCount: number;
  instalaciones: number;
  averias: number;
  recuperaciones: number;
  otros: number;
}

export interface FullReportData {
  [key: string]: any;
}

export interface ReportMetadata {
  reportType: ReportType;
  generatedAt: Date;
  generatedBy?: string;
  filters: ReportFilters;
  totalRecords: number;
  executionTimeMs?: number;
  cached?: boolean;
}

export interface n8nResponse {
  success: boolean;
  message: string;
  recordsProcessed: number;
  errors?: string[];
}
