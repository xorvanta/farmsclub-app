import { Platform } from "react-native";

/** Longest side after on-device compression (Storefront §7: compress before upload). */
export const MAX_IMAGE_SIDE = 1600;
const JPEG_QUALITY = 0.82;
/** Backend limit per image (Admin §8.4). Checked again after compression. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const canPickImages = Platform.OS === "web" && typeof document !== "undefined";

/**
 * Opens the browser's file picker for images (web only). Resolves with the chosen files, at most
 * `max`; an empty array when the person cancels. On native there is no picker in this build.
 */
export function pickImages({ multiple = true, max = 10 }: { multiple?: boolean; max?: number } = {}): Promise<File[]> {
  if (!canPickImages) return Promise.resolve([]);
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/heic,image/heif";
    input.multiple = multiple;
    input.style.position = "fixed";
    input.style.left = "-9999px";
    let settled = false;
    const done = (files: File[]) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(files.slice(0, max));
    };
    input.onchange = () => done(Array.from(input.files ?? []));
    // "cancel" fires in current browsers when the dialog is closed without a choice.
    input.addEventListener("cancel", () => done([]));
    document.body.appendChild(input);
    input.click();
  });
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable image"));
    };
    img.src = url;
  });
}

/**
 * Resizes an image on the device so its longest side is ≤ MAX_IMAGE_SIDE px and re-encodes it as
 * JPEG — a phone photo of several MB becomes a few hundred KB before it is uploaded on a rural
 * connection. Falls back to the original file when the browser can't decode it (e.g. HEIC on a
 * browser without HEIC support — the backend accepts HEIC and converts it).
 */
export async function compressImage(file: File): Promise<Blob> {
  if (!canPickImages) return file;
  try {
    const img = await loadImage(file);
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#FFFFFF"; // transparent PNG areas become white, not black, in a JPEG
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", JPEG_QUALITY));
    if (!blob) return file;
    // Never upload a bigger file than the original (an already-small JPEG).
    return blob.size < file.size || file.type !== "image/jpeg" ? blob : file;
  } catch {
    return file;
  }
}

/** A local preview URL for a picked/compressed image (web). Revoke it when the preview is removed. */
export function previewUrl(blob: Blob): string | null {
  return canPickImages ? URL.createObjectURL(blob) : null;
}

export function revokePreview(url: string | null | undefined) {
  if (url && canPickImages && url.startsWith("blob:")) URL.revokeObjectURL(url);
}
