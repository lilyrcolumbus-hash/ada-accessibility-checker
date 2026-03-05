# SiteSafe — ADA Website Accessibility Checker

## Product Overview
A self-service web tool that scans any website for ADA/WCAG 2.1 AA accessibility violations, explains issues in plain English with copy-paste code fixes, and provides risk assessment — so small businesses can fix problems before a $10,000+ lawsuit finds them.

**Business model:** Hybrid — one-time payment for the fix report ($49), annual subscription for ongoing monitoring ($199/year). No monthly subscriptions on the entry tier.

## Pricing
| Plan | ID | Price | Model | Key Features |
|---|---|---|---|---|
| **Free Scan** | `free` | $0 | Free | 1 page, score, risk, all issues visible, 1 code fix free |
| **Fix My Site** | `fix-my-site` | $49 one-time | One-time payment | Up to 50 pages, all code fixes, action plan, shareable report, 1 re-scan |
| **Compliance Shield** | `compliance-shield` | $199/year | Annual subscription | Everything in Fix My Site + up to 5 sites, unlimited re-scans, monthly auto-scans, email alerts, compliance badge |

Old plan IDs (`full-report`, `agency`, `starter`, `pro`, `business`) no longer exist.

Stripe Price IDs:
- Fix My Site: `price_1T7MPaFfYL1pGw0ot4eQO3Bp`
- Compliance Shield: `price_1T7MiPFfYL1pGw0ohwz2MHvV`

## Tech Stack
- **Frontend:** React 19 + Vite 7 + TypeScript + Tailwind CSS v4 (uses `@theme` for custom colors)
- **Backend/DB:** Supabase (Auth + PostgreSQL + Edge Functions in Deno)
- **Payments:** Stripe (one-time `mode: 'payment'` for Fix My Site, `mode: 'subscription'` for Compliance Shield) + PayPal (`@paypal/react-paypal-js`)
- **Deploy:** Netlify (free tier)
- **Icons:** Lucide React
- **State:** React Context (AuthContext) + sessionStorage for scan results + TanStack React Query (`@tanstack/react-query`)
- **Router:** React Router v7 (react-router-dom@7.13.1)
- **Utilities:** clsx + tailwind-merge (combined as `cn()` in `lib/utils.ts`), react-hot-toast
- **Path alias:** `@/*` → `./src/*` (configured in `tsconfig.json`)

