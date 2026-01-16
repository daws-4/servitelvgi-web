/**
 * Push Notification Service
 * Handles sending push notifications via Expo Push Service
 */

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
 */
export async function sendNotificationToCrew(
  crewId: string,
  title: string,
  body: string,
  data?: Record<string, any>
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
      installerIds.push(typeof crew.leader === 'string' ? crew.leader : crew.leader.toString());
    }
    
    if (crew.members && Array.isArray(crew.members)) {
      crew.members.forEach(member => {
        const memberId = typeof member === 'string' ? member : member.toString();
        if (memberId) installerIds.push(memberId);
      });
    }

    // Fetch push tokens for all installers
    const pushTokens: string[] = [];
    
    for (const installerId of installerIds) {
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
  }
): Promise<void> {
  try {
    await sendNotificationToCrew(
      crewId,
      '📦 Nueva Orden Asignada',
      `${orderDetails.subscriberName} - ${orderDetails.address}`,
      {
        type: 'new_order',
        orderId,
        screen: '/orders',
        action: 'view_order'
      }
    );
  } catch (error) {
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
  }
): Promise<void> {
  try {
    await sendNotificationToCrew(
      newCrewId,
      '🔄 Orden Reasignada',
      `${orderDetails.subscriberName} - ${orderDetails.address}`,
      {
        type: 'order_reassigned',
        orderId,
        screen: '/orders',
        action: 'view_order'
      }
    );
  } catch (error) {
    console.error('Failed to send reassignment notification:', error);
  }
}
