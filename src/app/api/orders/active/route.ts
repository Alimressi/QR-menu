import { findActiveOrderWithItems } from "@/lib/orders-query";
import { verifyQrSessionToken } from "@/lib/qr-token";
import { NextRequest, NextResponse } from "next/server";

// A guest polls this to watch their own order. It used to answer for any table
// whose number you could name — the numbers run 1, 2, 3, so a guest could read
// the next table's live order by editing the query. It now takes the same
// signed QR session the order was placed with (Authorization: Bearer <token>),
// and only tells you about the table and restaurant that token is for.
export async function GET(request: NextRequest) {
  const tableNumber = request.nextUrl.searchParams.get("tableNumber")?.trim() || "";
  const restaurantId = Number(request.nextUrl.searchParams.get("restaurantId"));

  if (!tableNumber) {
    return NextResponse.json({ error: "tableNumber is required." }, { status: 400 });
  }

  if (!restaurantId) {
    return NextResponse.json({ error: "restaurantId is required." }, { status: 400 });
  }

  const qrToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const session = verifyQrSessionToken(qrToken);

  if (!session) {
    return NextResponse.json({ error: "QR session is invalid or expired." }, { status: 401 });
  }

  if (session.tableNumber !== tableNumber || session.restaurantId !== restaurantId) {
    return NextResponse.json({ error: "QR session does not match this table." }, { status: 403 });
  }

  const order = await findActiveOrderWithItems(tableNumber, restaurantId);

  return NextResponse.json({ order: order || null });
}
