## Quick commands

- `bun install` (preferred) or `npm install`
- `bun run dev` — local dev server
- `bun run build` — production build (Cloudflare Workers via Nitro)
- `bun run lint` — ESLint + Prettier
- `bun run format` — auto-fix with Prettier

## Stack

- **Framework**: TanStack Start (file-based routing) on Vite 8, deployed to Cloudflare Workers (Nitro preset)
- **UI**: shadcn/ui (new-york style) + Tailwind CSS 4 + Lucide icons
- **Backend**: Supabase — PostgreSQL, auth, storage (`product-images` bucket, public)
- **React**: v19, TanStack React Query, react-hook-form + zod

## Key gotchas

1. **TanStack routing, not Next.js/Remix** — routes live in `src/routes/`, file names map to URLs (e.g. `product.$id.tsx` → `/product/:id`). Do NOT create `src/pages/`, `app/layout.tsx`, etc. The only root layout is `src/routes/__root.tsx`. `routeTree.gen.ts` is auto-generated — never edit by hand.

2. **Server-only code** — ESLint bans `import "server-only"`. TanStack Start convention: rename files to `*.server.ts` (e.g. `client.server.ts`) or use `@tanstack/react-start/server-only`. Route files and `*.functions.ts` ship to the client bundle.

3. **Supabase clients** — Two clients exist:
   - `src/integrations/supabase/client.ts` — browser-safe, publishable key, respects RLS
   - `src/integrations/supabase/client.server.ts` — server-only, service role key, **bypasses RLS**. Dynamic import in server functions: `const { supabaseAdmin } = await import("@/integrations/supabase/client.server")`

4. **Admin auth** — Passcode-based (not Supabase user auth). Passcode verified server-side via `ADMIN_PASSCODE` env var. Stored in `sessionStorage` client-side. All admin server functions require `passcode` in input.

5. **Custom server entry** (`src/server.ts`) — wraps TanStack Start's server entry to catch h3 swallowed errors (generic 500s with `{"unhandled":true}`). Do not remove error normalization logic.

6. **Path alias** — `@/` → `src/` (configured in `tsconfig.json` and `vite.config.ts`).

7. **Image uploads** — Client-side: compress to 1600px max / JPEG 0.85, reject >15MB raw. Server-side: cap at 5MB, allow jpg/png/webp/gif only. Uploaded to Supabase Storage `product-images` bucket.

8. **Color system** — Navy (`primary`) + Orange (`accent`) using oklch in `src/styles.css`. To add a semantic color: add to `:root`/`.dark`, then register in `@theme inline`.

9. **Bun supply-chain guard** — `bunfig.toml` enforces `minimumReleaseAge = 86400` (24h). New packages need explicit exclusion before install.

10. **Database schema** — Two core tables: `categories` (name, slug, sort_order) and `accessories` (name, description, price, image_url, category_id, is_trending, is_oem, images[]). Both have public SELECT via RLS; writes go through `supabaseAdmin` (service role, bypasses RLS).

## Style

- Prettier: 100 chars, semicolons, double quotes, trailing commas
- ESLint: react-hooks rules, no `server-only` import, react-refresh export warnings (not errors)
- No test framework configured — verify changes with `bun run lint` and `bun run build`

## Supabase setup

### 1. Create project
Go to [supabase.com](https://supabase.com), create a new project. Note your **Project URL** and keys.

### 2. Get keys from Settings → API
- `Project URL` → `SUPABASE_URL` / `VITE_SUPABASE_URL`
- `anon public` key → `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server only, bypasses RLS)

### 3. Run migrations
Go to SQL Editor in Supabase dashboard, run each file in `supabase/migrations/` in order:

1. `20260621161444_*.sql` — creates `categories` and `accessories` tables with RLS
2. `20260625044638_*.sql` — adds `is_oem` column
3. `20260625051134_*.sql` — adds `images` array column
4. `20260812000000_product_images_storage.sql` — creates storage bucket
5. `20260813000000_product_images_bucket_public.sql` — makes bucket public with read policy

Or use CLI: `supabase db push`

### 4. Set environment variables
Copy `.env.example` to `.env` and fill in:

```
SUPABASE_URL=https://your-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
VITE_SUPABASE_URL=https://your-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
ADMIN_PASSCODE=your-secret-passcode
```

### 5. Verify
- Run `bun run dev`
- Open `/admin`, enter passcode
- Upload a test image — should see it appear in the product list
- Visit `/` — should see categories and products (empty at first)

## Deployment (Cloudflare Pages)

### Prerequisites
1. [Cloudflare account](https://dash.cloudflare.com) (free tier works)
2. [GitHub repo](https://github.com) connected to the project

### First-time setup

#### 1. Create Cloudflare Pages project
Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages → Create → Pages → Connect to Git → select your repo.

#### 2. Set environment variables in Cloudflare
In the Pages project → Settings → Environment variables, add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `SUPABASE_URL` | `https://your-ref.supabase.co` | Production + Preview |
| `SUPABASE_PUBLISHABLE_KEY` | Your JWT anon key | Production + Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | Your JWT service role key | Production only |
| `VITE_SUPABASE_URL` | Same as SUPABASE_URL | Production + Preview |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Same as SUPABASE_PUBLISHABLE_KEY | Production + Preview |
| `ADMIN_PASSCODE` | Your admin passcode | Production + Preview |
| `SITE_URL` | `https://your-project.pages.dev` | Production |

#### 3. Set GitHub Actions secrets
In your GitHub repo → Settings → Secrets and variables → Actions, add:

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | Create at [Cloudflare dashboard](https://dash.cloudflare.com/profile/api-tokens) → API Tokens → Create Token → "Edit Cloudflare Workers" template |
| `CLOUDFLARE_ACCOUNT_ID` | Found at Dashboard → Workers & Pages → Overview (right sidebar) |
| `VITE_SUPABASE_URL` | Your Supabase URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon key |
| `SUPABASE_URL` | Your Supabase URL |
| `SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `ADMIN_PASSCODE` | Your admin passcode |
| `SITE_URL` | `https://your-project.pages.dev` |

#### 4. Deploy
Push to `main` branch → GitHub Actions runs lint + build → deploys to Cloudflare Pages automatically.

### Custom domain
1. In Cloudflare Pages project → Custom domains → Add custom domain
2. Enter your domain (e.g. `asautomobiles.com`)
3. Cloudflare provides DNS records — add them to your domain registrar
4. SSL certificate is auto-provisioned (usually within minutes)

### Manual deploy (alternative)
```bash
# Login to Cloudflare
bunx wrangler login

# Build
bun run build

# Deploy to Pages
bunx wrangler pages deploy .output/public --project-name=as-automotive
```

### .env reference
```
SUPABASE_URL=https://your-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
VITE_SUPABASE_URL=https://your-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
ADMIN_PASSCODE=your-secret-passcode
SITE_URL=https://your-project.pages.dev
```
