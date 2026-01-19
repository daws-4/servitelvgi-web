/**
 * Firebase Cloud Messaging Service
 * Sends push notifications directly using Firebase Admin SDK
 * This bypasses Expo servers and uses FCM directly
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
// Initialize Firebase Admin if not already initialized
function initializeFirebaseAdmin() {
    if (admin.apps.length === 0) {
        // Try to load credentials from environment variables
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        // Handle private key newlines
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (projectId && clientEmail && privateKey) {
            const serviceAccount = {
                projectId,
                clientEmail,
                privateKey,
            };

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });

            console.log('✅ Firebase Admin initialized');
        } else {
            console.error('❌ Missing Firebase credentials in environment variables');
            throw new Error('Firebase credentials missing. Please check .env file');
        }
    }

    return admin.messaging();
}

export interface FCMNotificationMessage {
    /**
     * Expo push token (will be converted to FCM token)
     */
    to: string;

    /**
     * Notification title
     */
    title: string;

    /**
     * Notification body text
     */
    body: string;

    /**
     * Additional data to send with notification
     */
    data?: Record<string, any>;

    /**
     * Sound to play ('default' or null)
     */
    sound?: 'default' | null;

    /**
     * Priority ('default', 'normal', 'high')
     */
    priority?: 'default' | 'normal' | 'high';
}

/**
 * Convert Expo push token to FCM token
 * WARNING: Expo tokens and FCM tokens are different!
 * This function can only extract the payload from ExponentPushToken format,
 * but that payload is still an Expo token, NOT an FCM token.
 */
function extractFCMToken(expoPushToken: string): string {
    // Check if this is an Expo token
    if (expoPushToken.startsWith('ExponentPushToken[')) {
        // Extract the token from ExponentPushToken[xxx]
        const match = expoPushToken.match(/ExponentPushToken\[(.*?)\]/);
        const extracted = match ? match[1] : expoPushToken;

        console.warn('⚠️ [FCM] Detected Expo Push Token format. Note: Expo tokens are NOT compatible with FCM direct API.');
        console.warn('⚠️ [FCM] To use FCM directly, the mobile app must register for FCM tokens, not Expo tokens.');

        return extracted;
    }

    // Return as-is if it's already an FCM token
    return expoPushToken;
}

/**
 * Send push notification using Firebase Cloud Messaging directly
 */
export async function sendFCMNotification(
    message: FCMNotificationMessage
): Promise<string> {
    try {
        const messaging = initializeFirebaseAdmin();

        // Extract FCM token from Expo format if needed
        const fcmToken = extractFCMToken(message.to);

        // Validate token format (FCM tokens are long alphanumeric strings, typically 140+ chars)
        if (fcmToken.length < 100) {
            throw new Error(
                `Invalid FCM token format. Token appears to be an Expo token, not an FCM token. ` +
                `Please update your mobile app to register for FCM tokens instead of Expo tokens. ` +
                `Current token: ${fcmToken.substring(0, 20)}...`
            );
        }

        console.log('📤 [FCM] Sending notification to:', fcmToken.substring(0, 20) + '...');

        // Build FCM message
        const fcmMessage: admin.messaging.Message = {
            token: fcmToken,
            notification: {
                title: message.title,
                body: message.body,
            },
            data: message.data ? Object.fromEntries(
                Object.entries(message.data).map(([k, v]) => [k, String(v)])
            ) : undefined,
            android: {
                priority: message.priority === 'high' ? 'high' : 'normal',
                notification: {
                    sound: message.sound || 'default',
                    channelId: 'default',
                },
            },
        };

        console.log('📦 [FCM] Notification data payload:', JSON.stringify(fcmMessage.data, null, 2));

        // Send message
        const messageId = await messaging.send(fcmMessage);

        console.log('✅ [FCM] Notification sent successfully. Message ID:', messageId);

        return messageId;

    } catch (error: any) {
        console.error('❌ [FCM] Error sending notification:', error);
        throw error;
    }
}

/**
 * Send notification to multiple devices
 */
export async function sendFCMMulticast(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, any>
): Promise<{ successCount: number; failureCount: number }> {
    try {
        const messaging = initializeFirebaseAdmin();

        // Extract FCM tokens
        const fcmTokens = tokens.map(extractFCMToken);

        console.log(`📤 [FCM] Sending notification to ${fcmTokens.length} devices`);

        // Build multicast message
        const message: admin.messaging.MulticastMessage = {
            tokens: fcmTokens,
            notification: {
                title,
                body,
            },
            data: data ? Object.fromEntries(
                Object.entries(data).map(([k, v]) => [k, String(v)])
            ) : undefined,
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    channelId: 'default',
                },
            },
        };

        // Send multicast
        const response = await messaging.sendEachForMulticast(message);

        console.log(`✅ [FCM] Multicast result: ${response.successCount} success, ${response.failureCount} failure`);

        return {
            successCount: response.successCount,
            failureCount: response.failureCount,
        };

    } catch (error: any) {
        console.error('❌ [FCM] Error sending multicast:', error);
        throw error;
    }
}
