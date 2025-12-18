import OrderHistoryModel from "@/models/OrderHistory";
import { connectDB } from "@/lib/db";

export async function createOrderHistory(data: any) {
  await connectDB();
  return await OrderHistoryModel.create(data);
}

export async function getOrderHistories(filters: {
  startDate?: string;
  endDate?: string;
  orderId?: string;
  crewId?: string;
  changeType?: string;
} = {}) {
  await connectDB();
  
  const query: any = {};
  
  // Filter by date range
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) {
      query.createdAt.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      // Add 23:59:59 to the last day
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      query.createdAt.$lte = endDate;
    }
  }
  
  // Additional filters
  if (filters.orderId) query.order = filters.orderId;
  if (filters.crewId) query.crew = filters.crewId;
  if (filters.changeType) query.changeType = filters.changeType;
  
  const results = await OrderHistoryModel.find(query)
    .populate("order", "subscriberNumber subscriberName")
    .populate("crew", "name")
    .populate("changedBy", "name surname username")
    .sort({ createdAt: -1 });
  
  // Convert to plain objects after populate
  return results.map(doc => doc.toObject());
}

export async function getOrderHistoryById(id: string) {
  await connectDB();
  return await OrderHistoryModel.findById(id)
    .populate("changedBy", "name surname username")
    .lean();
}

export async function updateOrderHistory(id: string, data: any) {
  await connectDB();
  return await OrderHistoryModel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  ).lean();
}

export async function deleteOrderHistory(id: string) {
  await connectDB();
  return await OrderHistoryModel.findByIdAndDelete(id).lean();
}
