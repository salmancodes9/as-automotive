import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";
import {
  verifyPasscode,
  createCategory,
  deleteCategory,
  createAccessory,
  updateAccessory,
  deleteAccessory,
  uploadProductImage,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — AS Automobiles" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const PASS_KEY = "as_admin_passcode";

type Category = { id: string; name: string; slug: string };
type Accessory = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  category_id: string | null;
  is_trending: boolean;
  is_oem: boolean;
};

function AdminPage() {
  const [passcode, setPasscode] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem(PASS_KEY);
    if (saved) setPasscode(saved);
  }, []);

  if (!passcode) return <PasscodeGate onUnlock={(p) => setPasscode(p)} />;
  return <AdminDashboard passcode={passcode} onLogout={() => {
    sessionStorage.removeItem(PASS_KEY);
    setPasscode(null);
  }} />;
}

function PasscodeGate({ onUnlock }: { onUnlock: (p: string) => void }) {
  const [value, setValue] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const verify = useServerFn(verifyPasscode);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto mt-24 max-w-sm px-5">
        <h1 className="text-xl font-semibold text-foreground">Admin sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter the admin passcode to manage the catalog.</p>
        <form
          className="mt-6 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setErr(null);
            setBusy(true);
            try {
              await verify({ data: { passcode: value } });
              sessionStorage.setItem(PASS_KEY, value);
              onUnlock(value);
            } catch (e: unknown) {
              setErr(e instanceof Error ? e.message : "Invalid passcode");
            } finally {
              setBusy(false);
            }
          }}
        >
          <input
            type="password"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Passcode"
            className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          />
          {err && <p className="text-xs text-destructive">{err}</p>}
          <button
            type="submit"
            disabled={busy || !value}
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Checking…" : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminDashboard({ passcode, onLogout }: { passcode: string; onLogout: () => void }) {
  const qc = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase.from("categories").select("id,name,slug").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: accessories = [] } = useQuery({
    queryKey: ["admin-accessories"],
    queryFn: async (): Promise<Accessory[]> => {
      const { data, error } = await supabase
        .from("accessories")
        .select("id,name,description,price,image_url,category_id,is_trending,is_oem")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Accessory[];
    },
  });

  const addCat = useServerFn(createCategory);
  const delCat = useServerFn(deleteCategory);
  const addAcc = useServerFn(createAccessory);
  const updAcc = useServerFn(updateAccessory);
  const delAcc = useServerFn(deleteAccessory);
  const upImg = useServerFn(uploadProductImage);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
    qc.invalidateQueries({ queryKey: ["admin-accessories"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["accessories"] });
  };

  // category form
  const [catName, setCatName] = useState("");

  // accessory form
  const [aName, setAName] = useState("");
  const [aPrice, setAPrice] = useState("");
  const [aImg, setAImg] = useState("");
  const [aDesc, setADesc] = useState("");
  const [aCat, setACat] = useState("");
  const [aTrend, setATrend] = useState(false);
  const [aOem, setAOem] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleFilePick(file: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      const dataBase64 = btoa(binary);
      const res = await upImg({
        data: {
          passcode,
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          dataBase64,
        },
      });
      setAImg(res.url);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-5 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Admin</h1>
          <button onClick={onLogout} className="text-xs text-muted-foreground hover:text-primary">
            Sign out
          </button>
        </div>

        {/* Categories */}
        <section className="mt-8 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Categories
          </h2>
          <form
            className="mt-3 flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!catName.trim()) return;
              const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
              try {
                await addCat({ data: { passcode, name: catName.trim(), slug } });
                setCatName("");
                refresh();
              } catch (e: unknown) {
                alert(e instanceof Error ? e.message : "Failed");
              }
            }}
          >
            <input
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="New category name"
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Add
            </button>
          </form>
          <ul className="mt-4 divide-y divide-border">
            {categories.length === 0 && (
              <li className="py-3 text-sm text-muted-foreground">No categories yet.</li>
            )}
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                <span>{c.name}</span>
                <button
                  onClick={async () => {
                    if (!confirm(`Delete "${c.name}"?`)) return;
                    try {
                      await delCat({ data: { passcode, id: c.id } });
                      refresh();
                    } catch (e: unknown) {
                      alert(e instanceof Error ? e.message : "Failed");
                    }
                  }}
                  className="text-xs text-destructive hover:underline"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Accessories */}
        <section className="mt-6 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Accessories
          </h2>
          <form
            className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!aName.trim()) return;
              try {
                await addAcc({
                  data: {
                    passcode,
                    name: aName.trim(),
                    description: aDesc.trim() || null,
                    price: aPrice ? Number(aPrice) : null,
                    image_url: aImg.trim() || null,
                    category_id: aCat || null,
                    is_trending: aTrend,
                    is_oem: aOem,
                  },
                });
                setAName(""); setAPrice(""); setAImg(""); setADesc(""); setACat(""); setATrend(false); setAOem(false);
                refresh();
              } catch (e: unknown) {
                alert(e instanceof Error ? e.message : "Failed");
              }
            }}
          >
            <input value={aName} onChange={(e) => setAName(e.target.value)} placeholder="Name" className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
            <input value={aPrice} onChange={(e) => setAPrice(e.target.value)} placeholder="Price (₹)" type="number" className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
            <div className="sm:col-span-2 space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:border-primary/40">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFilePick(f);
                      e.currentTarget.value = "";
                    }}
                  />
                  {uploading ? "Uploading…" : "📷 Upload from gallery"}
                </label>
                <span className="text-xs text-muted-foreground">or paste image URL below</span>
              </div>
              <input
                value={aImg}
                onChange={(e) => setAImg(e.target.value)}
                placeholder="Image URL"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              {aImg && (
                <div className="h-20 w-20 overflow-hidden rounded border border-border bg-muted">
                  <img src={aImg} alt="" className="h-full w-full object-cover" />
                </div>
              )}
            </div>
            <input value={aDesc} onChange={(e) => setADesc(e.target.value)} placeholder="Description (optional)" className="rounded-md border border-input bg-background px-3 py-2 text-sm sm:col-span-2" />
            <select value={aCat} onChange={(e) => setACat(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">— Select category —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={aTrend} onChange={(e) => setATrend(e.target.checked)} />
                Trending / Hot
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={aOem} onChange={(e) => setAOem(e.target.checked)} />
                OEM
              </label>
            </div>
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground sm:col-span-2">
              Add accessory
            </button>
          </form>

          <ul className="mt-4 divide-y divide-border">
            {accessories.length === 0 && (
              <li className="py-3 text-sm text-muted-foreground">No accessories yet.</li>
            )}
            {accessories.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-3 text-sm">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-muted">
                  {a.image_url && <img src={a.image_url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{a.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.price != null ? `₹${Number(a.price).toLocaleString("en-IN")}` : "—"}
                    {a.is_trending && <span className="ml-2 text-accent">🔥 Hot</span>}
                    {a.is_oem && <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">OEM</span>}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await updAcc({ data: { passcode, id: a.id, is_oem: !a.is_oem } });
                      refresh();
                    } catch (e: unknown) {
                      alert(e instanceof Error ? e.message : "Failed");
                    }
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  {a.is_oem ? "Remove OEM" : "Mark OEM"}
                </button>
                <button
                  onClick={async () => {
                    try {
                      await updAcc({ data: { passcode, id: a.id, is_trending: !a.is_trending } });
                      refresh();
                    } catch (e: unknown) {
                      alert(e instanceof Error ? e.message : "Failed");
                    }
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  {a.is_trending ? "Unmark" : "Mark hot"}
                </button>
                <button
                  onClick={async () => {
                    if (!confirm(`Delete "${a.name}"?`)) return;
                    try {
                      await delAcc({ data: { passcode, id: a.id } });
                      refresh();
                    } catch (e: unknown) {
                      alert(e instanceof Error ? e.message : "Failed");
                    }
                  }}
                  className="text-xs text-destructive hover:underline"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}