import { NextRequest, NextResponse } from "next/server";
import UserModel from "@/models/User";
import { connectDB } from "@/lib/db";
import { getUserFromRequest } from "@/lib/authHelpers";

export async function POST(request: NextRequest) {
    try {
        const sessionUser = await getUserFromRequest(request);
        if (!sessionUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        await connectDB();

        const user = await UserModel.findById(userId).select("isAutopilot").lean() as any;
        const newState = !(user?.isAutopilot);

        const updated = await UserModel.findByIdAndUpdate(userId, { $set: { isAutopilot: newState } }, { new: true }).lean();

        return NextResponse.json(updated);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
