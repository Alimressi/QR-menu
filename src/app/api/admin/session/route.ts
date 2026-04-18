import { isAdminSessionActive } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const authenticated = await isAdminSessionActive();
  return NextResponse.json({ authenticated });
}
