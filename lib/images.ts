import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

/** Longest side after on-device compression (Storefront §7: compress before upload). */
export const MAX_IMAGE_SIDE = 1600;
const JPEG_QUALITY = 0.82;
/** Backend limit per image (Admin §8.4). Checked again after compression. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const isWeb = Platform.OS === "web";

/**
 * A photo ready to upload. Web: a Blob. iOS/Android: a local file, which React Native's FormData
 * sends from its `uri`. `size` is 0 when the platform doesn't report it.
 */
export type UploadablePhoto =
  | { kind: "blob"; blob: Blob; size: number }
  | { kind: "file"; uri: string; name: string; type: string; size: number };

/** A picked, not yet compressed image. */
type PickedFile =
  | { kind: "blob"; file: File }
  | { kind: "file"; uri: string; width: number; height: number; type: string };

/** The browser file picker on web (outside static rendering), the photo library on iOS/Android. */
export const canPickImages = isWeb ? typeof document !== "undefined" : true;

function pickWebFiles(multiple: boolean, max: number): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";
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

/** Opens the picker. Resolves with at most `max` images; an empty array when the person cancels. */
async function pickImages({ multiple = true, max = 10 }: { multiple?: boolean; max?: number } = {}): Promise<PickedFile[]> {
  if (!canPickImages) return [];
  if (isWeb) return (await pickWebFiles(multiple, max)).map((file) => ({ kind: "blob" as const, file }));
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: multiple,
    selectionLimit: multiple ? max : 1,
    quality: 1,
    exif: false,
  });
  if (res.canceled) return [];
  return res.assets
    .slice(0, max)
    .map((a) => ({ kind: "file" as const, uri: a.uri, width: a.width, height: a.height, type: a.mimeType ?? "image/jpeg" }));
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

function looksHeic(file: File): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

/**
 * HEIC → JPEG in the browser (the server can't decode HEIC). Safari draws HEIC itself; other
 * browsers get the libheif converter, loaded only when a HEIC file is actually picked.
 */
async function heicToJpeg(file: File): Promise<Blob> {
  const { default: heic2any } = await import("heic2any");
  const out = await heic2any({ blob: file, toType: "image/jpeg", quality: JPEG_QUALITY });
  return Array.isArray(out) ? out[0] : out;
}

async function compressWeb(file: File): Promise<Blob> {
  let source: Blob = file;
  let img: HTMLImageElement;
  try {
    img = await loadImage(source);
  } catch {
    if (!looksHeic(file)) return file; // the server gives the clear "use JPG/PNG/WebP" message
    source = await heicToJpeg(file); // throws if it can't be read at all
    img = await loadImage(source);
  }
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return source;
  ctx.fillStyle = "#FFFFFF"; // transparent PNG areas become white, not black, in a JPEG
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", JPEG_QUALITY));
  if (!blob) return source;
  // Never upload a bigger file than the original (an already-small JPEG).
  return blob.size < source.size || source.type !== "image/jpeg" ? blob : source;
}

/** iOS/Android: resize to ≤ MAX_IMAGE_SIDE and save as JPEG — this also turns an iPhone HEIC into JPEG. */
async function compressNative(f: { uri: string; width: number; height: number }, index: number): Promise<UploadablePhoto> {
  const ctx = ImageManipulator.manipulate(f.uri);
  if (Math.max(f.width, f.height) > MAX_IMAGE_SIDE) {
    ctx.resize(f.width >= f.height ? { width: MAX_IMAGE_SIDE } : { height: MAX_IMAGE_SIDE });
  }
  const ref = await ctx.renderAsync();
  const out = await ref.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });
  return { kind: "file", uri: out.uri, name: `photo-${index + 1}.jpg`, type: "image/jpeg", size: 0 };
}

/**
 * Opens the picker and compresses each chosen image on the device (≤1600 px JPEG) — a phone photo of
 * several MB becomes a few hundred KB before it is uploaded on a rural connection. `unreadable`
 * counts images that couldn't be converted (e.g. a damaged HEIC).
 */
export async function pickAndCompress(opts: { multiple?: boolean; max?: number }): Promise<{ photos: UploadablePhoto[]; unreadable: number }> {
  const picked = await pickImages(opts);
  const photos: UploadablePhoto[] = [];
  let unreadable = 0;
  for (let i = 0; i < picked.length; i++) {
    const p = picked[i];
    try {
      if (p.kind === "blob") {
        const blob = await compressWeb(p.file);
        photos.push({ kind: "blob", blob, size: blob.size });
      } else {
        photos.push(await compressNative(p, i));
      }
    } catch {
      unreadable++;
    }
  }
  return { photos, unreadable };
}

/** Adds one photo to a multipart form, on web and on iOS/Android. */
export function appendPhoto(form: FormData, field: string, p: UploadablePhoto, name: string) {
  if (p.kind === "blob") form.append(field, p.blob, name);
  // React Native's FormData reads a { uri, name, type } part from the local file.
  else form.append(field, { uri: p.uri, name, type: p.type } as unknown as Blob);
}

/** A preview URL for a picked photo. Web blob URLs must be revoked with revokePreview. */
export function previewUrl(p: UploadablePhoto): string | null {
  if (p.kind === "file") return p.uri;
  return isWeb && typeof URL !== "undefined" ? URL.createObjectURL(p.blob) : null;
}

export function revokePreview(url: string | null | undefined) {
  if (url && isWeb && url.startsWith("blob:")) URL.revokeObjectURL(url);
}
