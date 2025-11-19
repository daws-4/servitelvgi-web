import InventoryModel from "@/models/Inventory";
import { connectDB } from "@/lib/db";

export async function createInventory(data: any) {
  await connectDB();
  return await InventoryModel.create(data);
}

export async function getInventories(filters = {}) {
  await connectDB();
  return await InventoryModel.find(filters).sort({ createdAt: -1 });
}

export async function getInventoryById(id: string) {
  await connectDB();
  return await InventoryModel.findById(id).lean();
}

export async function updateInventory(id: string, data: any) {
  await connectDB();
  return await InventoryModel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  ).lean();
}

export async function deleteInventory(id: string) {
  await connectDB();
  return await InventoryModel.findByIdAndDelete(id).lean();
}
