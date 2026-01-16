import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/authHelpers";
import { updateInstaller } from "@/lib/installerService";

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
 * Register or update an installer's Expo push token
 */
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getUserFromRequest(request);

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

    // Validate Expo push token format
    if (!pushToken.startsWith('ExponentPushToken[') && !pushToken.startsWith('ExpoPushToken[')) {
      return NextResponse.json(
        { error: "Invalid Expo push token format" },
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
      { status: 200, headers: CORS_HEADERS }
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
    const sessionUser = await getUserFromRequest(request);

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
      { status: 200, headers: CORS_HEADERS }
    );

  } catch (err: any) {
    console.error("Error unregistering push token:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