## Project Structure
```
ada-accessibility-checker/
├── index.html                      # Root HTML: SEO meta tags (title + description), favicon, #root
├── public/
│   └── favicon.svg                 # SVG favicon
├── src/
│   ├── main.tsx                    # Entry point: BrowserRouter + QueryClient + AuthProvider + Toaster
│   ├── App.tsx                     # Route definitions
│   ├── index.css                   # Tailwind v4 imports + @theme custom colors
│   ├── vite-env.d.ts               # Vite type declarations
│   ├── scanner/                    # WCAG scanning engine (runs client-side)
│   │   ├── types.ts                # ScanIssue, ScanResult, RiskAssessment, CostEstimate
│   │   ├── engine.ts               # Orchestrator: runs all checks, aggregates results
│   │   ├── parser.ts               # HTML string → DOM Document via DOMParser
│   │   ├── scoring.ts              # Compliance score 0-100 (getScoreColor, getScoreLabel)
│   │   ├── risk-calculator.ts      # Industry + state risk scoring (getRiskColor, calculateRisk)
│   │   ├── cost-estimator.ts       # Fix time/cost estimates (formatCurrency, formatTime)
│   │   ├── color-utils.ts          # Contrast ratio calc + compliant color suggestions
│   │   └── checks/                 # 11 individual WCAG checks
│   │       ├── index.ts            # Re-exports all checks as array
│   │       ├── alt-text.ts
│   │       ├── color-contrast.ts
│   │       ├── form-labels.ts
│   │       ├── heading-hierarchy.ts
│   │       ├── link-text.ts
│   │       ├── lang-attribute.ts
│   │       ├── empty-interactive.ts
│   │       ├── duplicate-ids.ts
│   │       ├── table-headers.ts
│   │       ├── aria-roles.ts
│   │       └── auto-play-media.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Layout.tsx          # Outlet wrapper with Header + Footer
│   │   ├── landing/
│   │   │   ├── HeroSection.tsx     # URL input + "Is your website lawsuit-proof?"
│   │   │   ├── StatsSection.tsx    # 4,605 lawsuits stat cards
│   │   │   ├── HowItWorksSection.tsx # 3-step process
│   │   │   ├── FearSection.tsx     # Risk factors + top lawsuit states + industries
│   │   │   ├── PricingSection.tsx  # 3 pricing cards + competitor comparison
│   │   │   └── TrustSection.tsx    # "Real scanning, not an overlay"
│   │   ├── scan-results/
│   │   │   ├── ScoreGauge.tsx      # 160px SVG circle with glow + shield icon
│   │   │   ├── RiskBadge.tsx       # Solid colored badge with pulse for extreme
│   │   │   ├── RiskBreakdown.tsx   # Industry/state/liability/probability cards
│   │   │   ├── IssueCard.tsx       # Collapsible card with severity border + code diff
│   │   │   ├── IssuesList.tsx      # Filter by severity + visible/blurred/hidden
│   │   │   ├── PriorityPlan.tsx    # Top 3 issues with score projection
│   │   │   ├── CostEstimateCard.tsx # Time/cost + lawsuit comparison + category bars
│   │   │   └── UpgradePrompt.tsx   # $49 CTA with features list + price anchoring
│   │   ├── checkout/
│   │   │   ├── StripeCheckoutButton.tsx  # Calls create-checkout edge function → redirect to Stripe
│   │   │   └── PayPalCheckoutButton.tsx  # PayPal SDK buttons → create + capture orders
│   │   ├── dashboard/
│   │   │   └── BadgePreview.tsx    # Embeddable compliance badge + embed code
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx       # Detects sitesafe_pending_plan → redirect to /checkout
│   │   │   ├── RegisterForm.tsx    # Auto-redirects after signup (no email confirmation)
│   │   │   └── ProtectedRoute.tsx  # Redirects to /login if not authenticated
│   │   └── ui/
│   │       ├── Button.tsx          # variant: primary/outline/ghost, size: sm/md/lg
│   │       ├── Card.tsx            # Card, CardHeader, CardContent
│   │       ├── Badge.tsx           # variant: default/critical/serious/moderate/minor/success
│   │       └── Input.tsx
│   ├── pages/
│   │   ├── LandingPage.tsx         # Assembles all landing sections
│   │   ├── ScanPage.tsx            # Main results page (score + issues + risk + cost)
│   │   ├── DashboardPage.tsx       # Scan history + plan status + payment success toast
│   │   ├── CheckoutPage.tsx        # Protected: plan summary + Stripe/PayPal payment buttons
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── SharedReportPage.tsx    # Public read-only report (no auth required)
│   ├── hooks/
│   │   ├── useScan.ts              # Core: fetch HTML → run scanner → persist to sessionStorage + DB
│   │   └── useSubscription.ts      # Returns { plan, isPaid, isLoading }
│   ├── contexts/
│   │   └── AuthContext.tsx          # Supabase auth provider (LAZY imports only!) + refreshProfile()
│   ├── config/
│   │   ├── plans.ts                # Plan definitions: free / fix-my-site / compliance-shield
│   │   └── constants.ts            # INDUSTRY_RISK, TOP_LAWSUIT_STATES, lawsuit data
│   └── lib/
│       ├── supabase.ts             # Conditional client: Proxy stub when env vars missing
│       └── utils.ts                # cn() (clsx+twMerge), getDomain()
├── supabase/
│   ├── schema.sql                  # DB schema (6 tables + triggers + functions, see DB Schema section)
│   └── functions/
│       ├── _shared/
│       │   ├── cors.ts             # CORS headers helper for all edge functions
│       │   └── paypal.ts           # getPayPalAccessToken() helper
│       ├── scan/index.ts           # Fetch URL HTML (CORS proxy)
│       ├── create-checkout/index.ts # Stripe Checkout Session (payment or subscription mode)
│       ├── stripe-webhook/index.ts  # Handles checkout.session.completed, invoice.paid, customer.subscription.deleted
│       ├── create-portal/index.ts   # Stripe Customer Portal link
│       ├── paypal-create-order/index.ts  # Creates PayPal order with server-side price validation
│       └── paypal-capture-order/index.ts # Captures PayPal payment → updates profile + purchases
├── vite.config.ts                  # Custom CORS proxy plugin (HTTP+HTTPS, follows redirects, rejectUnauthorized: false)
├── netlify.toml                    # Build config (npm run build → dist/) + SPA redirect (/* → /index.html)
├── tsconfig.json                   # Base config: ES2020, bundler resolution, @/* path alias
├── tsconfig.app.json               # Extends tsconfig.json, includes only src/
├── package.json                    # name: "sitesafe", type: module
└── .env.local                      # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
                                    # VITE_STRIPE_PUBLISHABLE_KEY, VITE_PAYPAL_CLIENT_ID
```

