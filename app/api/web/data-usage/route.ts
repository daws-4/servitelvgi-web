import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DataUsageModel from "@/models/DataUsage";
import { getUserFromRequest, getInstallerFromBearerToken } from "@/lib/authHelpers";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
    await connectDB();
    try {
        const body = await request.json();

        // Auth check
        let sessionUser = await getUserFromRequest(request);
        if (!sessionUser) {
            const authHeader = request.headers.get('Authorization');
            sessionUser = await getInstallerFromBearerToken(authHeader);
        }

        if (!sessionUser) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401, headers: CORS_HEADERS }
            );
        }

        const { Installer_id, MobileData, WifiData } = body;

        // Basic validation
        if (!Installer_id || !MobileData || !WifiData) {
            return NextResponse.json(
                { error: "Missing required fields: Installer_id, MobileData, WifiData" },
                { status: 400, headers: CORS_HEADERS }
            );
        }

        const newDataUsage = await DataUsageModel.create({
            Installer_id,
            MobileData,
            WifiData
        });

        return NextResponse.json(newDataUsage, { status: 201, headers: CORS_HEADERS });
    } catch (err: any) {
        console.error("Error creating DataUsage:", err);
        return NextResponse.json(
            { error: err.message || "Internal Server Error" },
            { status: 500, headers: CORS_HEADERS }
        );
    }
}

export async function GET(request: NextRequest) {
    await connectDB();
    try {
        // Auth check
        let sessionUser = await getUserFromRequest(request);
        if (!sessionUser) {
            const authHeader = request.headers.get('Authorization');
            sessionUser = await getInstallerFromBearerToken(authHeader);
        }

        if (!sessionUser) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401, headers: CORS_HEADERS }
            );
        }

        const url = new URL(request.url);
        const installerId = url.searchParams.get("installerId");

        const startDate = url.searchParams.get("startDate");
        const endDate = url.searchParams.get("endDate");

        const query: any = {};
        if (installerId) {
            query.Installer_id = installerId;
        }

        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // Sort by createdAt desc by default
        const data = await DataUsageModel.find(query).sort({ createdAt: -1 });

        return NextResponse.json(data, { status: 200, headers: CORS_HEADERS });
    } catch (err: any) {
        console.error("Error fetching DataUsage:", err);
        return NextResponse.json(
            { error: err.message || "Internal Server Error" },
            { status: 500, headers: CORS_HEADERS }
        );
    }
}

export async function PUT(request: NextRequest) {
    await connectDB();
    try {
        // Auth check
        let sessionUser = await getUserFromRequest(request);
        if (!sessionUser) {
            const authHeader = request.headers.get('Authorization');
            sessionUser = await getInstallerFromBearerToken(authHeader);
        }

        if (!sessionUser) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401, headers: CORS_HEADERS }
            );
        }

        const url = new URL(request.url);
        const id = url.searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Missing required parameter: id" },
                { status: 400, headers: CORS_HEADERS }
            );
        }

        const body = await request.json();
        const { Installer_id, MobileData, WifiData } = body;
 
        const updatedDataUsage = await DataUsageModel.findByIdAndUpdate(
            id,
            {
                Installer_id,
                MobileData,
                WifiData,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!updatedDataUsage) {
            return NextResponse.json(
                { error: "Data usage record not found" },
                { status: 404, headers: CORS_HEADERS }
            );
        }

        return NextResponse.json(updatedDataUsage, { status: 200, headers: CORS_HEADERS });
    } catch (err: any) {
        console.error("Error updating DataUsage:", err);
        return NextResponse.json(
            { error: err.message || "Internal Server Error" },
            { status: 500, headers: CORS_HEADERS }
        );
    }
}
