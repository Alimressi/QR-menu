import { validateSuperAdminCredentials, setAdminSessionCookie } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const login = String(body?.login || "").trim();
    const password = String(body?.password || "");

    if (!login || !password) {
      return NextResponse.json({ error: "Login and password are required." }, { status: 400 });
    }

    const userInfo = await validateSuperAdminCredentials(login, password);

    if (!userInfo) {
      return NextResponse.json({ error: "Invalid super admin credentials." }, { status: 401 });
    }

    await setAdminSessionCookie(userInfo.role);

    return NextResponse.json({ 
      ok: true, 
      role: userInfo.role,
    });
  } catch {
    return NextResponse.json({ error: "Failed to login." }, { status: 500 });
  }
}
