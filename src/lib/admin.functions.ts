import { createServerFn } from "@tanstack/react-start";

function checkPasscode(passcode: string) {
  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) throw new Error("Admin passcode is not configured on the server.");
  if (passcode !== expected) throw new Error("Invalid passcode.");
}

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

const TEN_YEARS_SECONDS = 60 * 60 * 24 * 365 * 10;

export const uploadProductImage = createServerFn({ method: "POST" })
  .inputValidator((input: {
    passcode: string;
    filename: string;
    contentType: string;
    dataBase64: string;
  }) => input)
  .handler(async ({ data }) => {
    checkPasscode(data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bytes = Uint8Array.from(atob(data.dataBase64), (c) => c.charCodeAt(0));
    const safeName = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("product-images")
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (upErr) throw new Error(upErr.message);
    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from("product-images")
      .createSignedUrl(path, TEN_YEARS_SECONDS);
    if (signErr || !signed) throw new Error(signErr?.message ?? "Failed to sign URL");
    return { url: signed.signedUrl, path };
  });