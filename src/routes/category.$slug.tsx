import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("categories")
      .select("name,slug")
      .eq("slug", params.slug)
      .maybeSingle();
    return { category: data as { name: string; slug: string } | null };
  },
  head: ({ params, loaderData }) => {
    const name = loaderData?.category?.name ?? "Maruti Suzuki Parts";
    const title = `${name} - Genuine Maruti Suzuki ${name} in Srinagar | AS Automobiles`;
    const description = `Buy genuine Maruti Suzuki ${name.toLowerCase()} in Tengpora, Srinagar. OEM quality parts from AS Automobiles - quick WhatsApp inquiries and trusted service.`;
    const url = `https://as-automotive.lovable.app/category/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: CategoryPage,
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-xl font-semibold">Category not found</h1>
        <Link to="/" className="mt-4 inline-block text-sm text-primary underline">
          Back to catalog
        </Link>
      </div>
    </div>
  ),
});

type Category = { id: string; name: string; slug: string };
type Accessory = {
  id: string;
  name: string;
  price: number | null;
  image_url: string | null;
  is_trending: boolean;
  is_oem: boolean;
};

function CategoryPage() {
  const { slug } = Route.useParams();

  const { data: category, isLoading: catLoading } = useQuery({
    queryKey: ["category", slug],
    queryFn: async (): Promise<Category | null> => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name,slug")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: items = [] } = useQuery({
    queryKey: ["category-items", category?.id],
    enabled: !!category?.id,
    queryFn: async (): Promise<Accessory[]> => {
      const { data, error } = await supabase
        .from("accessories")
        .select("id,name,price,image_url,is_trending,is_oem")
        .eq("category_id", category!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Accessory[];
    },
  });

  if (!catLoading && !category) throw notFound();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-5xl px-5 py-6">
        <Link to="/" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-foreground">
          {category?.name ?? "Category"}
        </h1>
        <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
          {items.length} item{items.length === 1 ? "" : "s"}
        </p>

        {items.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-border bg-card/50 px-4 py-10 text-center text-sm text-muted-foreground">
            No products in this category yet.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {items.map((a) => (
              <Link
                key={a.id}
                to="/product/$id"
                params={{ id: a.id }}
                className="group overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-square bg-muted">
                  {a.image_url ? (
                    <img src={a.image_url} alt={`${a.name}${a.is_oem ? " - Genuine OEM Maruti Suzuki part" : " - Maruti Suzuki spare part"} at AS Automobiles`} className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No image</div>
                  )}
                  {a.is_oem && (
                    <span className="absolute left-2 top-2 rounded-md bg-accent px-2.5 py-1 text-xs font-extrabold uppercase tracking-widest text-accent-foreground shadow-md ring-1 ring-accent-foreground/20">
                      OEM
                    </span>
                  )}
                  {a.is_trending && (
                    <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
                      Hot
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-2 text-sm font-semibold">{a.name}</h3>
                  {a.price != null && (
                    <p className="mt-1 text-sm font-semibold text-primary">₹{Number(a.price).toLocaleString("en-IN")}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}