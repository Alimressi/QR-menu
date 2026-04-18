import { isAdminRequest } from "@/lib/auth";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Only JPG, PNG, WEBP and SVG are allowed." }, { status: 400 });
    }

    const ext = file.name.includes(".") ? file.name.split(".").pop() : "png";
    const safeExt = ext ? ext.toLowerCase().replace(/[^a-z0-9]/g, "") : "png";
    const fileName = `${randomUUID()}.${safeExt || "png"}`;

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({ imageUrl: `/uploads/${fileName}` }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to upload image." }, { status: 500 });
  }
}
