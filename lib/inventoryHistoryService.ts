import InventoryHistoryModel from "@/models/InventoryHistory";
import { connectDB } from "@/lib/db";

export async function createInventoryHistory(data: any) {
  await connectDB();
  return await InventoryHistoryModel.create(data);
}

export async function getInventoryHistories(filters = {}) {
  await connectDB();
  return await InventoryHistoryModel.find(filters).sort({ createdAt: -1 });
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
