/**
 * Push Notification Service
 * Handles sending push notifications via Expo Push Service
 */

import NotificationMetricsModel from '@/models/NotificationMetrics';
import { connectDB } from '@/lib/db';

export interface PushNotificationMessage {
  /**
   * Expo push token(s) to send to
   */
  to: string | string[];

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
   * Badge number (iOS)
   */
  badge?: number;

  /**
   * Priority ('default', 'normal', 'high')
   */
  priority?: 'default' | 'normal' | 'high';

  /**
   * Time to live in seconds
   */
  ttl?: number;
}

export interface PushNotificationReceipt {
  /**
   * Status of the push notification
   */
  status: 'ok' | 'error';

  /**
   * Receipt ID for tracking
   */
  id?: string;

  /**
   * Error message if failed
   */
  message?: string;

  /**
   * Error details if failed
   */
  details?: any;
}

/**
 * Record notification metrics to database
 */
async function recordMetrics(
  type: 'new_order' | 'order_reassigned' | 'status_change' | 'test' | 'other',
  sent: number,
  receipts: PushNotificationReceipt[]
): Promise<void> {
  try {
    await connectDB();

    // Count successful and failed
    let successful = 0;
    let failed = 0;
    const errorMap = new Map<string, number>();

    receipts.forEach((receipt) => {
      if (receipt.status === 'ok') {
        successful++;
      } else {
        failed++;
        const errorMsg = receipt.message || 'Unknown error';
        errorMap.set(errorMsg, (errorMap.get(errorMsg) || 0) + 1);
      }
    });

    // Get today's date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find or create today's metrics entry
    const existingMetrics = await NotificationMetricsModel.findOne({
      date: today,
      type,
    });

    if (existingMetrics) {
      // Update existing metrics
      existingMetrics.sent += sent;
      existingMetrics.successful += successful;
      existingMetrics.failed += failed;

      // Merge error counts
      errorMap.forEach((count, message) => {
        const existingError = existingMetrics.errors.find(
          (e: any) => e.message === message
        );
        if (existingError) {
          existingError.count += count;
        } else {
          existingMetrics.errors.push({ message, count });
        }
      });

      await existingMetrics.save();
    } else {
      // Create new metrics entry
      await NotificationMetricsModel.create({
        date: today,
        type,
        sent,
        successful,
        failed,
        errors: Array.from(errorMap.entries()).map(([message, count]) => ({
          message,
          count,
        })),
      });
    }
  } catch (error: any) {
    console.error('Error recording notification metrics:', error);
    // Don't throw - metrics failure shouldn't break notifications
  }
}

/**
 * Send a push notification via Expo Push Service
 */
export async function sendPushNotification(
  message: PushNotificationMessage
): Promise<PushNotificationReceipt[]> {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: message.to,
        title: message.title,
        body: message.body,
        data: message.data || {},
        sound: message.sound ?? 'default',
        badge: message.badge,
        priority: message.priority ?? 'high',
        ttl: message.ttl,
      }),
    });

    if (!response.ok) {
      throw new Error(`Expo Push API error: ${response.statusText}`);
    }

    const result = await response.json();

    // Expo returns an array of receipts
    return Array.isArray(result.data) ? result.data : [result.data];

  } catch (error: any) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

/**
 * Send push notification to all installers in a crew
 * @deprecated Use sendHybridNotificationToCrew for better support and installer exclusion
 */
export async function sendNotificationToCrew(
  crewId: string,
  title: string,
  body: string,
  data?: Record<string, any>,
  excludeInstallerId?: string  // ⭐ Added parameter
): Promise<number> {
  try {
    // Import here to avoid circular dependencies
    const { getCrewById } = await import('@/lib/crewService');
    const { getInstallerById } = await import('@/lib/installerService');

    // Get crew with populated members
    const crew = await getCrewById(crewId);

    if (!crew) {
      console.warn(`Crew ${crewId} not found`);
      return 0;
    }

    // Collect all installer IDs (leader + members)
    const installerIds: string[] = [];

    if (crew.leader) {
      // Handle both ObjectId and populated object
      const leaderId = typeof crew.leader === 'object' && crew.leader._id
        ? crew.leader._id.toString()
        : typeof crew.leader === 'string'
          ? crew.leader
          : crew.leader.toString();
      installerIds.push(leaderId);
    }

    if (crew.members && Array.isArray(crew.members)) {
      crew.members.forEach(member => {
        // Handle both ObjectId and populated object
        const memberId = typeof member === 'object' && member._id
          ? member._id.toString()
          : typeof member === 'string'
            ? member
            : member.toString();
        if (memberId && memberId !== '[object Object]') {
          installerIds.push(memberId);
        }
      });
    }

    // Filter out excluded installer if provided (⭐ ADDED)
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
    const pushTokens: string[] = [];

    for (const installerId of filteredInstallerIds) {  // ⭐ Changed from installerIds
      try {
        const installer = await getInstallerById(installerId);
        if (installer?.pushToken) {
          pushTokens.push(installer.pushToken);
        }
      } catch (err) {
        console.warn(`Could not fetch installer ${installerId}:`, err);
      }
    }

    if (pushTokens.length === 0) {
      console.log(`No push tokens found for crew ${crewId}`);
      return 0;
    }

    // Send notification to all tokens
    await sendPushNotification({
      to: pushTokens,
      title,
      body,
      data,
      sound: 'default',
      priority: 'high',
    });

    console.log(`✅ Sent push notification to ${pushTokens.length} installers in crew ${crewId}`);

    return pushTokens.length;

  } catch (error: any) {
    console.error(`Error sending notification to crew ${crewId}:`, error);
    throw error;
  }
}

