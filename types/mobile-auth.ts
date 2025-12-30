// types/mobile-auth.ts
// Types for mobile authentication endpoints

// Request types
export interface MobileLoginRequest {
  username: string;
  password: string;
}

// Response types
export interface InstallerAuthData {
  _id: string;
  username: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  status: string;
  onDuty: boolean;
  crew: {
    _id: string;
    name: string;
  } | null;
}

export interface MobileLoginResponse {
  message: string;
  token: string;
  installer: InstallerAuthData;
}

export interface MobileMeResponse {
  installer: InstallerAuthData;
}

export interface MobileLogoutResponse {
  message: string;
  ok: boolean;
}

// JWT Payload type for installers
export interface InstallerTokenPayload {
  sub: string;
  _id: string;
  username: string;
  name: string;
  surname: string;
  role: 'installer';
  crewId: string | null;
  crewName: string | null;
  showInventory: boolean;
  iat?: number;
  exp?: number;
}
