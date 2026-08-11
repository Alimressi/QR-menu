// Browser-side image downscaling, run before the upload leaves the device.
//
// A photo straight off a phone is 10-20 MB and ~5000px wide, while a dish card
// renders at 420px. Sending the original wastes the owner's upload time, our R2
// storage, and — worst of all — the guest's page load. Shrinking here means the
// person adding a dish never has to think about file size or format.

const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 0.85;

export type CompressionResult = {
  file: File;
  compressed: boolean;
  originalBytes: number;
  finalBytes: number;
};

function scaledSize(width: number, height: number) {
  const longestSide = Math.max(width, height);

  if (longestSide <= MAX_DIMENSION) {
    return { width, height };
  }

  const ratio = MAX_DIMENSION / longestSide;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

async function decode(file: File) {
  // `from-image` applies the EXIF rotation phones write instead of rotating
  // pixels, so portrait shots don't come out sideways. Not every browser
  // accepts the option, hence the retry.
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return createImageBitmap(file);
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

/**
 * Downscale and re-encode an image to WebP.
 *
 * Never throws and never blocks an upload: on any failure — an unsupported
 * format, an old browser, a decode error — the original file is returned
 * unchanged and the server does the validating.
 */
export async function compressImage(file: File): Promise<CompressionResult> {
  const unchanged: CompressionResult = {
    file,
    compressed: false,
    originalBytes: file.size,
    finalBytes: file.size,
  };

  if (typeof document === "undefined" || typeof createImageBitmap !== "function") {
    return unchanged;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await decode(file);
  } catch {
    return unchanged;
  }

  try {
    const { width, height } = scaledSize(bitmap.width, bitmap.height);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      return unchanged;
    }

    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await toBlob(canvas, "image/webp", WEBP_QUALITY);

    // Re-encoding can inflate an already-optimised small image. Keep whichever
    // is smaller, as long as the original is a format the server accepts.
    const originalIsServerSafe = ["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
      file.type,
    );

    if (!blob || (blob.size >= file.size && originalIsServerSafe)) {
      return unchanged;
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";

    return {
      file: new File([blob], `${baseName}.webp`, { type: "image/webp" }),
      compressed: true,
      originalBytes: file.size,
      finalBytes: blob.size,
    };
  } catch {
    return unchanged;
  } finally {
    bitmap.close();
  }
}