## Routes
| Path | Page | Auth | Layout |
|---|---|---|---|
| `/` | LandingPage | Public | Header + Footer |
| `/scan` | ScanPage | Public | Header + Footer |
| `/scan?url=example.com` | ScanPage (auto-starts scan) | Public | Header + Footer |
| `/login` | LoginPage | Public | Standalone |
| `/register` | RegisterPage | Public | Standalone |
| `/register?plan=fix-my-site` | RegisterPage (pre-selected plan) | Public | Standalone |
| `/dashboard` | DashboardPage | Protected | Standalone |
| `/checkout` | CheckoutPage | Protected | Standalone |
| `/checkout?plan=fix-my-site` | CheckoutPage (plan from URL) | Protected | Standalone |
| `/shared/:token` | SharedReportPage | Public | Standalone |
| `*` | Redirect to `/` | — | — |

Note: `BadgePreviewPage` does NOT have a route yet. `BadgePreview.tsx` exists as a component in `components/dashboard/` but is not integrated into any page. This is a pending task.

## Payment Flow
```
CTA "Fix My Site" → /register?plan=fix-my-site (or /checkout if logged in)
→ Register → auto-login (no email confirmation)
→ /checkout?plan=fix-my-site
→ Choose Stripe or PayPal
→ Pay → webhook/capture updates profiles.plan
→ /dashboard?payment=success → toast + everything unlocked
```

LoginForm detects `sitesafe_pending_plan` in sessionStorage → redirects to `/checkout?plan=X` after login.
All upgrade CTAs (UpgradePrompt, IssueCard, CostEstimateCard, PricingSection) use smart redirects: logged in → `/checkout`, not logged in → `/register`.

## Critical Technical Decisions & Gotchas

### 1. Supabase MUST be lazily imported
The app works WITHOUT Supabase configured (for dev/testing). If `createClient()` is called with empty/placeholder URL, it throws and causes a blank page.

**Rule:** NEVER statically import from `@/lib/supabase` at the top of any file. Always use:
```ts
const { supabase } = await import('@/lib/supabase')
```

`src/lib/supabase.ts` uses a Proxy stub when env vars are missing. `AuthContext.tsx` checks `import.meta.env` directly and only calls supabase functions via dynamic import.

### 2. Scanner runs client-side
Edge Function only fetches HTML to avoid CORS. All parsing/analysis happens in the browser via DOMParser. This avoids CPU limits on Supabase free tier.

### 3. CORS proxy in dev mode
`vite.config.ts` has a custom plugin that proxies `/api/fetch-page?url=...`:
- Handles both HTTP and HTTPS URLs
- Follows redirects automatically (3xx → recursive fetch)
- Custom User-Agent: `SiteSafe Accessibility Scanner/1.0`
- `rejectUnauthorized: false` for SSL flexibility
- Returns JSON: `{ html, finalUrl }`

### 4. sessionStorage for anonymous scans
Key: `sitesafe_scan_result`. Stores the full ScanResult JSON. No login required for free scan. If user logs in later, result can be associated with their account.

