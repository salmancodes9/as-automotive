import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AS Automobiles — Genuine Maruti Suzuki Parts & Accessories" },
      {
        name: "description",
        content:
          "Genuine Maruti Suzuki parts and accessories in Srinagar, J&K. Browse categories and trending parts at AS Automobiles.",
      },
      { property: "og:title", content: "AS Automobiles" },
      {
        property: "og:description",
        content: "Genuine Maruti Suzuki parts & accessories — Tengpora, Srinagar.",
      },
    ],
  }),
  component: Index,
});

type Category = { id: string; name: string; slug: string; sort_order: number };
type Accessory = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  category_id: string | null;
  is_trending: boolean;
};

function Index() {
  const [activeCat, setActiveCat] = useState<string | "all">("all");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name,slug,sort_order")
        .order("sort_order")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: accessories = [] } = useQuery({
    queryKey: ["accessories"],
    queryFn: async (): Promise<Accessory[]> => {
      const { data, error } = await supabase
        .from("accessories")
        .select("id,name,description,price,image_url,category_id,is_trending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Accessory[];
    },
  });

  const trending = useMemo(() => accessories.filter((a) => a.is_trending), [accessories]);
  const filtered = useMemo(
    () => (activeCat === "all" ? accessories : accessories.filter((a) => a.category_id === activeCat)),
    [accessories, activeCat],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="mx-auto max-w-5xl px-5 pb-10 pt-8">
        <section>
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            Genuine parts, right fit.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Maruti Suzuki accessories curated by AS Automobiles, Srinagar.
          </p>
        </section>

        {/* Categories */}
        <section className="mt-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Categories
          </h2>
          {categories.length === 0 ? (
            <EmptyHint text="No categories yet. Add some from the Admin panel." />
          ) : (
            <div className="flex flex-wrap gap-2">
              <CategoryChip active={activeCat === "all"} onClick={() => setActiveCat("all")}>
                All
              </CategoryChip>
              {categories.map((c) => (
                <CategoryChip
                  key={c.id}
                  active={activeCat === c.id}
                  onClick={() => setActiveCat(c.id)}
                >
                  {c.name}
                </CategoryChip>
              ))}
            </div>
          )}
        </section>

        {/* Accessories */}
        <section className="mt-10">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Accessories
          </h2>
          {filtered.length === 0 ? (
            <EmptyHint text="No accessories in this category yet." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {filtered.map((a) => (
                <AccessoryCard key={a.id} a={a} />
              ))}
            </div>
          )}
        </section>

        {/* Trending / Hot parts */}
        <section className="mt-12">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Trending &amp; Hot parts
            </h2>
            <span className="text-xs text-accent">🔥</span>
          </div>
          {trending.length === 0 ? (
            <EmptyHint text="Mark accessories as trending in the Admin panel to feature them here." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {trending.map((a) => (
                <AccessoryCard key={a.id} a={a} hot />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors " +
        (active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-primary/40")
      }
    >
      {children}
    </button>
  );
}

function AccessoryCard({ a, hot }: { a: Accessory; hot?: boolean }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md">
      <div className="relative aspect-square bg-muted">
        {a.image_url ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <img
            src={a.image_url}
            alt={a.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
        {hot && (
          <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
            Hot
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{a.name}</h3>
        {a.price != null && (
          <p className="mt-1 text-sm font-semibold text-primary">₹{Number(a.price).toLocaleString("en-IN")}</p>
        )}
      </div>
    </article>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/50 px-4 py-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
