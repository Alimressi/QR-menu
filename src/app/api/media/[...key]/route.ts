import { getMedia } from "@/lib/media";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ key: string[] }> };

// Public: dish photos are shown on the guest menu. Keys are random UUIDs, so
// knowing the URL is the only way to reach an object.
export async function GET(_request: NextRequest, { params }: Params) {
  const { key: segments } = await params;
  const key = segments.map((segment) => decodeURIComponent(segment)).join("/");

  if (!key || key.includes("..")) {
    return NextResponse.json({ error: "Invalid media key." }, { status: 400 });
  }

  const object = await getMedia(key);

  if (!object) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const headers = new Headers();
  headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
  headers.set(
    "Cache-Control",
    object.httpMetadata?.cacheControl || "public, max-age=31536000, immutable",
  );
  headers.set("ETag", object.httpEtag);
  headers.set("Content-Length", String(object.size));

  return new NextResponse(object.body as ReadableStream, { headers });
}
