import { createServerFn } from "@tanstack/react-start";

export const getPublicCategories = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("id,name,slug,sort_order")
      .order("sort_order")
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getPublicAccessories = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("accessories")
      .select("id,name,description,price,image_url,category_id,is_trending,is_oem")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as {
      id: string;
      name: string;
      description: string | null;
      price: number | null;
      image_url: string | null;
      category_id: string | null;
      is_trending: boolean;
      is_oem: boolean;
    }[];
  });

export const getPublicCategoryBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("categories")
      .select("id,name,slug")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row as { id: string; name: string; slug: string } | null;
  });

export const getPublicAccessoriesByCategory = createServerFn({ method: "GET" })
  .inputValidator((input: { categoryId: string }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("accessories")
      .select("id,name,price,image_url,is_trending,is_oem")
      .eq("category_id", data.categoryId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as {
      id: string;
      name: string;
      price: number | null;
      image_url: string | null;
      is_trending: boolean;
      is_oem: boolean;
    }[];
  });

export const getPublicAccessoryById = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("accessories")
      .select("id,name,description,price,image_url,category_id,is_trending,is_oem,images,categories(name,slug)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row as unknown as {
      id: string;
      name: string;
      description: string | null;
      price: number | null;
      image_url: string | null;
      category_id: string | null;
      is_trending: boolean;
      is_oem: boolean;
      images: string[] | null;
      categories?: { name: string; slug: string } | null;
    }) ?? null;
  });

export const getPublicAccessoryForSitemap = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: categories, error: catErr } = await supabaseAdmin
      .from("categories")
      .select("slug");
    if (catErr) throw new Error(catErr.message);
    const { data: products, error: prodErr } = await supabaseAdmin
      .from("accessories")
      .select("id,created_at");
    if (prodErr) throw new Error(prodErr.message);
    return { categories: categories ?? [], products: (products ?? []) as { id: string; created_at: string }[] };
  });
