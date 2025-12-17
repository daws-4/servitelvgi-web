import InventoryHistoryModel from "@/models/InventoryHistory";
import { connectDB } from "@/lib/db";

export async function createInventoryHistory(data: any) {
  await connectDB();
  return await InventoryHistoryModel.create(data);
}

export async function getInventoryHistories(filters: {
  startDate?: string;
  endDate?: string;
  crewId?: string;
  itemId?: string;
} = {}) {
  await connectDB();
  
  const query: any = {};
  
  // Filtro por rango de fechas
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) {
      query.createdAt.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      // Agregar 23:59:59 al último día
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      query.createdAt.$lte = endDate;
    }
  }
  
  // Filtros adicionales
  if (filters.crewId) query.crew = filters.crewId;
  if (filters.itemId) query.item = filters.itemId;
  
  const results = await InventoryHistoryModel.find(query)
    .populate("item", "code description")
    .populate("crew", "name")
    .populate("order", "subscriberNumber")
    .sort({ createdAt: -1 });
  
  // Convertir a objetos planos después del populate
  return results.map(doc => doc.toObject());
}

export async function getInventoryHistoryById(id: string) {
  await connectDB();
  return await InventoryHistoryModel.findById(id).lean();
}

export async function updateInventoryHistory(id: string, data: any) {
  await connectDB();
  return await InventoryHistoryModel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  ).lean();
}

export async function deleteInventoryHistory(id: string) {
  await connectDB();
  return await InventoryHistoryModel.findByIdAndDelete(id).lean();
}
