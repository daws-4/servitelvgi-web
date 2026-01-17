/**
 * Crew Notification Helper
 * Hybrid notification service that supports both Expo and FCM tokens
 * Sends notifications to all crew members with optional installer exclusion
 */

import { sendPushNotification } from '@/lib/pushNotificationService';
import { sendFCMNotification, sendFCMMulticast } from '@/lib/fcmNotificationService';
import { getCrewById } from '@/lib/crewService';
import { getInstallerById } from '@/lib/installerService';

/**
 * Detect if a token is an Expo token or FCM token
 */
function detectTokenType(token: string): 'expo' | 'fcm' {
    if (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')) {
        return 'expo';
    }
    // FCM tokens are typically long alphanumeric strings (140+ chars)
    return 'fcm';
}

/**
 * Send hybrid notification to all crew members
 * Automatically detects token types and routes to appropriate service
 * 
 * @param crewId - The crew ID to send notifications to
 * @param title - Notification title
 * @param body - Notification body
 * @param data - Additional data payload
 * @param excludeInstallerId - Optional: Exclude this installer from receiving notification
 * @returns Number of notifications sent successfully
 */
export async function sendHybridNotificationToCrew(
    crewId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
    excludeInstallerId?: string
): Promise<number> {
    try {
        // Get crew with populated members
        const crew = await getCrewById(crewId);

        if (!crew) {
            console.warn(`Crew ${crewId} not found`);
            return 0;
        }

        // Collect all installer IDs (leader + members)
        const installerIds: string[] = [];

        if (crew.leader) {
            const leaderId = typeof crew.leader === 'string'
                ? crew.leader
                : (crew.leader._id?.toString() || crew.leader.toString());
            installerIds.push(leaderId);
        }

        if (crew.members && Array.isArray(crew.members)) {
            crew.members.forEach(member => {
                // Handle both string IDs and populated objects
                let memberId: string;
                if (typeof member === 'string') {
                    memberId = member;
                } else if (member && typeof member === 'object') {
                    // It's a populated object with _id
                    memberId = (member as any)._id?.toString() || member.toString();
                } else {
                    memberId = String(member);
                }

                if (memberId && memberId !== '[object Object]') {
                    installerIds.push(memberId);
                }
            });
        }

        console.log(`👥 Found ${installerIds.length} installers in crew ${crewId}`);

        // Filter out excluded installer if provided
        let filteredInstallerIds = installerIds;
        if (excludeInstallerId) {
            filteredInstallerIds = installerIds.filter(id => id !== excludeInstallerId);
            if (filteredInstallerIds.length < installerIds.length) {
                console.log(`🚫 Excluding installer ${excludeInstallerId} from notifications`);
            }
        }

        if (filteredInstallerIds.length === 0) {
            console.log(`No installers to notify in crew ${crewId} after exclusions`);
            return 0;
        }

        // Fetch push tokens for all installers
        const installerTokens: { installerId: string; token: string; type: 'expo' | 'fcm' }[] = [];

        for (const installerId of filteredInstallerIds) {
            try {
                const installer = await getInstallerById(installerId);
                if (installer?.pushToken) {
                    const tokenType = detectTokenType(installer.pushToken);
                    installerTokens.push({
                        installerId,
                        token: installer.pushToken,
                        type: tokenType
                    });
                }
            } catch (err) {
                console.warn(`Could not fetch installer ${installerId}:`, err);
            }
        }

        if (installerTokens.length === 0) {
            console.log(`No push tokens found for crew ${crewId}`);
            return 0;
        }

        // Group tokens by type
        const expoTokens = installerTokens.filter(t => t.type === 'expo').map(t => t.token);
        const fcmTokens = installerTokens.filter(t => t.type === 'fcm').map(t => t.token);

        console.log(`📊 Token distribution for crew ${crewId}: ${expoTokens.length} Expo, ${fcmTokens.length} FCM`);

        let successCount = 0;
        let failureCount = 0;

        // Send to Expo tokens
        if (expoTokens.length > 0) {
            console.log(`📤 [EXPO] Sending to ${expoTokens.length} Expo tokens...`);
            console.log(`📤 [EXPO] Tokens:`, expoTokens.map(t => t.substring(0, 25) + '...'));
            console.log(`📤 [EXPO] Title: "${title}"`);
            console.log(`📤 [EXPO] Body: "${body}"`);
            try {
                await sendPushNotification({
                    to: expoTokens,
                    title,
                    body,
                    data,
                    sound: 'default',
                    priority: 'high',
                });
                successCount += expoTokens.length;
                console.log(`✅ Expo notifications sent successfully`);
            } catch (err) {
                console.error(`Failed to send to Expo tokens:`, err);
                failureCount += expoTokens.length;
            }
        }

        // Send to FCM tokens
        if (fcmTokens.length > 0) {
            console.log(`📤 Sending to ${fcmTokens.length} FCM tokens...`);
            try {
                if (fcmTokens.length === 1) {
                    // Single FCM notification
                    await sendFCMNotification({
                        to: fcmTokens[0],
                        title,
                        body,
                        data,
                        sound: 'default',
                        priority: 'high',
                    });
                    successCount++;
                } else {
                    // FCM multicast
                    const result = await sendFCMMulticast(
                        fcmTokens,
                        title,
                        body,
                        data
                    );
                    successCount += result.successCount;
                    failureCount += result.failureCount;
                }
                console.log(`✅ FCM notifications sent successfully`);
            } catch (err) {
                console.error(`Failed to send FCM notifications:`, err);
                failureCount += fcmTokens.length;
            }
        }

        const total = successCount + failureCount;
        console.log(`✅ Sent ${successCount}/${total} notifications to crew ${crewId}`);

        return successCount;

    } catch (error: any) {
        console.error(`Error sending hybrid notification to crew ${crewId}:`, error);
        throw error;
    }
}
