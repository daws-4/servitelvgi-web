import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

interface DecodedToken {
  sub: string;
  _id: string;
  username: string;
  name: string;
  surname?: string;
  email?: string;
  role: 'admin' | 'installer';
  crewId?: string | null;
  crewName?: string | null;
}

export interface SessionUser {
  userId: string;
  userModel: 'User' | 'Installer';
  username: string;
  name: string;
  role: string;
  crewId?: string | null;
  crewName?: string | null;
}

/**
 * Extract user information from JWT token in request cookies
 * Returns null if no valid token is found
 */
export async function getUserFromRequest(req: NextRequest): Promise<SessionUser | null> {
  try {
    const cookieName = process.env.JWT_NAME || "token";
    const token = req.cookies.get(cookieName)?.value ?? null;

    if (!token) {
      return null;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("Missing JWT_SECRET in environment");
      return null;
    }

    const decoded = jwt.verify(token, jwtSecret) as DecodedToken;

    return {
      userId: decoded._id,
      userModel: 'User', // Currently only admins can login to web dashboard
      username: decoded.username,
      name: decoded.name,
      role: decoded.role
    };
  } catch (err) {
    console.error("Error extracting user from token:", err);
    return null;
  }
}

/**
 * Extract installer information from JWT Bearer token in Authorization header
 * Used for mobile app authentication
 * Returns null if no valid token is found
 */
export async function getInstallerFromBearerToken(
  authHeader: string | null
): Promise<SessionUser | null> {
  try {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("Missing JWT_SECRET in environment");
      return null;
    }

    const decoded = jwt.verify(token, jwtSecret) as DecodedToken;

    // Verify this is an installer token
    if (decoded.role !== 'installer') {
      console.error("Token is not for an installer");
      return null;
    }

    return {
      userId: decoded._id,
      userModel: 'Installer',
      username: decoded.username,
      name: decoded.name,
      role: decoded.role,
      crewId: decoded.crewId || null,
      crewName: decoded.crewName || null
    };
  } catch (err) {
    console.error("Error extracting installer from bearer token:", err);
    return null;
  }
}
