import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Header } from "@/components/site/Header";
import { X, Search, Trash2, Edit2, Check, AlertCircle, Image as ImageIcon, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  verifyPasscode,
  getAdminCategories,
  getAdminAccessories,
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
  images: string[] | null;
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
    <div className="min-h-screen bg-linear-to-br from-background to-muted">
      <Header />
      <div className="mx-auto mt-24 max-w-sm px-5">
        <div className="space-y-2 text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage products and categories</p>
        </div>
        <form
          className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm"
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
          <div>
            <label className="block text-sm font-medium mb-1">Admin Passcode</label>
            <input
              type="password"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="••••••"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          {err && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {err}
            </div>
          )}
          <button
            type="submit"
            disabled={busy || !value}
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {busy ? "Verifying…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminDashboard({ passcode, onLogout }: { passcode: string; onLogout: () => void }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"products" | "categories">("products");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingAccessory, setEditingAccessory] = useState<Accessory | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchCategories = useServerFn(getAdminCategories);
  const fetchAccessories = useServerFn(getAdminAccessories);

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async (): Promise<Category[]> => {
      const data = await fetchCategories({ data: { passcode } });
      return data;
    },
  });

  const { data: accessories = [] } = useQuery({
    queryKey: ["admin-accessories"],
    queryFn: async (): Promise<Accessory[]> => {
      const data = await fetchAccessories({ data: { passcode } });
      return data;
    },
  });

  const filteredAccessories = useMemo(() => {
    return accessories.filter(a => 
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    );
  }, [accessories, searchTerm]);

  const addCat = useServerFn(createCategory);
  const delCat = useServerFn(deleteCategory);
  const upImg = useServerFn(uploadProductImage);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
    qc.invalidateQueries({ queryKey: ["admin-accessories"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["accessories"] });
  };

  const [catName, setCatName] = useState("");
  const [catErr, setCatErr] = useState("");

  // Resizes large images in the browser (max 1600px on the long edge, JPEG
  // quality 0.85) before upload. Keeps original if it's already small/simple
  // (e.g. GIFs), so animations aren't broken.
  async function compressImage(file: File): Promise<File> {
    if (file.type === "image/gif" || file.size < 400 * 1024) return file;
    try {
      const bitmap = await createImageBitmap(file);
      const maxDim = 1600;
      const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
      const w = Math.round(bitmap.width * scale);
      const h = Math.round(bitmap.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;
      ctx.drawImage(bitmap, 0, 0, w, h);
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.85)
      );
      if (!blob) return file;
      return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
    } catch {
      // If the browser can't decode/compress it, fall back to the original file.
      return file;
    }
  }

  async function uploadFile(rawFile: File): Promise<string> {
    if (rawFile.size > 15 * 1024 * 1024) {
      throw new Error("Image must be under 15 MB.");
    }
    const file = await compressImage(rawFile);
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Image is still too large after compression. Try a smaller photo.");
    }
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
    return res.url;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl px-5 py-8">
        {/* Header */}
        <div className="flex flex-col justify-between items-start md:items-center md:flex-row gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Product Management</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage categories and products for your store</p>
          </div>
          <button 
            onClick={onLogout} 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Products</p>
            <p className="text-2xl font-bold text-foreground mt-1">{accessories.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Categories</p>
            <p className="text-2xl font-bold text-foreground mt-1">{categories.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">OEM Parts</p>
            <p className="text-2xl font-bold text-primary mt-1">{accessories.filter(a => a.is_oem).length}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Trending</p>
            <p className="text-2xl font-bold text-accent mt-1">{accessories.filter(a => a.is_trending).length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button
            onClick={() => setTab("products")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              tab === "products"
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            Products ({accessories.length})
          </button>
          <button
            onClick={() => setTab("categories")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              tab === "categories"
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            Categories ({categories.length})
          </button>
        </div>

        {/* Categories Tab */}
        {tab === "categories" && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full"></span>
                Add New Category
              </h2>
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setCatErr("");
                  if (!catName.trim()) {
                    setCatErr("Category name is required");
                    return;
                  }
                  const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                  try {
                    await addCat({ data: { passcode, name: catName.trim(), slug } });
                    setCatName("");
                    refresh();
                  } catch (e: unknown) {
                    setCatErr(e instanceof Error ? e.message : "Failed to add category");
                  }
                }}
              >
                <div>
                  <label className="block text-sm font-medium mb-1">Category Name</label>
                  <input
                    value={catName}
                    onChange={(e) => { setCatName(e.target.value); setCatErr(""); }}
                    placeholder="e.g., Brake System, Engine Parts"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Used to organize products on the website</p>
                </div>
                {catErr && (
                  <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-2 py-1.5 rounded">
                    <AlertCircle className="h-3 w-3 shrink-0" /> {catErr}
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Add Category
                </button>
              </form>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full"></span>
                Existing Categories
              </h2>
              <ul className="space-y-2">
                {categories.length === 0 && (
                  <li className="py-3 text-sm text-muted-foreground">No categories yet. Create one to get started.</li>
                )}
                {categories.map((c) => (
                  <li key={c.id} className="flex items-center justify-between p-2 rounded border border-border hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-medium">{c.name}</span>
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete category "${c.name}"? Products in this category won't be deleted.`)) return;
                        try {
                          await delCat({ data: { passcode, id: c.id } });
                          refresh();
                        } catch (e: unknown) {
                          toast.error(e instanceof Error ? e.message : "Failed");
                        }
                      }}
                      className="text-xs px-2 py-1 rounded text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {tab === "products" && (
          <div className="space-y-6">
            {/* Add Product Section */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full"></span>
                Add New Product
              </h2>
              <AddProductForm 
                passcode={passcode} 
                categories={categories} 
                uploadFile={uploadFile}
                onSuccess={() => { refresh(); setSearchTerm(""); }}
              />
            </div>

            {/* Product List Section */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <h2 className="font-semibold text-lg">Products ({filteredAccessories.length})</h2>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or description..."
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {filteredAccessories.length === 0 && accessories.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  <p className="text-sm">No products yet. Add one above!</p>
                </div>
              )}

              {filteredAccessories.length === 0 && accessories.length > 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  <p className="text-sm">No products match your search.</p>
                </div>
              )}

              <div className="space-y-2">
                {filteredAccessories.map((a) => (
                  <ProductListItem
                    key={a.id}
                    accessory={a}
                    categories={categories}
                    passcode={passcode}
                    onEdit={() => { setEditingAccessory(a); setIsEditModalOpen(true); }}
                    onUpdate={() => refresh()}
                    onDelete={() => refresh()}
                    uploadFile={uploadFile}
                  />
                ))}
              </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && editingAccessory && (
              <EditProductModal
                product={editingAccessory}
                categories={categories}
                passcode={passcode}
                uploadFile={uploadFile}
                onClose={() => { setIsEditModalOpen(false); setEditingAccessory(null); }}
                onSave={() => { refresh(); setIsEditModalOpen(false); setEditingAccessory(null); }}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function AddProductForm({ passcode, categories, uploadFile, onSuccess }: {
  passcode: string;
  categories: Category[];
  uploadFile: (file: File) => Promise<string>;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    category_id: "",
    is_trending: false,
    is_oem: false,
    image_url: "",
    images: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadingExtra, setUploadingExtra] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const addAcc = useServerFn(createAccessory);
  const upImg = useServerFn(uploadProductImage);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Product name is required";
    if (form.name.trim().length < 3) newErrors.name = "Product name must be at least 3 characters";
    if (form.price && Number(form.price) < 0) newErrors.price = "Price cannot be negative";
    return newErrors;
  };

  const handleImageUpload = async (file: File, isExtra: boolean) => {
    if (isExtra) setUploadingExtra(true);
    else setUploading(true);
    try {
      const url = await uploadFile(file);
      if (isExtra) {
        if (form.images.length < 3) {
          setForm(f => ({ ...f, images: [...f.images, url] }));
        } else {
          toast.error("Maximum 3 extra images allowed");
        }
      } else {
        setForm(f => ({ ...f, image_url: url }));
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      if (isExtra) setUploadingExtra(false);
      else setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setSubmitting(true);
    try {
      await addAcc({
        data: {
          passcode,
          name: form.name.trim(),
          description: form.description.trim() || null,
          price: form.price ? Number(form.price) : null,
          image_url: form.image_url.trim() || null,
          category_id: form.category_id || null,
          is_trending: form.is_trending,
          is_oem: form.is_oem,
          images: form.images,
        },
      });
      setForm({
        name: "",
        price: "",
        description: "",
        category_id: "",
        is_trending: false,
        is_oem: false,
        image_url: "",
        images: [],
      });
      setErrors({});
      toast.success("Product added successfully");
      onSuccess();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to add product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Product Name *</label>
          <input
            value={form.name}
            onChange={(e) => { setForm(f => ({ ...f, name: e.target.value })); setErrors(e => ({ ...e, name: "" })); }}
            placeholder="e.g., Brake Pads Set, Oil Filter"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          <p className="text-xs text-muted-foreground mt-1">Be specific and descriptive</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Price (₹)</label>
          <input
            value={form.price}
            onChange={(e) => { setForm(f => ({ ...f, price: e.target.value })); setErrors(e => ({ ...e, price: "" })); }}
            type="number"
            placeholder="0"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {errors.price && <p className="text-xs text-destructive mt-1">{errors.price}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <select
          value={form.category_id}
          onChange={(e) => setForm(f => ({ ...f, category_id: e.target.value }))}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        >
          <option value="">Select a category...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground mt-1">Helps customers find your product</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Add product details like fitment, specifications, warranty info, etc."
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">Help customers understand what they're buying</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Main Product Image</label>
        <div className="flex gap-2">
          <label className="flex-1 cursor-pointer rounded-md border-2 border-dashed border-input hover:border-primary px-4 py-3 text-center transition-colors">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, false); e.currentTarget.value = ""; }}
            />
            <div className="text-sm">
              {uploading ? "Uploading..." : "📷 Click to upload or paste URL"}
            </div>
          </label>
        </div>
        {form.image_url && (
          <div className="flex gap-2 items-start">
            <img src={form.image_url} alt="preview" className="h-20 w-20 rounded object-cover border border-border" />
            <div className="flex-1">
              <p className="text-xs font-mono text-muted-foreground break-all">{form.image_url}</p>
              <button type="button" onClick={() => setForm(f => ({ ...f, image_url: "" }))} className="text-xs text-destructive hover:underline mt-1">Remove</button>
            </div>
          </div>
        )}
        <input
          value={form.image_url}
          onChange={(e) => setForm(f => ({ ...f, image_url: e.target.value }))}
          placeholder="Or paste image URL here..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <p className="text-xs text-muted-foreground">💡 Tip: Use JPG or WebP format for smaller file sizes and faster loading</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Extra Images (Gallery)</label>
        <p className="text-xs text-muted-foreground">Add up to 3 more images to showcase the product from different angles</p>
        <label className="cursor-pointer inline-flex items-center gap-2 rounded-md border border-input hover:border-primary px-3 py-2 text-sm transition-colors">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploadingExtra || form.images.length >= 3}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, true); e.currentTarget.value = ""; }}
          />
          <Plus className="h-4 w-4" />
          {uploadingExtra ? "Uploading..." : "Add image"}
        </label>
        {form.images.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-2">
            {form.images.map((img, i) => (
              <div key={i} className="relative">
                <img src={img} alt={`extra ${i}`} className="h-16 w-16 rounded object-cover border border-border" />
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                  className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-destructive text-white text-xs flex items-center justify-center hover:bg-destructive/90"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_oem}
            onChange={(e) => setForm(f => ({ ...f, is_oem: e.target.checked }))}
          />
          <span>Genuine OEM Part</span>
          <span className="text-xs text-muted-foreground">(Official Maruti part)</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_trending}
            onChange={(e) => setForm(f => ({ ...f, is_trending: e.target.checked }))}
          />
          <span>🔥 Trending / Hot</span>
          <span className="text-xs text-muted-foreground">(Highlight popular items)</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting || uploading || uploadingExtra}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Adding..." : "Add Product"}
      </button>
    </form>
  );
}

function ProductListItem({ 
  accessory, 
  categories, 
  passcode, 
  onEdit, 
  onUpdate, 
  onDelete,
  uploadFile 
}: {
  accessory: Accessory;
  categories: Category[];
  passcode: string;
  onEdit: () => void;
  onUpdate: () => void;
  onDelete: () => void;
  uploadFile: (file: File) => Promise<string>;
}) {
  const updAcc = useServerFn(updateAccessory);
  const delAcc = useServerFn(deleteAccessory);
  const catName = categories.find(c => c.id === accessory.category_id)?.name;

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
      <div className="shrink-0">
        <div className="h-20 w-20 rounded-lg border border-border bg-muted overflow-hidden">
          {accessory.image_url ? (
            <img src={accessory.image_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
              <ImageIcon className="h-8 w-8" />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-foreground truncate">{accessory.name}</h3>
          <div className="flex items-center gap-1 flex-wrap justify-end">
            {accessory.is_oem && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">OEM</span>}
            {accessory.is_trending && <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded">🔥 Hot</span>}
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{accessory.description || "No description"}</p>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {accessory.price != null && <span>₹{Number(accessory.price).toLocaleString("en-IN")}</span>}
          {catName && <span>📁 {catName}</span>}
          <span>📷 {1 + (accessory.images?.length ?? 0)} image{1 + (accessory.images?.length ?? 0) !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1 rounded-md border border-input px-3 py-1.5 text-sm hover:bg-muted transition-colors"
        >
          <Edit2 className="h-4 w-4" />
          <span className="hidden sm:inline">Edit</span>
        </button>
        <button
          onClick={async () => {
            if (!confirm(`Delete "${accessory.name}"?`)) return;
            try {
              await delAcc({ data: { passcode, id: accessory.id } });
              onDelete();
            } catch (e: unknown) {
              toast.error(e instanceof Error ? e.message : "Failed");
            }
          }}
          className="inline-flex items-center gap-1 rounded-md border border-destructive/50 text-destructive px-3 py-1.5 text-sm hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Delete</span>
        </button>
      </div>
    </div>
  );
}

function EditProductModal({ 
  product, 
  categories, 
  passcode, 
  uploadFile,
  onClose, 
  onSave 
}: {
  product: Accessory;
  categories: Category[];
  passcode: string;
  uploadFile: (file: File) => Promise<string>;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({ ...product });
  const [uploading, setUploading] = useState(false);
  const updAcc = useServerFn(updateAccessory);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updAcc({
        data: {
          passcode,
          id: product.id,
          name: form.name.trim(),
          description: form.description?.trim() || null,
          price: form.price ? Number(form.price) : null,
          image_url: form.image_url?.trim() || null,
          category_id: form.category_id || null,
          is_trending: form.is_trending,
          is_oem: form.is_oem,
          images: form.images || [],
        },
      });
      onSave();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update product");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
          <h2 className="text-lg font-semibold">Edit Product</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Product Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Price (₹)</label>
              <input
                value={form.price || ""}
                onChange={(e) => setForm(f => ({ ...f, price: e.target.value ? Number(e.target.value) : null }))}
                type="number"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={form.category_id || ""}
                onChange={(e) => setForm(f => ({ ...f, category_id: e.target.value || null }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="">Select category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={form.description || ""}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value || null }))}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_oem}
                onChange={(e) => setForm(f => ({ ...f, is_oem: e.target.checked }))}
              />
              Genuine OEM
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_trending}
                onChange={(e) => setForm(f => ({ ...f, is_trending: e.target.checked }))}
              />
              Trending / Hot
            </label>
          </div>

          <div className="flex gap-2 pt-4 border-t border-border">
            <button type="button" onClick={onClose} className="flex-1 rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
              <Check className="h-4 w-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
