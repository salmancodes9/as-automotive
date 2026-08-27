import { createServerFn } from "@tanstack/react-start";
import { getEnvVar } from "@/lib/env";

function checkPasscode(passcode: string) {
  const workerEnv = (globalThis as Record<string, unknown>).__WORKER_ENV;
  const workerEnvType = typeof workerEnv;
  const workerEnvKeys = workerEnv && typeof workerEnv === "object" ? Object.keys(workerEnv as Record<string, unknown>) : [];
  const expected = getEnvVar("ADMIN_PASSCODE");
  console.log(`[AUTH DEBUG] __WORKER_ENV type=${workerEnvType} keys=[${workerEnvKeys.join(",")}] expected=${expected ? "(set)" : "(missing)"} passcode_len=${passcode.length}`);
  if (!expected) throw new Error(`Admin passcode is not configured on the server. (workerEnvType=${workerEnvType}, keys=[${workerEnvKeys.join(",")}])`);
  if (passcode !== expected) throw new Error("Invalid passcode.");
}
 
export const getAdminCategories = createServerFn({ method: "GET" })
  .inputValidator((input: { passcode: string }) => input)
  .handler(async ({ data }) => {
    checkPasscode(data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("categories")
      .select("id,name,slug,sort_order,created_at")
      .order("sort_order")
      .order("name");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getAdminAccessories = createServerFn({ method: "GET" })
  .inputValidator((input: { passcode: string }) => input)
  .handler(async ({ data }) => {
    checkPasscode(data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("accessories")
      .select("id,name,description,price,image_url,category_id,is_trending,is_oem,images,created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as {
      id: string;
      name: string;
      description: string | null;
      price: number | null;
      image_url: string | null;
      category_id: string | null;
      is_trending: boolean;
      is_oem: boolean;
      images: string[];
      created_at: string;
    }[];
  });

export const verifyPasscode = createServerFn({ method: "POST" })
  .inputValidator((input: { passcode: string }) => input)
  .handler(async ({ data }) => {
    checkPasscode(data.passcode);
    return { ok: true };
  });
 
export const createCategory = createServerFn({ method: "POST" })
  .inputValidator((input: { passcode: string; name: string; slug: string; sort_order?: number }) => input)
  .handler(async ({ data }) => {
    checkPasscode(data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error, data: row } = await supabaseAdmin
      .from("categories")
      .insert({ name: data.name, slug: data.slug, sort_order: data.sort_order ?? 0 })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
 
export const deleteCategory = createServerFn({ method: "POST" })
  .inputValidator((input: { passcode: string; id: string }) => input)
  .handler(async ({ data }) => {
    checkPasscode(data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
 
export const createAccessory = createServerFn({ method: "POST" })
  .inputValidator((input: {
    passcode: string;
    name: string;
    description?: string | null;
    price?: number | null;
    image_url?: string | null;
    category_id?: string | null;
    is_trending?: boolean;
    is_oem?: boolean;
    images?: string[];
  }) => input)
  .handler(async ({ data }) => {
    checkPasscode(data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error, data: row } = await supabaseAdmin
      .from("accessories")
      .insert({
        name: data.name,
        description: data.description ?? null,
        price: data.price ?? null,
        image_url: data.image_url ?? null,
        category_id: data.category_id ?? null,
        is_trending: data.is_trending ?? false,
        is_oem: data.is_oem ?? false,
        images: data.images ?? [],
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
 
export const updateAccessory = createServerFn({ method: "POST" })
  .inputValidator((input: {
    passcode: string;
    id: string;
    name?: string;
    description?: string | null;
    price?: number | null;
    image_url?: string | null;
    category_id?: string | null;
    is_trending?: boolean;
    is_oem?: boolean;
    images?: string[];
  }) => input)
  .handler(async ({ data }) => {
    checkPasscode(data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { passcode: _p, id, ...patch } = data;
    void _p;
    const { error, data: row } = await supabaseAdmin
      .from("accessories")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
 
export const deleteAccessory = createServerFn({ method: "POST" })
  .inputValidator((input: { passcode: string; id: string }) => input)
  .handler(async ({ data }) => {
    checkPasscode(data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("accessories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
 
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
 
export const uploadProductImage = createServerFn({ method: "POST" })
  .inputValidator((input: {
    passcode: string;
    filename: string;
    contentType: string;
    dataBase64: string;
  }) => input)
  .handler(async ({ data }) => {
    checkPasscode(data.passcode);
 
    if (!ALLOWED_IMAGE_TYPES.has(data.contentType)) {
      throw new Error("Unsupported image type. Please upload a JPG, PNG, WEBP, or GIF.");
    }
 
    let bytes: Uint8Array;
    try {
      bytes = Uint8Array.from(atob(data.dataBase64), (c) => c.charCodeAt(0));
    } catch {
      throw new Error("The uploaded file could not be read. Please try a different image.");
    }
    if (bytes.byteLength > MAX_UPLOAD_BYTES) {
      throw new Error("Image must be under 5 MB.");
    }
 
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const safeName = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
 
    const { error: upErr } = await supabaseAdmin.storage
      .from("product-images")
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (upErr) throw new Error(upErr.message);
 
    // Bucket is public, so a plain public URL is all we need — no signed
    // token to expire or go invalid.
    const { data: pub } = supabaseAdmin.storage.from("product-images").getPublicUrl(path);
    return { url: pub.publicUrl, path };
  });
