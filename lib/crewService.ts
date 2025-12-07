import CrewModel from "@/models/Crew";
import { connectDB } from "@/lib/db";

export async function createCrew(data: any) {
  await connectDB();
  return await CrewModel.create(data);
}

export async function getCrews(filters = {}) {
  await connectDB();
  return await CrewModel.find(filters)
    .populate('leader', 'name surname role')
    .populate('members', 'name surname role')
    .sort({ createdAt: -1 });
}

export async function getCrewById(id: string) {
  await connectDB();
  return await CrewModel.findById(id)
    .populate('leader', 'name surname role')
    .populate('members', 'name surname role')
    .lean();
}

export async function updateCrew(id: string, data: any) {
  await connectDB();
  return await CrewModel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  )
    .populate('leader', 'name surname role')
    .populate('members', 'name surname role')
    .lean();
}

export async function deleteCrew(id: string) {
  await connectDB();
  return await CrewModel.findByIdAndDelete(id).lean();
}