### 5. Free vs Paid gating
- Free: score visible, risk visible, ALL issues visible (title + severity + description), 1st issue has free code fix, rest blurred with Lock overlay + CTA button when expanded
- Paid: everything visible including all code fixes + shareable reports + compliance badge
- `useSubscription()` hook returns `{ plan, isPaid, isLoading }`
- `IssueCard` receives `isPaid` + optional `isFreeFix` props — controls blur on code fix section
- `IssuesList` passes `isFreeFix={true}` to first issue for free users, shows UpgradePrompt at bottom

### 6. DB schema uses `purchases` table (NOT `subscriptions`)
Both one-time and subscription payments recorded in `purchases` table. `stripe-webhook` handles `checkout.session.completed` (one-time + first subscription payment), `invoice.paid` (subscription renewals), and `customer.subscription.deleted` (downgrade to free).

### 7. Path alias `@/*`
`tsconfig.json` defines `@/*` → `./src/*`. All imports use `@/components/...`, `@/lib/...`, etc. Vite resolves it via `resolve.alias` in `vite.config.ts`.

### 8. Email confirmation disabled
Supabase Auth has email confirmation disabled. Users are logged in immediately after signup. RegisterForm auto-redirects to `/checkout` or `/dashboard` after successful signup — no "check your email" screen.

### 9. Stripe checkout supports both modes
`create-checkout` edge function detects plan ID: `compliance-shield` → `mode: 'subscription'`, everything else → `mode: 'payment'`. Subscription data includes metadata for webhook processing.

### 10. PayPal as alternative payment
PayPalCheckoutButton only renders when `VITE_PAYPAL_CLIENT_ID` is configured. PayPal orders use server-side price validation (PLAN_PRICES map). After capture, `paypal-capture-order` updates profiles.plan and inserts into purchases (with `paypal_` prefix on payment ID).

## DB Schema (supabase/schema.sql)

### Tables (6)
| Table | Purpose | RLS |
|---|---|---|
| `profiles` | Extends auth.users (email, plan, stripe_customer_id) | Yes — own profile only |
| `scans` | Scan results (url, domain, score, issue counts, results JSONB) | Yes — own scans only |
| `purchases` | Payments — one-time + subscriptions (plan, stripe_payment_id, amount) | Yes — own purchases only |
| `shared_reports` | Shareable report links (token, scan_id, views, is_active) | Yes — own + anyone can view active |
| `badges` | Compliance badges (domain, score, badge_token, is_active) | Yes — own + anyone can verify active |
| `scan_usage` | Rate limiting (user_id/ip_address, scan_count, period_start) | Yes — own usage only |

### Triggers
- `on_auth_user_created` → `handle_new_user()` — auto-creates profile row on signup
- `update_profiles_updated_at` → `update_updated_at()` — auto-updates `updated_at` on profile changes

### DB Functions
- `handle_new_user()` — inserts into profiles on auth.users insert (security definer)
- `get_shared_report(token)` — returns scan data by share token, increments view count (security definer)
- `verify_badge(badge_token)` — returns badge data for public verification (security definer)
- `update_updated_at()` — generic trigger function for updated_at columns

### Indexes
- `idx_scans_user_id` on `scans(user_id)`
- `idx_scans_domain` on `scans(domain)`

## Implementation Status

### Done
- Project setup (Vite + React 19 + TS + Tailwind v4)
- Scanner engine (11 WCAG checks + scoring + risk calculator + cost estimator)
- Landing page (Hero, Stats, HowItWorks, Fear, Pricing cards + competitor comparison, TrustSignals, Footer)
- Scan results page (ScoreGauge, RiskBadge, RiskBreakdown, IssueCard, IssuesList, PriorityPlan, CostEstimateCard, UpgradePrompt)
- Auth pages (Login, Register) + AuthContext with refreshProfile()
- Dashboard page (scan history + payment success toast)
- Checkout page (plan summary + Stripe + PayPal buttons)
- Shared report page + Badge preview component
- DB schema SQL applied to Supabase
- Supabase Edge Functions deployed: scan, create-checkout, stripe-webhook, paypal-create-order, paypal-capture-order, create-portal
- Stripe configured: publishable key, secret key, webhook (3 events), 2 products with price IDs
- Supabase secrets set: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
- netlify.toml ready
- Pricing restructured: Free ($0) / Fix My Site ($49 one-time) / Compliance Shield ($199/year)
- Smart redirects: logged in → /checkout, not logged in → /register
- 22+ bug fixes applied (see Bugs Fixed section below)

