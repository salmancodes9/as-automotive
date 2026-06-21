import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle, Phone, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import {
  OWNER_PHONE_DISPLAY,
  OWNER_PHONE_TEL,
  whatsappInquiryUrl,
} from "@/lib/contact";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Product — AS Automobiles" },
      { name: "description", content: "Genuine Maruti Suzuki accessory details." },
    ],
  }),
  component: ProductPage,
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-xl font-semibold">Product not found</h1>
        <Link to="/" className="mt-4 inline-block text-sm text-primary underline">
          Back to catalog
        </Link>
      </div>
    </div>
  ),
});

type Accessory = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  category_id: string | null;
  is_trending: boolean;
  categories?: { name: string; slug: string } | null;
};

function ProductPage() {
  const { id } = Route.useParams();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async (): Promise<Accessory | null> => {
      const { data, error } = await supabase
        .from("accessories")
        .select("id,name,description,price,image_url,category_id,is_trending,categories(name,slug)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as Accessory) ?? null;
    },
  });

  if (!isLoading && !product) throw notFound();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-4xl px-5 py-6">
        <Link to="/" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to catalog
        </Link>

        {isLoading || !product ? (
          <div className="mt-8 text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="mt-5 grid gap-8 md:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-border bg-muted">
              <div className="aspect-square w-full">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col">
              {product.categories?.name && (
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                  {product.categories.name}
                </p>
              )}
              <h1 className="mt-1 text-2xl font-bold leading-tight text-foreground">
                {product.name}
              </h1>
              {product.is_trending && (
                <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent">
                  <Flame className="h-3 w-3" /> Hot part
                </span>
              )}
              {product.price != null && (
                <p className="mt-4 text-2xl font-bold text-primary">
                  ₹{Number(product.price).toLocaleString("en-IN")}
                </p>
              )}
              {product.description && (
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              )}

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <a
                  href={whatsappInquiryUrl({
                    productName: product.name,
                    productUrl: typeof window !== "undefined" ? window.location.href : undefined,
                    imageUrl: product.image_url,
                    price: product.price,
                  })}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                >
                  <MessageCircle className="h-4 w-4" /> Inquire on WhatsApp
                </a>
                <a
                  href={`tel:${OWNER_PHONE_TEL}`}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-3 text-sm font-semibold text-primary hover:border-primary/40"
                >
                  <Phone className="h-4 w-4" /> Call {OWNER_PHONE_DISPLAY}
                </a>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                Owner: AS Automobiles · {OWNER_PHONE_DISPLAY}
              </p>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}