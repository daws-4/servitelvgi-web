import { NextResponse } from "next/server";

export async function GET() {
  // Clear the token cookie by setting Max-Age=0. Keep SameSite and HttpOnly flags.
  const cookie = `token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${
    process.env.NODE_ENV === "production" ? "; Secure" : ""
  }`;

  return NextResponse.json(
    { ok: true, message: "Logged out" },
    {
      status: 200,
      headers: {
        "Set-Cookie": cookie,
      },
    }
  );
}