### Pending (to launch)
- Debug signup/signin spinner issue (API works, frontend hangs)
- PayPal credentials (VITE_PAYPAL_CLIENT_ID, PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_API_URL as Supabase secrets)
- Deploy to Netlify (connect repo, configure env vars)
- Buy custom domain
- End-to-end testing of full payment flow (Stripe + PayPal)

### Future (post-launch)
- Monthly automated re-scans (cron job for Compliance Shield)
- Email alerts when compliance score drops
- Compliance certificate PDF generation
- Programmatic SEO pages (industry × state landing pages)
- Multi-page scanning (crawl entire site)
- WordPress/Shopify plugins
- BadgePreview page route (component exists at `components/dashboard/BadgePreview.tsx` but no route yet)

## Bugs Fixed

### Original bugs (sessions 1-3)
1. **Blank page** — AuthContext statically imported supabase, crashing when not configured. Fixed with lazy imports.
2. **AuthContext state not updating** — signIn didn't call setSession/setUser. Fixed.
3. **Dashboard wrong URL** — navigated to `/?url=` instead of `/scan?url=`. Fixed.
4. **Dashboard wrong sessionStorage key** — read `sitesafe_scans` instead of `sitesafe_scan_result`. Fixed.
5. **FearSection dead link** — linked to `/scan` without URL. Changed to `#hero` scroll.
6. **ScanPage no URL** — showed error instead of input form. Fixed with inline form.
7. **RegisterForm "/mo" text** — still said monthly after plan restructure. Fixed to "one-time".
8. **CORS proxy SSL error** — added `rejectUnauthorized: false` to Node https.get.

### Bug fix round 2 — Critical (22 fixes total)
9. **color-contrast wrong luminance** — Had duplicated parseColor/getRelativeLuminance instead of importing from color-utils.ts. Now uses correct sRGBtoLinear() and suggestCompliantColor() (iterates 255 steps instead of returning only black/white).
10. **Input forwardRef broken** — ref pointed to wrapper `<div>`, not `<input>`. Changed wrapper to `<>` fragment.
11. **Stripe webhook infinite retries** — Returned HTTP 500 on error; Stripe retried forever. Now returns 200 on internal errors.
12. **Stripe webhook missing secret validation** — No check if STRIPE_WEBHOOK_SECRET env var exists. Added early validation + error logging.
13. **Stripe webhook unvalidated plan_id** — Any string accepted as plan. Now validates against valid plan IDs.
14. **Scan edge function no timeout** — fetch() could hang forever on slow sites. Added 10s AbortController timeout, returns 504.

### Bug fix round 2 — High
15. **LoginForm ignores redirect** — ProtectedRoute saved `state.from` but LoginForm always went to `/dashboard`. Now reads `location.state?.from` + checks for pending plan.
16. **RegisterForm loses plan** — Selected plan lost after email confirmation. Now auto-redirects to /checkout after signup (no email confirmation needed).
17. **HeroSection literal `&mdash;`** — HTML entity rendered as text in JSX. Replaced with actual `—` character.
18. **UpgradePrompt double navigation** — `<Button>` inside `<a>` caused nested interactive elements. Replaced with `onClick` + `useNavigate`.
19. **Dashboard scanning state stuck** — `setScanning(true)` never reset after navigate. Removed unnecessary scanning state entirely.
20. **Risk calculator ignored moderate/minor** — Only counted critical×3 + serious×2. Added moderate×0.5 + minor×0.1.
21. **HeroSection no URL validation** — Accepted `javascript:`, `file:///`, etc. Added `new URL()` validation, only allows http/https.
22. **form-labels skipped radio/checkbox** — Filter excluded radio and checkbox which DO need labels. Fixed filter list.
23. **PricingSection table wrong** — "Plain English explanations" showed false for free (actually visible for 3 issues). "Cost & time estimate" showed false for free (actually visible). Updated to match real behavior.

