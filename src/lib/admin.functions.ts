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