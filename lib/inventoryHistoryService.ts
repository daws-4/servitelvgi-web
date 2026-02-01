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

  // Get total count for pagination metadata
  const total = await InventoryHistoryModel.countDocuments(query);

  let queryBuilder = InventoryHistoryModel.find(query)
    .populate("item", "code description")
    .populate("crew", "name")
    .populate("order", "subscriberNumber ticket_id")
    .sort({ createdAt: -1 });

  // Apply limit and skip only if limit is set
  if (limit > 0) {
    queryBuilder = queryBuilder.skip(skip).limit(limit);
  }

  const results = await queryBuilder.lean();

  // Manually populate performedBy based on performedByModel
  const populatedResults = await Promise.all(
    results.map(async (doc: any) => {
      if (doc.performedBy && doc.performedByModel) {
        try {
          if (doc.performedByModel === 'User') {
            const user = await UserModel.findById(doc.performedBy)
              .select('name surname username')
              .lean();
            doc.performedBy = user;
          } else if (doc.performedByModel === 'Installer') {
            const installer = await InstallerModel.findById(doc.performedBy)
              .select('name surname')
              .lean();
            doc.performedBy = installer;
          }
        } catch (error) {
          console.error('Error populating performedBy:', error);
          // Keep the ID if population fails
        }
      }
      return doc;
    })
  );

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
