import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/authHelpers";
import NotificationMetricsModel from "@/models/NotificationMetrics";
import { connectDB } from "@/lib/db";

/**
 * GET /api/admin/notification-metrics
 * Retrieve notification delivery metrics (admin only)
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

        await connectDB();

        // Get query params
        const { searchParams } = new URL(request.url);
        const daysParam = searchParams.get('days');
        const days = daysParam ? parseInt(daysParam, 10) : 7;

        // Calculate date range
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        // Fetch metrics
        const metrics = await NotificationMetricsModel.find({
            date: {
                $gte: startDate,
                $lte: endDate,
            },
        })
            .sort({ date: -1, type: 1 })
            .lean();

        // Calculate totals
        const totals = {
            sent: 0,
            successful: 0,
            failed: 0,
        };

        const byType: Record<string, { sent: number; successful: number; failed: number }> = {};

        metrics.forEach((metric: any) => {
            totals.sent += metric.sent;
            totals.successful += metric.successful;
            totals.failed += metric.failed;

            if (!byType[metric.type]) {
                byType[metric.type] = { sent: 0, successful: 0, failed: 0 };
            }
            byType[metric.type].sent += metric.sent;
            byType[metric.type].successful += metric.successful;
            byType[metric.type].failed += metric.failed;
        });

        // Format metrics with success rate
        const formattedMetrics = metrics.map((metric: any) => ({
            date: metric.date,
            type: metric.type,
            sent: metric.sent,
            successful: metric.successful,
            failed: metric.failed,
            successRate: metric.sent > 0
                ? Number(((metric.successful / metric.sent) * 100).toFixed(2))
                : 100,
            errors: metric.errors,
        }));

        // Calculate overall success rate
        const overallSuccessRate = totals.sent > 0
            ? Number(((totals.successful / totals.sent) * 100).toFixed(2))
            : 100;

        return NextResponse.json({
            success: true,
            period: {
                start: startDate,
                end: endDate,
                days,
            },
            totals: {
                ...totals,
                successRate: overallSuccessRate,
            },
            byType,
            metrics: formattedMetrics,
        });

    } catch (err: any) {
        console.error("Error retrieving notification metrics:", err);
        return NextResponse.json(
            { error: err.message || "Internal server error" },
            { status: 500 }
        );
    }
}
