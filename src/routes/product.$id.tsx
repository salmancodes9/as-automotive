import { createFileRoute, Link, notFound, useLoaderData } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, MessageCircle, Phone, Flame } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { getPublicAccessoryById } from "@/lib/public.functions";
import {
  SITE_URL,
  OWNER_PHONE_DISPLAY,
  OWNER_PHONE_TEL,
  whatsappInquiryUrl,
} from "@/lib/contact";

export const Route = createFileRoute("/product/$id")({
  loader: async ({ params }) => {
    const fn = getPublicAccessoryById;
    const product = await fn({ data: { id: params.id } });
    return { product };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    const name = p?.name ?? "Maruti Suzuki Part";
    const oem = p?.is_oem ? "Genuine OEM " : "Genuine ";
    const title = `${name} - ${oem}Maruti Suzuki Spare Part | AS Automobiles, Srinagar`;
    const description = p?.description
      ? p.description.slice(0, 155)
      : `Buy ${oem.toLowerCase()}Maruti Suzuki ${name} from AS Automobiles in Tengpora, Srinagar. Fast WhatsApp inquiries at +91 60055 63521.`;
    const url = `${SITE_URL}/product/${p?.id ?? ""}`;
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:type", content: "product" },
    ];
    if (p?.image_url) {
      meta.push({ property: "og:image", content: p.image_url });
      meta.push({ name: "twitter:image", content: p.image_url });
    }
    return {
      meta,
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: p?.name,
            description: p?.description,
            image: p?.image_url,
            brand: { "@type": "Brand", name: "Maruti Suzuki" },
            offers: p?.price
              ? {
                  "@type": "Offer",
                  priceCurrency: "INR",
                  price: p.price,
                  availability: "https://schema.org/InStock",
                }
              : undefined,
            seller: {
              "@type": "AutoPartsStore",
              name: "AS Automobiles",
              address: {
                "@type": "PostalAddress",
                streetAddress: "Tengpora",
                addressLocality: "Srinagar",
                addressRegion: "Jammu & Kashmir",
                addressCountry: "IN",
              },
            },
          }),
        },
      ],
    };
  },
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
  is_oem: boolean;
  images: string[] | null;
  categories?: { name: string; slug: string } | null;
};

function ProductPage() {
  const { id } = Route.useParams();
  const { product: loaderProduct } = useLoaderData({ from: "/product/$id" });
  const fetchProduct = useServerFn(getPublicAccessoryById);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    initialData: loaderProduct as Accessory | null,
    queryFn: async (): Promise<Accessory | null> => {
      return await fetchProduct({ data: { id } });
    },
  });

  if (!isLoading && !product) throw notFound();

  const gallery = useMemo(() => {
    if (!product) return [] as string[];
    const arr = [product.image_url, ...(product.images ?? [])].filter(
      (x): x is string => !!x,
    );
    return Array.from(new Set(arr));
  }, [product]);
  const [active, setActive] = useState(0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-4xl px-5 py-6">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          {product?.categories?.name && (
            <>
              <Link to="/category/$slug" params={{ slug: product.categories.slug }} className="hover:text-primary">
                {product.categories.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-foreground font-medium line-clamp-1">{product?.name ?? "Product"}</span>
        </nav>

        {isLoading || !product ? (
          <div className="mt-8 text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="mt-5 grid gap-8 md:grid-cols-2">
            <div>
              <div className="overflow-hidden rounded-2xl border border-border bg-muted">
                <div className="relative aspect-square w-full">
                  {gallery.length > 0 ? (
                    <img
                      src={gallery[active] ?? gallery[0]}
                      alt={`${product.name}${product.is_oem ? " - Genuine OEM Maruti Suzuki part" : " - Maruti Suzuki spare part"} at AS Automobiles`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                      No image
                    </div>
                  )}
                  {product.is_oem && (
                    <span className="absolute left-3 top-3 rounded-lg bg-accent px-3 py-1.5 text-sm font-extrabold uppercase tracking-widest text-accent-foreground shadow-lg ring-2 ring-accent-foreground/20">
                      OEM
                    </span>
                  )}
                </div>
              </div>
              {gallery.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {gallery.map((src, i) => (
                    <button
                      key={src}
                      onClick={() => setActive(i)}
                      className={
                        "h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-muted transition-all " +
                        (i === active ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40")
                      }
                      aria-label={`Image ${i + 1}`}
                    >
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
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
