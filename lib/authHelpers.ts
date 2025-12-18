import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

interface DecodedToken {
  sub: string;
  _id: string;
  username: string;
  name: string;
  surname: string;
  email: string;
  role: string;
}

export interface SessionUser {
  userId: string;
  userModel: 'User' | 'Installer';
  username: string;
  name: string;
  role: string;
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
