// Browser-side image upload to Cloudinary via an UNSIGNED upload preset —
// the only safe way to upload from the client. The API secret must NEVER ship
// in frontend code; it stays in the Cloudinary dashboard, tied to the preset.
// Cloud name is public (like the Firebase web config) and safe to expose.
//
// Setup: Cloudinary Console → Settings → Upload → Upload presets → Add →
// Signing Mode: "Unsigned". Put the preset name in VITE_CLOUDINARY_UPLOAD_PRESET.
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const cloudinaryReady = Boolean(CLOUD_NAME && UPLOAD_PRESET);

// Uploads an image and returns its optimized (f_auto,q_auto) secure URL.
export async function uploadToCloudinary(file: File, folder = "seller-logos"): Promise<string> {
  if (!cloudinaryReady) throw new Error("Cloudinary is not configured.");
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET);
  form.append("folder", folder);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Cloudinary upload failed (${res.status})`);
  const { secure_url } = await res.json();
  // f_auto = best format for the browser (WebP/AVIF), q_auto = auto quality.
  return (secure_url as string).replace("/upload/", "/upload/f_auto,q_auto/");
}
