/**
 * Token Cleanup Service
 * Removes expired push tokens (older than 90 days)
 */

import InstallerModel from "@/models/Installer";
import { connectDB } from "@/lib/db";

export interface CleanupResult {
    success: boolean;
    tokensRemoved: number;
    error?: string;
}

/**
 * Clean up push tokens that haven't been updated in 90+ days
 * @param daysThreshold - Number of days after which to remove tokens (default: 90)
 * @returns Cleanup result with count of removed tokens
 */
export async function cleanupExpiredTokens(
    daysThreshold: number = 90
): Promise<CleanupResult> {
    try {
        await connectDB();

        // Calculate cutoff date (90 days ago)
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

        console.log(`🧹 Starting token cleanup for tokens older than ${daysThreshold} days (before ${cutoffDate.toISOString()})`);

        // Find installers with expired tokens
        const result = await InstallerModel.updateMany(
            {
                pushToken: { $ne: null },
                $or: [
                    { pushTokenUpdatedAt: { $lt: cutoffDate } },
                    { pushTokenUpdatedAt: null }, // Also clean tokens without update date
                ],
            },
            {
                $set: {
                    pushToken: null,
                    pushTokenUpdatedAt: null,
                },
            }
        );

        const tokensRemoved = result.modifiedCount;

        console.log(`✅ Token cleanup complete: ${tokensRemoved} expired tokens removed`);

        return {
            success: true,
            tokensRemoved,
        };
    } catch (error: any) {
        console.error("❌ Error during token cleanup:", error);
        return {
            success: false,
            tokensRemoved: 0,
            error: error.message || "Unknown error during cleanup",
        };
    }
}

/**
 * Get statistics about push tokens
 * @returns Token statistics
 */
export async function getTokenStatistics(): Promise<{
    total: number;
    active: number;
    expired: number;
    withoutDate: number;
}> {
    try {
        await connectDB();

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 90);

        const total = await InstallerModel.countDocuments({ pushToken: { $ne: null } });

        const expired = await InstallerModel.countDocuments({
            pushToken: { $ne: null },
            pushTokenUpdatedAt: { $lt: cutoffDate },
        });

        const withoutDate = await InstallerModel.countDocuments({
            pushToken: { $ne: null },
            pushTokenUpdatedAt: null,
        });

        const active = total - expired - withoutDate;

        return {
            total,
            active,
            expired,
            withoutDate,
        };
    } catch (error: any) {
        console.error("Error getting token statistics:", error);
        return {
            total: 0,
            active: 0,
            expired: 0,
            withoutDate: 0,
        };
    }
}
