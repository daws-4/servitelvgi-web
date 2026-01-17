import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/authHelpers";
import { sendPushNotification } from "@/lib/pushNotificationService";
import { sendFCMNotification, sendFCMMulticast } from "@/lib/fcmNotificationService";
import { getInstallerById } from "@/lib/installerService";
import InstallerModel from "@/models/Installer";
import NotificationMetricsModel from "@/models/NotificationMetrics";
import { connectDB } from "@/lib/db";

/**
 * Detect if a token is an Expo token or FCM token
 */
function detectTokenType(token: string): 'expo' | 'fcm' {
    if (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')) {
        return 'expo';
    }
    return 'fcm';
}

/**
 * Record test notification metrics
 */
async function recordTestMetrics(sent: number, success: boolean): Promise<void> {
    try {
        await connectDB();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existingMetrics = await NotificationMetricsModel.findOne({
            date: today,
            type: 'test',
        });

        if (existingMetrics) {
            existingMetrics.sent += sent;
            if (success) {
                existingMetrics.successful += sent;
            } else {
                existingMetrics.failed += sent;
            }
            await existingMetrics.save();
        } else {
            await NotificationMetricsModel.create({
                date: today,
                type: 'test',
                sent,
                successful: success ? sent : 0,
                failed: success ? 0 : sent,
                errors: [],
            });
        }
    } catch (error) {
        console.error('Error recording test metrics:', error);
    }
}