/**
 * Send notification when new order is assigned to crew
 */
export async function notifyNewOrderAssigned(
  orderId: string,
  crewId: string,
  orderDetails: {
    subscriberName: string;
    address: string;
    type: string;
  },
  excludeInstallerId?: string  // ⭐ Added parameter
): Promise<void> {
  try {
    // Import hybrid notification helper
    const { sendHybridNotificationToCrew } = await import('@/lib/crewNotificationHelper');

    const sent = await sendHybridNotificationToCrew(
      crewId,
      '📦 Nueva Orden Asignada',
      `${orderDetails.subscriberName} - ${orderDetails.address}`,
      {
        type: 'new_order',
        orderId,
        screen: '/orders',
        action: 'view_order'
      },
      excludeInstallerId  // ⭐ Pass exclusion parameter
    );

    // Record metrics (async, non-blocking)
    recordMetrics('new_order', sent, [{ status: 'ok' }]).catch((err) =>
      console.error('Failed to record metrics:', err)
    );
  } catch (error) {
    // Record failed notification
    recordMetrics('new_order', 0, [{ status: 'error', message: String(error) }]).catch(() => { });
    // Don't throw - notification failure shouldn't break order creation
    console.error('Failed to send new order notification:', error);
  }
}

/**
 * Send notification when order is reassigned to different crew
 */
export async function notifyOrderReassigned(
  orderId: string,
  newCrewId: string,
  orderDetails: {
    subscriberName: string;
    address: string;
  },
  excludeInstallerId?: string  // ⭐ Added parameter
): Promise<void> {
  try {
    // Import hybrid notification helper
    const { sendHybridNotificationToCrew } = await import('@/lib/crewNotificationHelper');

    const sent = await sendHybridNotificationToCrew(
      newCrewId,
      '🔄 Orden Reasignada',
      `${orderDetails.subscriberName} - ${orderDetails.address}`,
      {
        type: 'order_reassigned',
        orderId,
        screen: '/orders',
        action: 'view_order'
      },
      excludeInstallerId  // ⭐ Pass exclusion parameter
    );

    // Record metrics (async, non-blocking)
    recordMetrics('order_reassigned', sent, [{ status: 'ok' }]).catch((err) =>
      console.error('Failed to record metrics:', err)
    );
  } catch (error) {
    // Record failed notification
    recordMetrics('order_reassigned', 0, [{ status: 'error', message: String(error) }]).catch(() => { });
    console.error('Failed to send reassignment notification:', error);
  }
}

/**
 * Status emoji map for better UX
 */
const STATUS_EMOJI: Record<string, string> = {
  pending: '📋',
  assigned: '📌',
  in_progress: '🔧',
  completed: '✅',
  cancelled: '❌',
  hard: '🔴',
};

/**
 * Status name map (Spanish)
 */
const STATUS_NAME: Record<string, string> = {
  pending: 'Pendiente',
  assigned: 'Asignada',
  in_progress: 'En Proceso',
  completed: 'Completada',
  cancelled: 'Cancelada',
  hard: 'Hard',
};

/**
 * Send notification when order status changes
 * Only notifies crew members if order is assigned to a crew
 * If changed by an installer, excludes that installer from notifications
 */
export async function notifyOrderStatusChanged(
  orderId: string,
  crewId: string | null | undefined,
  oldStatus: string,
  newStatus: string,
  orderDetails: {
    subscriberName: string;
    address: string;
  },
  excludeInstallerId?: string
): Promise<void> {
  try {
    // Only notify if order is assigned to a crew
    if (!crewId) {
      console.log(`Order ${orderId} has no crew assigned, skipping status change notification`);
      return;
    }

    // Import hybrid notification helper
    const { sendHybridNotificationToCrew } = await import('@/lib/crewNotificationHelper');

    const emoji = STATUS_EMOJI[newStatus] || '📝';
    const statusName = STATUS_NAME[newStatus] || newStatus;

    const sent = await sendHybridNotificationToCrew(
      crewId,
      `${emoji} Estado Actualizado: ${statusName}`,
      `${orderDetails.subscriberName} - ${orderDetails.address}`,
      {
        type: 'status_change',
        orderId,
        oldStatus,
        newStatus,
        screen: '/orders',
        action: 'view_order'
      },
      excludeInstallerId // Exclude installer who made the change
    );

    // Record metrics (async, non-blocking)
    recordMetrics('status_change', sent, [{ status: 'ok' }]).catch((err) =>
      console.error('Failed to record metrics:', err)
    );

    console.log(`✅ Status change notification sent to ${sent} installers in crew ${crewId}`);
  } catch (error) {
    // Record failed notification
    recordMetrics('status_change', 0, [{ status: 'error', message: String(error) }]).catch(() => { });
    console.error('Failed to send status change notification:', error);
  }
}
