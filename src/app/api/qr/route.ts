import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get("text");

    if (!text) {
      return NextResponse.json({ error: "Text parameter is required" }, { status: 400 });
    }

    const dataUrl = await QRCode.toDataURL(text, {
      width: 400,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    return NextResponse.json({ dataUrl });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 });
  }
}