### Bug fix round 2 — Medium
24. **AuthContext swallowed init errors** — `init().then()` had no `.catch()`. Added error logging to prevent silent failures.
25. **useSubscription flash of free** — Paid users saw blurred content during auth loading (defaulted to 'free'). Now returns `planId: null` while loading.
26. **link-text accepted empty aria-label** — `aria-label="  "` passed validation. Added `.trim()` check.
27. **auto-play-media wrong severity** — Missing controls was 'moderate' but should be 'serious' (user can't pause).
28. **CORS preflight missing Content-Type** — OPTIONS responses in scan and create-portal lacked Content-Type header. Added.

### Session 4 fixes
29. **RegisterForm showed "Check your email"** — Email confirmation disabled but form still showed confirmation screen. Now auto-redirects to /checkout or /dashboard.

## Design System
- **Font:** Inter (system-ui fallback), set in `index.css` body rule
- **SEO:** Title "SiteSafe — ADA Website Accessibility Checker", meta description about scanning + $10K lawsuits
- **Colors:** Tailwind v4 `@theme` custom palette — primary (blue), danger (red), warning (amber), success (green)
- **Severity colors:** Critical=danger-500 (red), Serious=orange-500, Moderate=warning-500 (amber), Minor=blue-400
- **Score colors:** >=90 green, >=70 lime, >=50 amber, >=30 orange, <30 red (from `getScoreColor()`)
- **Risk levels:** extreme (red+pulse), high (orange), medium (amber), low (green)
- **Cards:** white bg, rounded-xl, border-gray-200, shadow-sm
- **Pricing cards:** 3 side-by-side cards (not comparison table), middle card highlighted with ring-2 ring-primary-600
- **Issue cards:** 4px left border colored by severity, subtle severity background, severity icon
- **Score gauge:** 160px SVG circle with glow shadow, extrabold score, shield icon label

## The Problem We Solve
- **ADA:** US federal law requiring websites to be accessible to people with disabilities
- **WCAG 2.1 AA:** Technical standard defining "accessible" (contrast ratios, alt text, etc.)
- **April 26, 2026 deadline:** DOJ rule makes WCAG 2.1 AA mandatory. Now measurable and enforceable
- **98% of websites DON'T comply** — massive market
- **4,605 lawsuits in 2023**, 67% targeted small businesses
- **Typical settlement:** $5,000-$20,000. Defense costs: $50,000-$100,000+
- **Our pitch:** Pay $49 once or risk a $10,000+ lawsuit

## Target Market
- Small businesses in USA: restaurants, dental offices, ecommerce, hotels, local services
- NOT tech-savvy — app explains everything in simple language, no jargon
- Scared of lawsuits but don't know how to fix their websites
- 100% self-service, no phone calls

## Competitive Landscape
| Competitor | Price | Why we win |
|---|---|---|
| accessiBe | $490+/year (overlay) | Fined $1M by FTC. Overlay doesn't fix code |
| UserWay | $588+/year (overlay) | Same overlay problem, doesn't fix code |
| AudioEye | Custom pricing | Targets mid-market, not small businesses |
| WAVE | Free | 1 page only, too technical for non-devs |
| Lighthouse | Free | For developers only |
| **Us** | **$49 once / $199/yr** | **Real code fixes, not overlays. 60% cheaper than competitors** |

## Our Differentiators
1. **Real code fixes** — not overlays (accessiBe fined $1M by FTC for fake fixes)
2. **One-time option exists** — competitors all require monthly subscriptions
3. **Plain English** — "Your logo has no description for blind users" not "img missing alt"
4. **Risk score** by industry + US state (lawsuit data)
5. **75% cheaper** than cheapest competitor for ongoing monitoring
6. **Copy-paste code fixes** — for every issue found
7. **Prioritized action plan** with score impact projections
8. **Shareable report URLs** + compliance badge

## Key Files Quick Reference
| File | Purpose |
|---|---|
| `src/App.tsx` | All route definitions (including /checkout) |
| `src/pages/CheckoutPage.tsx` | Payment page: plan summary + Stripe/PayPal buttons |
| `src/components/checkout/StripeCheckoutButton.tsx` | Calls create-checkout → redirects to Stripe |
| `src/components/checkout/PayPalCheckoutButton.tsx` | PayPal SDK buttons → create + capture |
| `src/config/plans.ts` | 3 plan definitions with real Stripe price IDs |
| `src/contexts/AuthContext.tsx` | Auth provider + refreshProfile() — MUST use lazy supabase imports! |
| `src/hooks/useSubscription.ts` | Returns { plan, isPaid, isLoading } for gating |
| `src/pages/ScanPage.tsx` | Main results page (score hero + issues + risk + cost) |
| `src/pages/DashboardPage.tsx` | Scan history + payment success toast |
| `src/components/landing/PricingSection.tsx` | 3 pricing cards + competitor comparison |
| `src/scanner/engine.ts` | Runs all 11 checks, aggregates into ScanResult |
| `supabase/functions/create-checkout/index.ts` | Stripe checkout (payment or subscription mode) |
| `supabase/functions/stripe-webhook/index.ts` | Handles 3 Stripe events |
| `supabase/functions/paypal-create-order/index.ts` | Creates PayPal order |
| `supabase/functions/paypal-capture-order/index.ts` | Captures PayPal payment → updates DB |
| `supabase/functions/_shared/paypal.ts` | PayPal access token helper |

## App Architecture
- **AuthContext exports `refreshProfile()`** — used by PayPalCheckoutButton after successful capture
- **LoginForm detects `sitesafe_pending_plan`** in sessionStorage → redirects to `/checkout?plan=X`
- **RegisterForm auto-redirects** after signup (no email confirmation screen)
- **CheckoutPage reads plan from** URL query param or sessionStorage
- **All upgrade CTAs use smart redirects** — logged in → `/checkout`, not logged in → `/register`
- **useSubscription returns `planId: null`** while auth is loading (prevents flash of free content for paid users)
- **Stripe webhook handles 3 events:** checkout.session.completed, invoice.paid, customer.subscription.deleted
- **PayPal capture verifies amount + user match** server-side before updating plan

## WCAG Checks Implemented (11)
1. `alt-text` — Images without alt text
2. `color-contrast` — Text/background contrast < 4.5:1 (3:1 for large text)
3. `form-labels` — Inputs without associated labels
4. `heading-hierarchy` — Skipped heading levels
5. `link-text` — Non-descriptive links ("click here", "read more")
6. `lang-attribute` — Missing lang on `<html>`
7. `empty-interactive` — Empty buttons/links
8. `duplicate-ids` — Duplicate ID attributes
9. `table-headers` — Tables without `<th>` or scope
10. `aria-roles` — Invalid ARIA roles/attributes
11. `auto-play-media` — Autoplay on video/audio

Each check returns: plain English title + description, severity, WCAG criteria, code before/after, fix description, estimated fix time in minutes.

## Provider Stack (main.tsx)
```
BrowserRouter
  └── QueryClientProvider (TanStack Query, staleTime: 5min, retry: 1)
      └── AuthProvider (Supabase auth, lazy imports)
          └── App (routes)
          └── Toaster (react-hot-toast, top-right)
```

## ADA Lawsuit Data (for marketing copy)
- 4,605 lawsuits in 2023, 4,000+ in 2024, 2,014 in H1 2025 (37% increase)
- Typical settlement: $5,000-$20,000. Defense costs: $50,000-$100,000+
- Serial filers: Brian Whitaker (1,700+), Orlando Garcia (800+)
- Top states: New York, Florida, California, Illinois
- 67% of lawsuits target small businesses under $25M revenue
- 98% of websites DON'T comply with WCAG 2.1 AA
- accessiBe fined $1M by FTC in Feb 2025 for false advertising
- 22.6% of businesses sued in 2025 HAD accessibility overlays installed

## Target Customer Profiles
1. **Small ecommerce** — Shopify/WooCommerce, $50K-$500K revenue, no developer on staff
2. **Local service business** — dentist, restaurant, salon, hotel, law firm. Website built with Wix/Squarespace/WordPress
3. **Marketing agency** — manages 10-50 client websites, needs multi-site scanning, uses reports to upsell fixes
4. **Government entity** — must comply by April 2026 deadline, needs documentation for audits

## Distribution Strategy ($0 budget)
- **Programmatic SEO:** "ADA compliance checker for [industry]", "Is my website ADA compliant [state]" — 50 states × 10+ industries = 500+ pages
- **Product Hunt:** Free launch, one-time traffic spike
- **Communities:** Business owner groups (value sharing, not spam)
- **Building in public:** Twitter/X

## Unit Economics
- **CAC:** ~$0 (organic SEO)
- **Average order:** ~$100 (blended $49 one-time + $199/year)
- **Gross margin:** ~95% (hosting free, no API costs)
- **LTV for Shield users:** $199/year × 2-3 year avg retention = $400-$600

## SEO Keywords (High Intent)
- "ADA website compliance checker", "Is my website ADA compliant"
- "WCAG 2.1 compliance test", "Website accessibility audit free"
- "ADA website lawsuit prevention", "ADA compliance for small business"
- "[industry] website accessibility", "[state] ADA website requirements"
- "accessiBe alternative", "WCAG checker free"

## Risks
| Risk | Severity | Mitigation |
|---|---|---|
| Big company builds same tool | Medium | SEO moat + niche focus on small businesses |
| Free tools become better | Medium | We differentiate on simplicity + code fixes + risk scoring |
| Legal liability (false compliance) | High | Clear disclaimers everywhere |
| User scans malicious URLs | Medium | URL validation + sandboxed fetching |

## Legal Disclaimers (IMPORTANT)
- Tool does NOT guarantee ADA compliance or legal protection
- Results are informational, not legal advice
- Users should consult accessibility specialist or attorney
- Disclaimers visible on landing page, scan results, and terms of service

## Infrastructure

### Supabase
- **Project ref:** `mvzolbabbkedmlhqhiwi`
- **Project URL:** `https://mvzolbabbkedmlhqhiwi.supabase.co`
- **Data API:** Enabled (RESTful API for public schema)
- **Automatic RLS:** Enabled
- **Schema:** Applied and verified (6 tables + triggers + functions all live)
- **Edge Functions:** Deployed (scan, create-checkout, stripe-webhook, create-portal, paypal-create-order, paypal-capture-order)
- **Secrets set:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Secrets pending:** `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_API_URL`
- **Auth:** Email confirmation DISABLED, CAPTCHA/bot protection DISABLED

### Stripe
- **Account:** Created (test mode)
- **Key format:** New format (`sb_publishable_*` / `sb_secret_*`)
- **Products:** Created
  - Fix My Site: $49 one-time, price ID `price_1T7MPaFfYL1pGw0ot4eQO3Bp`
  - Compliance Shield: $199/year recurring, price ID `price_1T7MiPFfYL1pGw0ohwz2MHvV`
- **Webhook:** Configured at `https://mvzolbabbkedmlhqhiwi.supabase.co/functions/v1/stripe-webhook`
  - Events: `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`
  - Signing secret: set in Supabase secrets

### PayPal
- **Status:** Code implemented, credentials pending
- **Needs:** Client ID + Secret from PayPal Developer Dashboard

### Netlify
- **Status:** NOT yet deployed
- **Config:** `netlify.toml` ready in repo
- **Env vars needed:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_PAYPAL_CLIENT_ID`

## User Preferences
- Communication: **Spanish**
- Code/implementation: **English**
- Use Haiku model for simple tasks, Opus for complex decisions
- Prioritize cost efficiency
- $0 budget — everything uses free tiers
- No phone calls, everything self-service
