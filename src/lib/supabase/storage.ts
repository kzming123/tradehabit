import { createClient } from "./client";

const BUCKET = "trade-screenshots";

export interface UploadResult {
  url: string | null;
  error: string | null;
}

export async function uploadScreenshot(
  file: File,
  userId: string
): Promise<UploadResult> {
  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || "image/png" });

  if (error) {
    // Surface common setup errors with friendlier messages
    const msg = error.message.toLowerCase();
    if (msg.includes("bucket not found")) {
      return { url: null, error: "Storage not set up: create a 'trade-screenshots' bucket in Supabase." };
    }
    if (msg.includes("permission") || msg.includes("policy") || msg.includes("not authorized")) {
      return { url: null, error: "Storage permissions missing: configure RLS policies on the bucket." };
    }
    if (msg.includes("payload too large") || msg.includes("entity too large")) {
      return { url: null, error: "Screenshot is too large for storage." };
    }
    return { url: null, error: error.message };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

export async function deleteScreenshot(url: string): Promise<void> {
  const supabase = createClient();
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = url.slice(idx + marker.length);
  await supabase.storage.from(BUCKET).remove([path]);
}
