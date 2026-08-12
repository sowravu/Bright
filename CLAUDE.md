@AGENTS.md

# Bright — Premium Smartphone Store (Frontend)

A Next.js 16 (App Router) e-commerce storefront called **"Bright"** ("Bright Choices. Smarter Phones.") selling smartphones (Vivo, Lava, Nothing, Samsung, OnePlus) and accessories (cases, chargers, earphones). This repo is **frontend-only** — it expects an optional backend API at `http://localhost:5000/api/*`, and gracefully falls back to mock/local data when that backend is unavailable.

## Tech stack

- **Next.js 16.2.10** (App Router), **React 19.2.4**, TypeScript
- **Redux Toolkit** + **react-redux** for global state
- **Tailwind CSS 4** (via `@tailwindcss/postcss`) + CSS Modules per page/component
- **lucide-react** for icons, **canvas-confetti** for the order-success celebration
- ESLint 9 (`eslint-config-next`)

## Running the project

```bash
npm run dev          # local dev server (localhost:3000)
npm run dev:public   # dev server bound to 0.0.0.0:3000 (LAN-accessible)
npm run build && npm run start
npm run tunnel        # cloudflared quick tunnel, pairs with dev:public
```

There is a `Dockerfile` for containerized runs. No test suite is currently configured.

## Architecture overview

### Data layer — no real backend required
Every page tries `fetch('http://localhost:5000/api/...')` first, and on any failure (network error or non-OK response) falls back to **hardcoded mock data** so the whole app is fully click-through-able offline. This fallback pattern is repeated across almost every page (products list, product details, cart coupons, admin analytics, compare highlights, AI chatbot, auth).

### State: Redux store (`src/store/`)
- `index.ts` — combines `auth`, `cart`, `compare`, `products` reducers.
- `authSlice.ts` — user/token, persisted to `localStorage` (`bright_token`, `bright_user`). Roles: `USER`, `EMPLOYEE`, `ADMIN`.
- `cartSlice.ts` — cart items + coupon, persisted to `localStorage` (`bright_cart`).
- `productsSlice.ts` — the entire product catalog (~28 seeded smartphones/accessories) lives here as `initialFallbackProducts`, persisted to `localStorage` (`bright_products`) once modified. Admin-added products get prepended here, which is why they immediately show up across Products/Accessories/Search.
- `compareSlice.ts` — up to 4 products for the comparison matrix (not persisted).
- `StoreProvider.tsx` — wraps the app with `<Provider>` and also mounts `ThemeProvider`.

### Contexts (`src/context/`)
- `ThemeContext.tsx` — light/dark theme, persisted to `localStorage` (`bright_theme`), defaults to OS preference, sets `data-theme` on `<html>`.
- `ToastContext.tsx` — global toast notification system (`showToast(message, type)`), auto-dismiss after 4s, rendered as a fixed overlay.

### Routes (`src/app/`, App Router)
| Route | Purpose |
|---|---|
| `/` | Home — hero banner, flash-deals countdown, **AI Phone Finder** wizard (3-question quiz → recommendation), Exchange Value calculator, EMI calculator, FAQ accordion. |
| `/products` | Smartphone catalog with sidebar filters (search, brand, price range, RAM, 5G toggle), sorting, add-to-cart, add-to-compare. Reads/writes the Redux products catalog. |
| `/products/[slug]` | Product detail page — image gallery, color/RAM/storage variant selector with per-variant stock/pricing, accessory add-ons, pincode delivery check, review submission, full spec sheet, add-to-cart/compare/buy-now. |
| `/accessories` | Accessories catalog (cases, chargers, earphones) with category/subcategory-aware filters. |
| `/cart` | Cart items, quantity controls, coupon codes (`WELCOME10`, `BRIGHTFEST`), multi-step checkout modal (shipping → payment: Stripe/Razorpay/UPI), order confirmation with confetti + receipt. |
| `/compare` | Side-by-side spec matrix for up to 4 products, with computed "Best Battery / Processor / Display / Value" badges and a mock "AI Performance Index" bar chart. |
| `/login` | Auth portal with 3 modes: password (login/register), OTP (phone + code `123456`), 2FA (code `123456`), plus a mock "Continue with Google" button. Falls back to hardcoded test accounts if the backend is unreachable (see below). |
| `/user` | Customer dashboard — Orders, Addresses, Support Tickets, 2FA toggle. Requires auth. |
| `/admin` | Admin dashboard — KPI cards, catalog/stock manager (inline stock editing), order status manager, activity audit log, "Add Brand" and "Add Product" modals (product form supports full smartphone/accessory spec sets). Requires `role === 'ADMIN'`. |

### Shared components (`src/components/`)
- `Navbar.tsx` — logo, Smartphones brand dropdown, Accessories/Compare links, debounced AI-powered search-as-you-type with suggestions dropdown, theme toggle, cart/compare badges, auth-aware user menu.
- `Footer.tsx` — trust badges, brand/category links, newsletter signup (mock).
- `AIChatBot.tsx` — floating chat widget ("Bright Assistant") that posts to `/api/products/ai-chat`; shows canned suggestion chips on first open.

### Mock/demo credentials (used when the backend at `localhost:5000` is down)
- Admin: `admin@bright.com` / `admin123`
- User: `user@bright.com` / `user123`
- OTP / 2FA codes: `123456`

## Conventions in this codebase

- Every page component that uses `useSearchParams()` wraps its content in `<Suspense>` (required by Next.js App Router) — e.g. `LoginPage`, `ProductsList`, `AccessoriesList`.
- Styling is CSS Modules co-located with each route/component (`*.module.css`), plus shared utility classes (`glass`, `glassCard`, `btn btnPrimary`, `btn btnSecondary`, `container`) from `globals.css`.
- All monetary values are in ₹ (INR), formatted with `.toLocaleString()`.
- Stock-level UI convention: 0 = "Out of Stock" (red), 1–5 = "Few Stock Only" (amber/warning), 6+ = "In Stock" (green/success).
- Product `category` is `'smartphones'` or `'accessories'`; accessories additionally use `subcategory` (`backcover` | `charger` | `earphone`) and `specs.accessoryType`.

## Important note on Next.js version

Per `AGENTS.md`, this project pins a **Next.js version with breaking changes relative to your training data**. Before writing App Router code (routing, data fetching, config, metadata, etc.), check `node_modules/next/dist/docs/` for the current APIs/conventions rather than assuming standard Next.js behavior.