/**
 * POST /api/test/push-notification
 * Send test push notification (admin only)
 * Supports both Expo and FCM tokens automatically
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

        const body = await request.json();
        const { crewId, installerId, title, body: messageBody } = body;

        // Validate that at least one target is provided
        if (!crewId && !installerId) {
            return NextResponse.json(
                { error: "Either crewId or installerId must be provided" },
                { status: 400 }
            );
        }

        const defaultTitle = "🧪 Test Notification";
        const defaultBody = "This is a test notification from the backend";

        let sent = 0;
        let recipients: string[] = [];
        let success = true;

        // Send to crew
        if (crewId) {
            try {
                console.log(`\n👥 [TEST NOTIFICATION] Sending to crew: ${crewId}`);

                // Get all installers in the crew
                await connectDB();
                const installers = await InstallerModel.find({
                    currentCrew: crewId,
                    pushToken: { $exists: true, $ne: null }
                }).select('pushToken username').lean();

                console.log(`📋 Found ${installers.length} installers with push tokens in crew ${crewId}`);

                if (installers.length === 0) {
                    return NextResponse.json(
                        { error: "No installers with push tokens found in this crew" },
                        { status: 400 }
                    );
                }

                // Group installers by token type
                const expoTokens: string[] = [];
                const fcmTokens: string[] = [];

                installers.forEach(inst => {
                    const token = inst.pushToken as string;
                    if (detectTokenType(token) === 'expo') {
                        expoTokens.push(token);
                    } else {
                        fcmTokens.push(token);
                    }
                });

                console.log(`📊 Token distribution: ${expoTokens.length} Expo, ${fcmTokens.length} FCM`);

                let successCount = 0;
                let failureCount = 0;

                // Send to Expo tokens
                if (expoTokens.length > 0) {
                    console.log(`📤 Sending to ${expoTokens.length} Expo tokens...`);
                    for (const token of expoTokens) {
                        try {
                            await sendPushNotification({
                                to: token,
                                title: title || defaultTitle,
                                body: messageBody || defaultBody,
                                data: {
                                    type: 'test',
                                    timestamp: new Date().toISOString(),
                                },
                            });
                            successCount++;
                        } catch (err) {
                            console.error(`Failed to send to Expo token:`, err);
                            failureCount++;
                        }
                    }
                }

                // Send to FCM tokens
                if (fcmTokens.length > 0) {
                    console.log(`📤 Sending to ${fcmTokens.length} FCM tokens...`);
                    try {
                        const result = await sendFCMMulticast(
                            fcmTokens,
                            title || defaultTitle,
                            messageBody || defaultBody,
                            {
                                type: 'test',
                                timestamp: new Date().toISOString(),
                            }
                        );
                        successCount += result.successCount;
                        failureCount += result.failureCount;
                    } catch (err) {
                        console.error(`Failed to send FCM multicast:`, err);
                        failureCount += fcmTokens.length;
                    }
                }

                console.log(`✅ Crew notification complete: ${successCount} success, ${failureCount} failures`);

                sent = successCount;
                recipients.push(`Crew ${crewId} (${successCount}/${installers.length} devices)`);

                if (failureCount > 0) {
                    console.log(`⚠️ Warning: ${failureCount} notifications failed`);
                }
            } catch (err: any) {
                console.log(`❌ [ERROR] Failed to send to crew ${crewId}:`, {
                    error: err.message,
                    stack: err.stack
                });
                success = false;
                return NextResponse.json(
                    { error: `Failed to send to crew: ${err.message}` },
                    { status: 500 }
                );
            }
        }

        // Send to specific installer
        if (installerId) {
            try {
                console.log(`\n📱 [TEST NOTIFICATION] Starting notification send to installer: ${installerId}`);
                console.log(`📋 Request data:`, { installerId, title, body: messageBody });

                const installer = await getInstallerById(installerId);
                console.log(`👤 Installer lookup result:`, installer ? {
                    id: installer._id,
                    username: installer.username,
                    name: installer.name,
                    hasPushToken: !!installer.pushToken,
                    pushToken: installer.pushToken ? `${installer.pushToken.substring(0, 20)}...` : null
                } : 'NOT FOUND');

                if (!installer) {
                    console.log(`❌ [ERROR] Installer not found: ${installerId}`);
                    return NextResponse.json(
                        { error: "Installer not found" },
                        { status: 404 }
                    );
                }

                if (!installer.pushToken) {
                    console.log(`❌ [ERROR] Installer ${installerId} does not have a push token registered`);
                    return NextResponse.json(
                        { error: "Installer does not have a push token registered" },
                        { status: 400 }
                    );
                }

                const notificationPayload = {
                    to: installer.pushToken,
                    title: title || defaultTitle,
                    body: messageBody || defaultBody,
                    data: {
                        type: 'test',
                        timestamp: new Date().toISOString(),
                    },
                };

                // Detect token type and use appropriate service
                const tokenType = detectTokenType(installer.pushToken);
                console.log(`🔍 Detected token type: ${tokenType}`);

                console.log(`📤 Sending ${tokenType.toUpperCase()} notification with payload:`, {
                    to: `${installer.pushToken.substring(0, 20)}...`,
                    title: notificationPayload.title,
                    body: notificationPayload.body,
                    data: notificationPayload.data
                });

                if (tokenType === 'expo') {
                    // Use Expo push notification service
                    const result = await sendPushNotification(notificationPayload);
                    console.log(`✅ Expo notification sent successfully. Result:`, result);
                } else {
                    // Use FCM direct API
                    const messageId = await sendFCMNotification(notificationPayload);
                    console.log(`✅ FCM notification sent successfully. Message ID:`, messageId);
                }

                sent = 1;
                recipients.push(`Installer ${installerId} (${tokenType.toUpperCase()})`);
            } catch (err: any) {
                console.log(`❌ [ERROR] Failed to send notification to installer ${installerId}:`, {
                    error: err.message,
                    stack: err.stack
                });
                success = false;
                return NextResponse.json(
                    { error: `Failed to send to installer: ${err.message}` },
                    { status: 500 }
                );
            }
        }

        // Record metrics
        if (sent > 0) {
            await recordTestMetrics(sent, success);
        }

        return NextResponse.json({
            success: true,
            sent,
            recipients,
            message: `Test notification sent to ${sent} device(s)`,
        });

    } catch (err: any) {
        console.error("Error sending test notification:", err);
        return NextResponse.json(
            { error: err.message || "Internal server error" },
            { status: 500 }
        );
    }
}
