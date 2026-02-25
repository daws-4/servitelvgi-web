import InventoryHistoryModel from "@/models/InventoryHistory";
import UserModel from "@/models/User";
import InstallerModel from "@/models/Installer";
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
  page?: number;
  limit?: number;
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

  // Pagination logic
  const page = filters.page || 1;
  const limit = filters.limit || 0; // 0 means no limit (all records)
  const skip = (page - 1) * limit;

  // Run count and find in parallel to save a round-trip
  let queryBuilder = InventoryHistoryModel.find(query)
    .populate("item", "code description")
    .populate("crew", "name")
    .populate("order", "subscriberNumber ticket_id")
    .sort({ createdAt: -1 });

  if (limit > 0) {
    queryBuilder = queryBuilder.skip(skip).limit(limit);
  }

  const [total, results] = await Promise.all([
    InventoryHistoryModel.countDocuments(query),
    queryBuilder.lean(),
  ]);

  // --- Batch populate performedBy (replaces N+1 individual queries) ---
  const userIds: any[] = [];
  const installerIds: any[] = [];

  for (const doc of results as any[]) {
    if (!doc.performedBy || !doc.performedByModel) continue;
    if (doc.performedByModel === 'User') userIds.push(doc.performedBy);
    else if (doc.performedByModel === 'Installer') installerIds.push(doc.performedBy);
  }

  const [users, installers] = await Promise.all([
    userIds.length > 0
      ? UserModel.find({ _id: { $in: userIds } }).select('name surname username').lean()
      : Promise.resolve([]),
    installerIds.length > 0
      ? InstallerModel.find({ _id: { $in: installerIds } }).select('name surname').lean()
      : Promise.resolve([]),
  ]);

  const userMap = new Map((users as any[]).map((u) => [u._id.toString(), u]));
  const installerMap = new Map((installers as any[]).map((i) => [i._id.toString(), i]));

  const populatedResults = (results as any[]).map((doc: any) => {
    if (!doc.performedBy || !doc.performedByModel) return doc;
    const id = doc.performedBy.toString();
    if (doc.performedByModel === 'User') {
      doc.performedBy = userMap.get(id) ?? doc.performedBy;
    } else if (doc.performedByModel === 'Installer') {
      doc.performedBy = installerMap.get(id) ?? doc.performedBy;
    }
    return doc;
  });

  return {
    data: populatedResults,
    pagination: {
      total,
      page,
      limit,
      pages: limit > 0 ? Math.ceil(total / limit) : 1
    }
  };
}

export async function getInventoryHistoryById(id: string) {
  await connectDB();
  const doc = await InventoryHistoryModel.findById(id)
    .populate("item", "code description")
    .populate("crew", "name")
    .populate("order", "subscriberNumber ticket_id")
    .lean();

  if (!doc) return null;

  // Manually populate performedBy
  const result: any = doc;
  if (result.performedBy && result.performedByModel) {
    try {
      if (result.performedByModel === 'User') {
        const user = await UserModel.findById(result.performedBy)
          .select('name surname username')
          .lean();
        result.performedBy = user;
      } else if (result.performedByModel === 'Installer') {
        const installer = await InstallerModel.findById(result.performedBy)
          .select('name surname')
          .lean();
        result.performedBy = installer;
      }
    } catch (error) {
      console.error('Error populating performedBy:', error);
    }
  }

  return result;
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
