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
  | 'crew_inventory';

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
  type: 'instalacion' | 'averia';
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
  finalizadas: OrderSummary[];
  asignadas: OrderSummary[];
  totales: { 
    finalizadas: number; 
    asignadas: number;
  };
  cached?: boolean;
}

export interface MonthlyReportData {
  breakdown: Array<{
    date: string;
    finalizadas: number;
    asignadas: number;
  }>;
  totales: {
    finalizadas: number;
    asignadas: number;
  };
  cached?: boolean;
}

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

export interface GeneratedReportDocument {
  _id: string;
  reportType: ReportType;
  filters: {
    startDate: string;
    endDate: string;
    crewId?: string;
    additionalFilters?: Map<string, string>;
  };
  data: any;
  metadata: {
    totalRecords: number;
    generatedAt: Date;
    generatedBy?: string;
    generatedByModel?: 'User' | 'Installer';
    executionTimeMs?: number;
  };
  exportedFiles?: {
    excel?: string;
    pdf?: string;
    word?: string;
  };
  sentToN8n: boolean;
  sentToN8nAt?: Date;
  reportHash: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
