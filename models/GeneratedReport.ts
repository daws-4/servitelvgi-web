// models/GeneratedReport.ts
// Modelo para cachear reportes generados y evitar regeneración costosa

import mongoose, { Document, Model } from "mongoose";

// TypeScript interface for the document
export interface IGeneratedReport extends Document {
  reportType: string;
  filters: {
    startDate: string;
    endDate: string;
    crewId?: mongoose.Types.ObjectId;
    additionalFilters?: Map<string, string>;
  };
  data: any;
  metadata: {
    totalRecords: number;
    generatedAt: Date;
    generatedBy?: mongoose.Types.ObjectId;
    generatedByModel?: "User" | "Installer";
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

// TypeScript interface for the model (with static methods)
export interface IGeneratedReportModel extends Model<IGeneratedReport> {
  findOrGenerate(
    reportType: string,
    filters: any,
    generateFn: () => Promise<any>,
    sessionUser?: any
  ): Promise<{ data: any; cached: boolean; reportId: any }>;
}

const GeneratedReportSchema = new mongoose.Schema(
  {
    reportType: {
      type: String,
      enum: [
        "daily_installations",
        "daily_repairs",
        "monthly_installations",
        "monthly_repairs",
        "inventory_report",
        "netuno_orders",
        "crew_performance",
        "crew_inventory",
      ],
      required: true,
    },
    
    // Filtros usados para generar el reporte
    filters: {
      startDate: { type: String, required: true },
      endDate: { type: String, required: true },
      crewId: { type: mongoose.Schema.Types.ObjectId, ref: "Crew" },
      additionalFilters: { type: Map, of: String }, // Filtros adicionales flexibles
    },
    
    // Datos del reporte (JSON completo)
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    
    // Metadata del reporte
    metadata: {
      totalRecords: { type: Number, required: true },
      generatedAt: { type: Date, default: Date.now },
      generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "metadata.generatedByModel",
      },
      generatedByModel: {
        type: String,
        enum: ["User", "Installer"],
      },
      executionTimeMs: { type: Number }, // Tiempo que tomó generar
    },
    
    // Archivos exportados (URLs si se guardaron)
    exportedFiles: {
      excel: { type: String },
      pdf: { type: String },
      word: { type: String },
    },
    
    // Control de envío a n8n
    sentToN8n: {
      type: Boolean,
      default: false,
    },
    sentToN8nAt: { type: Date },
    
    // Hash único para identificar reportes duplicados
    // Formato: reportType_startDate_endDate_crewId
    reportHash: {
      type: String,
      required: true,
      index: true,
    },
    
    // TTL (Time To Live) - auto-eliminar reportes viejos
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 días
    },
  },
  { timestamps: true }
);

// Índice compuesto para búsquedas rápidas
GeneratedReportSchema.index({ reportType: 1, "filters.startDate": 1, "filters.endDate": 1 });

// Índice TTL para auto-eliminación
GeneratedReportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Método estático para buscar o crear reporte
GeneratedReportSchema.statics.findOrGenerate = async function(
  reportType: string,
  filters: any,
  generateFn: () => Promise<any>,
  sessionUser?: any
) {
  const reportHash = `${reportType}_${filters.startDate}_${filters.endDate}_${filters.crewId || 'all'}`;
  
  // Buscar reporte existente (generado en las últimas 24 horas)
  const existingReport = await this.findOne({
    reportHash,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  }).lean();
  
  if (existingReport) {
    return { data: existingReport.data, cached: true, reportId: existingReport._id };
  }
  
  // Generar nuevo reporte
  const startTime = Date.now();
  const data = await generateFn();
  const executionTime = Date.now() - startTime;
  
  const newReport = await this.create({
    reportType,
    filters,
    data,
    reportHash,
    metadata: {
      totalRecords: Array.isArray(data) ? data.length : data.totales?.finalizadas + data.totales?.asignadas || 0,
      generatedAt: new Date(),
      generatedBy: sessionUser?.userId,
      generatedByModel: sessionUser?.userModel,
      executionTimeMs: executionTime,
    },
  });
  
  return { data: newReport.data, cached: false, reportId: newReport._id };
};

const GeneratedReportModel: IGeneratedReportModel =
  (mongoose.models?.GeneratedReport as IGeneratedReportModel) ||
  mongoose.model<IGeneratedReport, IGeneratedReportModel>("GeneratedReport", GeneratedReportSchema);

export default GeneratedReportModel;
