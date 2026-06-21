import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Wrench, Disc, Cog, Zap, Car, Filter, Lightbulb, Gauge, Sparkles,
  Wind, Droplets, CircleDot, Settings, Package,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import heroCar1 from "@/assets/hero-car-1.jpg";
import heroCar2 from "@/assets/hero-car-2.jpg";
import heroCar3 from "@/assets/hero-car-3.jpg";

const HERO_SLIDES = [heroCar1, heroCar2, heroCar3];

function iconForCategory(name: string) {
  const n = name.toLowerCase();
  if (n.includes("brake")) return Disc;
  if (n.includes("shock") || n.includes("suspension")) return Cog;
  if (n.includes("electric") || n.includes("battery")) return Zap;
  if (n.includes("body") || n.includes("exterior")) return Car;
  if (n.includes("filter")) return Filter;
  if (n.includes("light") || n.includes("lamp") || n.includes("head")) return Lightbulb;
  if (n.includes("engine")) return Gauge;
  if (n.includes("interior") || n.includes("cabin")) return Sparkles;
  if (n.includes("ac") || n.includes("air")) return Wind;
  if (n.includes("oil") || n.includes("fluid")) return Droplets;
  if (n.includes("tyre") || n.includes("tire") || n.includes("wheel")) return CircleDot;
  if (n.includes("maruti") || n.includes("part")) return Settings;
  return Package;
}

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
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), 4000);
    return () => clearInterval(t);
  }, []);

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

      <main className="mx-auto max-w-5xl px-5 pb-10 pt-5">
        {/* Hero carousel */}
        <section className="relative overflow-hidden rounded-2xl bg-primary">
          <div className="relative aspect-[16/10] w-full sm:aspect-[21/9]">
            {HERO_SLIDES.map((src, i) => (
              <img
                key={src}
                src={src}
                alt="Maruti Suzuki car"
                width={1280}
                height={720}
                className={
                  "absolute inset-0 h-full w-full object-cover transition-opacity duration-700 " +
                  (i === slide ? "opacity-100" : "opacity-0")
                }
                loading={i === 0 ? "eager" : "lazy"}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                AS Automobiles · Srinagar
              </p>
              <h1 className="mt-1 text-2xl font-bold leading-tight text-primary-foreground sm:text-3xl">
                Genuine Maruti Suzuki parts, right fit.
              </h1>
            </div>
            <div className="absolute bottom-3 right-4 flex gap-1.5">
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={
                    "h-1.5 rounded-full transition-all " +
                    (i === slide ? "w-6 bg-accent" : "w-1.5 bg-primary-foreground/50")
                  }
                />
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="mt-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Categories
          </h2>
          {categories.length === 0 ? (
            <EmptyHint text="No categories yet. Add some from the Admin panel." />
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              <CategoryCard
                icon={Package}
                label="All"
                active={activeCat === "all"}
                onClick={() => setActiveCat("all")}
              />
              {categories.map((c) => (
                <CategoryCard
                  key={c.id}
                  icon={iconForCategory(c.name)}
                  label={c.name}
                  active={activeCat === c.id}
                  onClick={() => setActiveCat(c.id)}
                  onDoubleClickHref={c.slug}
                  href={c.slug}
                />
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

function CategoryCard({
  icon: Icon,
  label,
  active,
  onClick,
  href,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  active: boolean;
  onClick: () => void;
  href?: string;
  onDoubleClickHref?: string;
}) {
  if (href) {
    return (
      <Link
        to="/category/$slug"
        params={{ slug: href }}
        className={
          "flex flex-col items-center justify-center gap-2 rounded-xl border bg-card px-2 py-4 text-center transition-all " +
          (active
            ? "border-primary shadow-sm ring-1 ring-primary/30"
            : "border-border hover:border-primary/40 hover:shadow-sm")
        }
        onClick={(e) => {
          // shift-click filters in place; normal click navigates
          if (e.shiftKey) {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <Icon className={"h-6 w-6 " + (active ? "text-accent" : "text-primary")} strokeWidth={1.75} />
        <span className="line-clamp-2 text-xs font-medium text-foreground">{label}</span>
      </Link>
    );
  }
  return (
    <button
      onClick={onClick}
      className={
        "flex flex-col items-center justify-center gap-2 rounded-xl border bg-card px-2 py-4 text-center transition-all " +
        (active
          ? "border-primary shadow-sm ring-1 ring-primary/30"
          : "border-border hover:border-primary/40 hover:shadow-sm")
      }
    >
      <Icon className={"h-6 w-6 " + (active ? "text-accent" : "text-primary")} strokeWidth={1.75} />
      <span className="line-clamp-2 text-xs font-medium text-foreground">{label}</span>
    </button>
  );
}

function AccessoryCard({ a, hot }: { a: Accessory; hot?: boolean }) {
  return (
    <Link
      to="/product/$id"
      params={{ id: a.id }}
      className="group block overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
    >
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
    </Link>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/50 px-4 py-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
