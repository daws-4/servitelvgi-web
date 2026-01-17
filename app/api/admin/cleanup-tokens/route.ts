import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/authHelpers";
import { cleanupExpiredTokens, getTokenStatistics } from "@/lib/tokenCleanupService";

/**
 * POST /api/admin/cleanup-tokens
 * Manually trigger cleanup of expired push tokens (admin only)
 */
export async function POST(request: NextRequest) {
    try {
        const sessionUser = await getUserFromRequest(request);

        // Admin-only endpoint
        if (!sessionUser || sessionUser.role !== 'admin') {
            return NextResponse.json(
                { error: "Unauthorized - admin access required" },
                { status: 401 }
            );
        }

        // Get statistics before cleanup
        const statsBefore = await getTokenStatistics();

        // Perform cleanup
        const result = await cleanupExpiredTokens();

        // Get statistics after cleanup
        const statsAfter = await getTokenStatistics();

        return NextResponse.json({
            success: result.success,
            tokensRemoved: result.tokensRemoved,
            error: result.error,
            statistics: {
                before: statsBefore,
                after: statsAfter,
            },
        });

    } catch (err: any) {
        console.error("Error in cleanup-tokens endpoint:", err);
        return NextResponse.json(
            { error: err.message || "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/admin/cleanup-tokens
 * Get current token statistics without cleaning
 */
export async function GET(request: NextRequest) {
    try {
        const sessionUser = await getUserFromRequest(request);

        // Admin-only endpoint
        if (!sessionUser || sessionUser.role !== 'admin') {
            return NextResponse.json(
                { error: "Unauthorized - admin access required" },
                { status: 401 }
            );
        }

        const stats = await getTokenStatistics();

        return NextResponse.json({
            success: true,
            statistics: stats,
        });

    } catch (err: any) {
        console.error("Error getting token statistics:", err);
        return NextResponse.json(
            { error: err.message || "Internal server error" },
            { status: 500 }
        );
    }
}
