import { NextRequest, NextResponse } from "next/server";
import { getInstallerFromBearerToken } from "@/lib/authHelpers";
import { updateInstaller } from "@/lib/installerService";
import rateLimiter, { getClientIp } from "@/lib/rateLimiter";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * POST /api/web/installers/push-token
 * Register or update an installer's push token (Expo or FCM)
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (10 requests per minute per IP)
    const clientIp = getClientIp(request);
    const rateLimit = rateLimiter.check(clientIp, 10, 60 * 1000);

    const rateLimitHeaders = {
      ...CORS_HEADERS,
      "X-RateLimit-Limit": "10",
      "X-RateLimit-Remaining": rateLimit.remaining.toString(),
      "X-RateLimit-Reset": new Date(rateLimit.resetTime).toISOString(),
    };

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            ...rateLimitHeaders,
            "Retry-After": rateLimit.retryAfter?.toString() || "60",
          },
        }
      );
    }

    // Get installer from Bearer token (mobile app authentication)
    const authHeader = request.headers.get('Authorization');
    const sessionUser = await getInstallerFromBearerToken(authHeader);

    if (!sessionUser || sessionUser.role !== 'installer') {
      return NextResponse.json(
        { error: "Unauthorized - installer access required" },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const body = await request.json();
    const { pushToken } = body;

    if (!pushToken || typeof pushToken !== 'string') {
      return NextResponse.json(
        { error: "pushToken is required and must be a string" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Validate push token format (support both Expo and native FCM tokens)
    // Expo tokens: ExponentPushToken[...] or ExpoPushToken[...]
    // FCM tokens: alphanumeric string with colons (e.g., "abc123:APA91b...")
    const isExpoToken = pushToken.startsWith('ExponentPushToken[') || pushToken.startsWith('ExpoPushToken[');
    const isFCMToken = /^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+/.test(pushToken);

    if (!isExpoToken && !isFCMToken) {
      return NextResponse.json(
        { error: "Invalid push token format. Expected Expo or FCM token." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Update installer with new push token
    const updated = await updateInstaller(sessionUser.userId, {
      pushToken,
      pushTokenUpdatedAt: new Date()
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Installer not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    console.log(`✅ Push token registered for installer ${sessionUser.userId}`);

    return NextResponse.json(
      {
        success: true,
        token: pushToken,
        message: "Push token registered successfully"
      },
      { status: 200, headers: rateLimitHeaders }
    );

  } catch (err: any) {
    console.error("Error registering push token:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * DELETE /api/web/installers/push-token
 * Unregister an installer's push token (e.g., on logout)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientIp = getClientIp(request);
    const rateLimit = rateLimiter.check(clientIp, 10, 60 * 1000);

    const rateLimitHeaders = {
      ...CORS_HEADERS,
      "X-RateLimit-Limit": "10",
      "X-RateLimit-Remaining": rateLimit.remaining.toString(),
      "X-RateLimit-Reset": new Date(rateLimit.resetTime).toISOString(),
    };

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            ...rateLimitHeaders,
            "Retry-After": rateLimit.retryAfter?.toString() || "60",
          },
        }
      );
    }

    // Get installer from Bearer token (mobile app authentication)
    const authHeader = request.headers.get('Authorization');
    const sessionUser = await getInstallerFromBearerToken(authHeader);

    if (!sessionUser || sessionUser.role !== 'installer') {
      return NextResponse.json(
        { error: "Unauthorized - installer access required" },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // Clear push token
    const updated = await updateInstaller(sessionUser.userId, {
      pushToken: null,
      pushTokenUpdatedAt: new Date()
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Installer not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    console.log(`✅ Push token unregistered for installer ${sessionUser.userId}`);

    return NextResponse.json(
      {
        success: true,
        message: "Push token unregistered successfully"
      },
      { status: 200, headers: rateLimitHeaders }
    );

  } catch (err: any) {
    console.error("Error unregistering push token:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
