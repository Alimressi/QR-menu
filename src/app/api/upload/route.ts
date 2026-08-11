import { requireTenantScope } from "@/lib/auth";
import {
  MAX_UPLOAD_BYTES,
  allowedImageTypeList,
  isAllowedImageType,
  putMedia,
  sniffImageType,
} from "@/lib/media";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  // Uploads are filed under the caller's restaurant. A restaurant admin is
  // pinned to their own tenant; a super admin names the restaurant explicitly.
  const scope = requireTenantScope(request, formData.get("restaurantId"));
  if (!scope.ok) {
    return NextResponse.json({ error: scope.error }, { status: scope.status });
  }

  try {
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "Image file is empty." }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `Image is too large. Maximum size is ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB.` },
        { status: 413 },
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());

    // Trust the bytes, not the declared type or the filename extension.
    const contentType = sniffImageType(bytes);

    if (!contentType || !isAllowedImageType(contentType)) {
      return NextResponse.json(
        { error: `Unsupported image format. Allowed: ${allowedImageTypeList()}.` },
        { status: 400 },
      );
    }

    const stored = await putMedia(scope.restaurantId, bytes, contentType);

    return NextResponse.json({ imageUrl: stored.url, storage: stored.storage }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to upload image." }, { status: 500 });
  }
}
