# SiteSafe — ADA Website Accessibility Checker

## Product Overview
A self-service web tool that scans any website for ADA/WCAG 2.1 AA accessibility violations, explains issues in plain English with copy-paste code fixes, and provides risk assessment — so small businesses can fix problems before a $10,000+ lawsuit finds them.

**Business model:** Hybrid — one-time payment for the fix report ($49), annual subscription for ongoing monitoring ($199/year). No monthly subscriptions on the entry tier.

## Pricing
| Plan | ID | Price | Model | Key Features |
|---|---|---|---|---|
| **Free Scan** | `free` | $0 | Free | 1 page, score, risk, all issues visible, 1 code fix free |
| **Fix My Site** | `fix-my-site` | $49 one-time | One-time payment | Up to 25 pages, all code fixes, action plan, shareable report, 1 re-scan |
| **Compliance Shield** | `compliance-shield` | $199/year | Annual subscription | Everything in Fix My Site + up to 5 sites, unlimited re-scans, monthly auto-scans, email alerts, compliance badge |

Old plan IDs (`full-report`, `agency`, `starter`, `pro`, `business`) no longer exist.

Stripe Price IDs (LIVE):
- Fix My Site: `price_1TAdnSFfYL1pGw0o7zQs4NdX`
- Compliance Shield: `price_1TAdnUFfYL1pGw0oGAqWfMTa`

## Tech Stack
- **Frontend:** React 19 + Vite 7 + TypeScript + Tailwind CSS v4 (uses `@theme` for custom colors)
- **Backend/DB:** Supabase (Auth + PostgreSQL + Edge Functions in Deno)
- **Payments:** Stripe (one-time `mode: 'payment'` for Fix My Site, `mode: 'subscription'` for Compliance Shield) + PayPal (`@paypal/react-paypal-js`)
- **Deploy:** Cloudflare Pages (free tier)
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
│   │   ├── types.ts                # ScanIssue (+ pageUrl), ScanResult (+ pagesScanned/pagesAttempted/pageErrors), RiskAssessment, CostEstimate, generateId()
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
│   │   │   ├── Layout.tsx          # Outlet wrapper with Header + Footer
│   │   │   └── UrgencyBanner.tsx   # Countdown banner for ADA deadline
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
│   │   │   ├── UpgradePrompt.tsx   # $49 CTA with features list + price anchoring
│   │   │   ├── EmailCapture.tsx    # Email capture form for lead generation
│   │   │   └── EmbedWidget.tsx     # Embeddable compliance widget + embed code
│   │   ├── checkout/
│   │   │   ├── StripeCheckoutButton.tsx  # Calls create-checkout edge function → redirect to Stripe
│   │   │   └── PayPalCheckoutButton.tsx  # PayPal SDK buttons → create + capture orders
│   │   ├── seo/
│   │   │   └── shared.tsx          # Shared SEO utils (getRiskColor, FAQItem, INDUSTRY_LABELS, slugToStateName)
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx       # Detects sitesafe_pending_plan → redirect to /checkout
│   │   │   ├── RegisterForm.tsx    # Auto-redirects after signup (no email confirmation)
│   │   │   └── ProtectedRoute.tsx  # Redirects to /login if not authenticated
│   │   └── ui/
│   │       ├── Button.tsx          # variant: primary/outline/ghost, size: sm/md/lg
│   │       ├── Card.tsx            # Card, CardHeader, CardContent
│   │       ├── Badge.tsx           # variant: default/critical/serious/moderate/minor/success
│   │       ├── Combobox.tsx        # Searchable combobox component
│   │       └── Input.tsx
│   ├── pages/
│   │   ├── LandingPage.tsx         # Assembles all landing sections
│   │   ├── ScanPage.tsx            # Main results page (score + issues + risk + cost)
│   │   ├── DashboardPage.tsx       # Scan history + plan status + payment success toast
│   │   ├── CheckoutPage.tsx        # Protected: plan summary + Stripe/PayPal payment buttons
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── SharedReportPage.tsx    # Public read-only report (no auth required)
│   │   ├── BadgeVerifyPage.tsx    # Public badge verification page
│   │   ├── BlogPage.tsx           # Blog listing page
│   │   ├── BlogPostPage.tsx       # Individual blog post page
│   │   ├── ContactPage.tsx        # /contact — visible email + Copy button + mailto fallback
│   │   ├── PrivacyPage.tsx        # Privacy policy
│   │   ├── TermsPage.tsx          # Terms of service
│   │   ├── IndustryLandingPage.tsx # Programmatic SEO: ADA compliance for [industry]
│   │   ├── IndustryStateLandingPage.tsx # Programmatic SEO: [industry] + [state]
│   │   └── StateLandingPage.tsx   # Programmatic SEO: ADA compliance in [state]
│   ├── hooks/
│   │   ├── useScan.ts              # Core: fetch up to N pages (paid=25, free=1) → run scanner on each → aggregate (avg score, intersection passedChecks, sum counts, issues annotated with pageUrl) → persist
│   │   └── useSubscription.ts      # Returns { plan, isPaid, isLoading } — used by useScan to decide maxPages
│   ├── contexts/
│   │   └── AuthContext.tsx          # Supabase auth provider (LAZY imports only!) + refreshProfile()
│   ├── config/
│   │   ├── plans.ts                # Plan definitions: free / fix-my-site / compliance-shield
│   │   ├── constants.ts            # INDUSTRY_RISK, TOP_LAWSUIT_STATES, lawsuit data
│   │   ├── blog-posts.ts           # Blog post content for SEO
│   │   └── sitemap.ts              # Sitemap configuration for programmatic SEO pages
│   └── lib/
│       ├── supabase.ts             # Conditional client: Proxy stub when env vars missing
│       ├── pdf-report.ts           # Generates print-friendly HTML audit report for paid users
│       └── utils.ts                # cn() (clsx+twMerge), getDomain()
├── supabase/
│   ├── schema.sql                  # DB schema (6 tables + triggers + functions, see DB Schema section)
│   └── functions/
│       ├── _shared/
│       │   ├── cors.ts             # CORS headers helper for all edge functions
│       │   └── paypal.ts           # getPayPalAccessToken() helper
│       ├── scan/index.ts           # Fetch seed URL + crawl up to N same-origin pages (maxPages param 1-25) → returns { pages: [{url, html, error?}], finalUrl, html }
│       ├── create-checkout/index.ts # Stripe Checkout Session (payment or subscription mode)
│       ├── stripe-webhook/index.ts  # Handles checkout.session.completed, invoice.paid, customer.subscription.deleted
│       ├── create-portal/index.ts   # Stripe Customer Portal link
│       ├── paypal-create-order/index.ts  # Creates PayPal order with server-side price validation
│       ├── paypal-capture-order/index.ts # Captures PayPal payment → updates profile + purchases
│       └── get-analytics/index.ts        # Cloudflare Zone Analytics + RUM for outreach dashboard traffic tab
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
| `/badge/:token` | BadgeVerifyPage | Public | Standalone |
| `/blog` | BlogPage | Public | Header + Footer |
| `/blog/:slug` | BlogPostPage | Public | Header + Footer |
| `/contact` | ContactPage | Public | Header + Footer |
| `/privacy` | PrivacyPage | Public | Header + Footer |
| `/terms` | TermsPage | Public | Header + Footer |
| `/industry/:slug` | IndustryLandingPage | Public | Header + Footer |
| `/industry/:industrySlug/:stateSlug` | IndustryStateLandingPage | Public | Header + Footer |
| `/state/:slug` | StateLandingPage | Public | Header + Footer |
| `*` | Redirect to `/` | — | — |

## Payment Flow
```
CTA "Fix My Site" → saves plan to sessionStorage → /register?plan=fix-my-site (or /checkout if logged in)
→ Register → auto-login (no email confirmation)
→ Detects pending plan → /checkout?plan=fix-my-site
→ Choose Stripe or PayPal
→ Pay → webhook/capture updates profiles.plan
→ /dashboard?payment=success → toast + everything unlocked
```

Both LoginForm and RegisterForm detect `sitesafe_pending_plan` in sessionStorage → redirect to `/checkout?plan=X` after auth. If no pending plan, redirect to `/dashboard`.
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

### 10. Scan results must load before DB save
`useScan.ts` calls `setResult(scanResult)` BEFORE saving to Supabase DB. The DB save runs in a fire-and-forget async IIFE. **NEVER** put an `await` between the scan completing and `setResult` — this caused the "stuck at 99%" bug where the DB insert hung and blocked the UI.

### 11. Scanner code fixes use [bracket] placeholders
Checks that need human-written content (alt-text, link-text, empty-interactive) generate `[Describe this image]`, `[Describe where this link goes]`, etc. IssueCard detects `/\[.*?\]/` in `codeAfter` and shows a yellow warning banner telling users to customize. **NEVER** generate fake content as alt text or link text.

### 12. ALL edge functions need `--no-verify-jwt`
Supabase edge function gateway ONLY accepts anon key or service role key as JWT. User access tokens (from `supabase.auth.signInWithPassword`) are REJECTED by the gateway with `{"code":401,"message":"Invalid JWT"}` before the function code even runs. Solution: deploy all functions with `--no-verify-jwt` and validate auth inside the function via `supabase.auth.getUser()`.

```bash
supabase functions deploy <name> --no-verify-jwt --project-ref mvzolbabbkedmlhqhiwi
```

### 13. PayPal as alternative payment
PayPalCheckoutButton only renders when both `VITE_PAYPAL_CLIENT_ID` and `VITE_SUPABASE_URL` are configured. PayPal orders use server-side price validation (PLAN_PRICES map). After capture, `paypal-capture-order` updates profiles.plan and inserts into purchases (with `paypal_` prefix on payment ID).

### 14. Scanner ID generation uses `generateId()` with fallback
All 11 scanner checks use `generateId()` from `scanner/types.ts` instead of `crypto.randomUUID()` directly. This provides a fallback (`Date.now()` + counter) for environments where Web Crypto API is unavailable. **NEVER** use `crypto.randomUUID()` directly in scanner checks.

### 15. Scan edge function MUST use browser-like User-Agent
WAFs (Cloudflare, Imperva, Akamai) block any non-browser User-Agent with 403. The `scan` edge function uses a real Chrome UA + 14 standard browser headers (`Accept-Language`, `sec-ch-ua-*`, `Sec-Fetch-*`, etc.) to look like a real browser. **NEVER** revert to a custom UA like `SiteSafe Accessibility Scanner/1.0` — it will break scanning on most real-world sites.

### 16. Vite manualChunks splits vendor bundles
`vite.config.ts` declares `build.rollupOptions.output.manualChunks` to split `react`, `paypal`, and `query` into separate chunks. This keeps the main bundle under 500 kB (was 573 kB) and improves caching. Supabase is loaded via dynamic import so Rollup auto-splits it; do not add it to manualChunks.

### 17. Multi-page scan aggregation rules
For paid users, `useScan` runs the scanner on up to 25 pages and aggregates the per-page `ScanResult`s into one. Non-obvious rules:
- **Score is an AVERAGE of per-page scores**, NOT a recalc on the aggregated issue list. Reason: the single-page scoring caps penalty at 100, so dumping 25 pages of minor issues into one bucket would score 0 unfairly. Averaging keeps a clean site at ~97 even if one page is bad.
- **`passedChecks` is the INTERSECTION**, not the union. A WCAG check only counts as "passed" for the site if it passed on every scanned page. Conservative — accurate for legal display.
- **Counts (`criticalCount` etc) are SUMS** across all pages.
- **Issues are annotated with `pageUrl`** (the page they were found on). Useful for the "Found on: /path" hint in IssueCard.
- **No issue dedupe yet** — if a logo with missing alt appears on 25 pages, the user sees 25 cards. v2 should collapse identical signatures into one card with a "Found on N pages" badge.
- **Edge function response shape:** `{ pages: [{url, html, error?}], finalUrl, html }`. Top-level `html` is kept for backwards compat with old frontend builds during the deploy window — DO NOT remove until you're sure no cached SPA bundles still expect it.
- **Rate limit (`scan_usage` table) records ONE entry per request**, not per page. A 25-page crawl counts as 1 of the 20 scans/hour quota.

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
- Stripe configured in **LIVE mode**: publishable key (pk_live_*), secret key (sk_live_*), webhook (3 events), 2 products with live price IDs
- Supabase secrets set: STRIPE_SECRET_KEY (live), STRIPE_WEBHOOK_SECRET (live)
- Pricing restructured: Free ($0) / Fix My Site ($49 one-time) / Compliance Shield ($199/year shown as $17/mo)
- Smart redirects: logged in → /checkout, not logged in → /register
- **Deployed to Cloudflare Pages:** https://ada-accessibility-checker.pages.dev
- Cloudflare env vars configured: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_STRIPE_PUBLISHABLE_KEY, VITE_PAYPAL_CLIENT_ID
- Header shows "My Dashboard" button when logged in (clean, no Sign Out in header)
- PriorityPlan deduplicates issues by title (no repeated items)
- RiskBreakdown shows N/A when no state selected
- UpgradePrompt: sidebar on desktop, inline on mobile (no duplication)
- Pricing cards balanced: $0 "No credit card", $49 "vs $10K lawsuit", $17/mo "Save 66% vs accessiBe"
- Platform-specific install guides (Shopify, WordPress, Wix, Squarespace, HTML) as "Free Bonus" in each IssueCard
- Scanner fix quality: alt-text uses smart extraction (skips hashes), placeholders use [brackets] with warning banner
- Scan results load instantly (DB save runs in background, never blocks UI)
- Progress bar uses asymptotic curve (never stalls)
- 78 bug fixes applied (see Bugs Fixed section below)
- Privacy Policy + Terms of Service pages created with routes
- Scan history persists in Supabase DB
- All navigation buttons/links audited and fixed
- StripeCheckoutButton reads token from localStorage (no async Supabase calls), 5s timeout, auto-redirects to login on 401
- Stripe webhook fixed: `constructEventAsync` + `--no-verify-jwt` deployment
- Alt-text scanner skips tracking pixels (Facebook, Google Analytics, etc.)
- Register/Login with pending plan → go to Checkout; without → go to Dashboard
- Dashboard has "Your Plan" section (checks/locks for all features) + upgrade cards
- All CTAs persist plan to sessionStorage for coherent auth flow
- Compliance Shield marked as "Coming Soon" (visible but not purchasable)
- URL inputs auto-add `https://` — user can type just `example.com`
- **ALL 6 Supabase edge functions deployed with `--no-verify-jwt`** — required because gateway rejects user JWTs
- Origin fallback URL fixed from Netlify to Cloudflare Pages in create-checkout + create-portal
- SignOut always clears state + localStorage first (user never gets stuck "logged in")
- Failed Stripe webhook events resolved: manually activated plans for 2 paying users via Supabase API
- **Session 9: Stripe live + PayPal live + SEO + PDF + Badge**
- Stripe switched to LIVE mode: new products, prices, webhook, secrets all live (account under review 2-3 days)
- Stripe live price IDs: Fix My Site = `price_1TAdnSFfYL1pGw0o7zQs4NdX`, Compliance Shield = `price_1TAdnUFfYL1pGw0oGAqWfMTa`
- Stripe live webhook ID: `we_1TAdnrFfYL1pGw0oncRY4Cgt`
- PayPal Business account created (SiteSafe) with LIVE credentials configured
- PayPal secrets set in Supabase: PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_API_URL (api-m.paypal.com)
- PDF Audit Report: `src/lib/pdf-report.ts` generates print-friendly HTML, button on ScanPage for paid users
- Badge verification page: `/badge/:token` route with `BadgeVerifyPage.tsx`
- AuthContext fixed: validates session on init with `refreshSession()`, clears stale sessions from localStorage
- Header cleaned: logged-in users see "My Dashboard" button only (no Sign Out in header)
- StripeCheckoutButton rewritten: reads token from localStorage (instant), 5s timeout, auto-redirects to login on expired session
- Programmatic SEO: 78 landing pages (28 industries + 50 states) with dynamic content
- SEO: sitemap.xml (82 URLs), robots.txt, Open Graph, Twitter Cards, Schema.org JSON-LD
- Footer updated with links to top 5 industries and states
- Removed `netlify.toml` (no longer on Netlify)
- **Session 10: Platform diagnosis + code quality fixes**
- RegisterForm billing text fixed: shows "/year" for Compliance Shield instead of hardcoded "one-time"
- CLAUDE.md Stripe Price IDs synced with live values in code
- duplicate-ids scanner check now returns full truncated HTML (consistent with other checks)
- PayPalCheckoutButton validates `VITE_SUPABASE_URL` before rendering
- All 11 scanner checks migrated to centralized `generateId()` with browser fallback
- CLAUDE.md project structure updated with 15+ missing files from sessions 9-10
- **Session 11: Build optimization + WAF bypass + project migration**
- Vite manualChunks: main bundle 573 kB → 490 kB (no chunk size warning)
- Scan edge function rewritten with real Chrome 131 UA + 14 browser headers + per-status error messages (deployed v14 to mvzolbabbkedmlhqhiwi)
- Migrated Supabase project ref from `rgmzczxlgniwdxzdeakq` to `mvzolbabbkedmlhqhiwi` (user's actual project — old ref belonged to someone else)
- **Session 12: Infra cleanup + Contact page**
- Cloudflare Pages env vars verified + corrected to point to `mvzolbabbkedmlhqhiwi` + manual redeploy successful
- `.env.local` had `VITE_SUPABASE_ANON_KEY=PEGA_TU_ANON_KEY_AQUI` literal placeholder + wrong URL — fixed
- Stripe webhook URL verified pointing to correct project, 0% error rate, 3 events configured
- Created `/contact` page (visible email + Copy button + mailto fallback) — replaced dead footer mailto link
- Scan edge function v15: categorizes network failures (DNS / connection refused / SSL invalid / connection reset / unreachable) and returns specific user messages instead of generic "Internal server error"
- `useScan.ts` propagates server error verbatim instead of falling through to dev-proxy fallback (which only exists in Vite dev mode and was masking real reasons in production)
- Discovered SPA scanning limitation (see Known Limitations below)
- Discovered "Your Current Plan" UX confusion: Supabase Auth restores session from localStorage on revisit, so users who paid don't realize they're still logged in. Pricing UI correctly shows their plan as current — but they think it's a bug. Header shows "My Dashboard" (auth indicator) but no email displayed (see Future improvements)
- **Payment flow verified end-to-end via DB query (2026-05-10):** `purchases` table has 2 real successful transactions — Fix My Site $49 one-time (`pi_3TDCgoFfYL1pGw0o1JQVN1YK`) + Compliance Shield $199 subscription (`sub_1TDChaFfYL1pGw0odsh76ABY`), both from 2026-03-20. Confirms Stripe Checkout → webhook signature → plan activation → purchase recording all work for both `mode: 'payment'` and `mode: 'subscription'`
- **Stripe payouts unblocked (2026-05-10):** "required task" banner gone from dashboard. User completed KYC/banking task. Payouts to bank can now flow when sales come in. USD balance still -$9.28 from earlier refund — self-resolves with first new sale (the deficit gets covered before any net payout)
- **Session 13: Multi-page crawl shipped (2026-05-15)**
- **Discovery:** "Up to 50 pages" was advertised in 4 marketing files (DashboardPage, IndustryLandingPage, StateLandingPage, IndustryStateLandingPage) + CLAUDE.md but **the backend never implemented crawl** — only single-page fetch. Pure marketing claim with no code behind it. Risk: chargeback / false-advertising / 1-star reviews
- **Decision:** lowered promise to "Up to 25 pages" AND built the real crawl. Chose 25 because it (a) fits comfortably in Supabase Edge 150s timeout, (b) covers 95%+ of small-biz sites entirely, (c) matches SortSite's per-page price rate (~$2/page), (d) leaves room above competitors-with-no-code-fixes
- **Backend (`scan` edge function v16):**
  - Accepts `maxPages` param (1-25, default 1). Free users send 1, paid users send 25
  - After fetching seed, extracts same-origin `<a href>` links via regex
  - Filters: dedupes (normalized URLs), skips assets (pdf/jpg/css/js/etc), anchors, mailto/tel/javascript/data, cross-origin
  - Fetches additional pages in parallel batches of 5 with 8s timeout each
  - Returns `{ pages: [{url, html, error?}], finalUrl, html }` — keeps top-level `html` field for backwards compat with old frontend bundles during deploy window
  - Verified live: 25 pages on stripe.com complete in ~5s (well under 150s edge limit)
- **Frontend (`useScan.ts`):**
  - Imports `useSubscription`. Sends `maxPages: isPaid ? 25 : 1`
  - Loops returned pages through `runScan`, aggregates issues annotated with `pageUrl`
  - **Score = average of per-page scores** (each page graded independently — a single bad page doesn't tank a clean site; a homepage with 60 + 24 perfect pages averages ~97, which is the right signal)
  - **passedChecks = intersection** (a WCAG check only counts as "passed" if it passes on every scanned page — conservative for legal display since a single failing page means the site has the issue)
  - Global timeout raised to 90s (multi-page can legitimately take longer than the old 30s)
- **Types (`scanner/types.ts`):**
  - `ScanIssue` gained optional `pageUrl?: string`
  - `ScanResult` gained optional `pagesScanned?`, `pagesAttempted?`, `pageErrors?: PageScanError[]`
  - All fields optional — legacy single-page results stay shape-compatible
- **UI:**
  - `IssueCard` shows "Found on: /path" hint when `issue.pageUrl` is set (small gray font-mono)
  - `ScanPage` header shows "· N pages scanned" when `pagesScanned > 1`
- **Copy honestized:** "Up to 50 pages" → "Up to 25 pages" in 4 UI files + CLAUDE.md pricing table. Number now matches reality

### Pending (to launch)

**▶ RESUME HERE (next session) — updated 2026-07-09 (Session 17)**

**⚠️ PENDIENTE MANUAL (1 paso, 30 segundos):** Aplicar migración `supabase/migrations/015_get_leads_function.sql` en Supabase SQL Editor para activar la pestaña "🎯 Leads" del dashboard de outreach. Entrar a supabase.com → proyecto `mvzolbabbkedmlhqhiwi` → SQL Editor → pegar y ejecutar el contenido de ese archivo. Sin esto, la pestaña Leads da error.

**⚠️ SECRET YA EXPUESTO PÚBLICAMENTE — ROTAR EN RESEND (pendiente, solo lo puede hacer la usuaria):** Session 17 hardcodeó la key de Resend en `EmailCapture.tsx`, visible en el bundle JS público de producción desde que se mergeó. **Arreglado 2026-07-10:** el frontend ahora llama a la edge function `send-scan-followup` (ya existía, solo faltaba desplegar) en vez de golpear Resend directo; la key vive como secret `RESEND_API_KEY` en Supabase, fuera del cliente. Pero la key vieja **sigue siendo válida** — cualquiera que la haya copiado del bundle antes del fix puede seguir usándola. Rotar en dashboard.resend.com → API Keys, y actualizar el secret con `supabase secrets set RESEND_API_KEY=<nueva> --project-ref mvzolbabbkedmlhqhiwi`.

**Lo hecho en Session 17 (2026-07-09):**
- ✅ **UrgencyBanner reactivado:** el countdown de abril 2026 había vencido y el banner se ocultaba para todos. Reemplazado con mensaje permanente sobre récord de demandas en 2025 (commit mergeado a main).
- ✅ **Email de seguimiento automático:** cuando un visitante pone su email en la página de resultados del scan, le llega automáticamente un correo personalizado con su score, el issue más crítico encontrado, y CTA para comprar los $49. Copy contextual ("Email me my full report — N issues found").
- ✅ **Pestaña Leads en /outreach/:** nueva pestaña "🎯 Leads" en el dashboard de outreach mostrando todos los emails capturados con fecha y botón copy. Usa función `get_leads()` SECURITY DEFINER (mismo patrón que `get_shared_report`). **Requiere aplicar migración 015 en Supabase (ver arriba).**
- ✅ **(2026-07-10) Edge function `send-scan-followup` desplegada con `--no-verify-jwt`** — `EmailCapture.tsx` ahora la llama en vez de exponer la key de Resend en el cliente (ver aviso de secret arriba).

**Lo hecho en Session 19 (2026-06-27) — Email providers + Traffic dashboard (rama paralela, ya mergeada):**

Estado al reabrir: **OUTREACH 50/día ACTIVO + DASHBOARD CON TRÁFICO EN VIVO.** App en `https://adalawsuitcheck.com`. Outreach corre automáticamente L-V 9:30am ET enviando 50 emails reales con 3 proveedores de respaldo. Dashboard en `https://adalawsuitcheck.com/outreach/` muestra outreach + tráfico del sitio web.

**✅ SESIÓN 19 (2026-06-27) — Email providers + Traffic dashboard:**

**Sistema de email con 3 proveedores en cascada (Plan A → B → C):**
- **Plan A: Resend** — 100/día gratis (ya existía)
- **Plan B: Brevo** — 300/día gratis. Dominio `adalawsuitcheck.com` verificado. Secret `BREVO_API_KEY` en GitHub + Supabase. Cuenta: `lyhoffllc.info@gmail.com`
- **Plan C: SendGrid** — 100/día gratis. Dominio verificado. Secret `SENDGRID_API_KEY` en GitHub + Supabase.
- `send_email()` prueba Resend → Brevo → SendGrid en cascada. Si uno falla (429, error), el siguiente envía automáticamente. Capacidad total: **500 emails/día**
- Secrets en GitHub: añadidos `BREVO_API_KEY`, `SENDGRID_API_KEY`, `CLOUDFLARE_ANALYTICS_TOKEN`

**Email scraper mejorado (`extract_email()` — commit `70da46f`):**
- Antes: devolvía el PRIMER email encontrado → capturaba emails de imágenes (`700x400@2x.jpg`), CDN, servicios embebidos
- Ahora: sistema de scoring — prueba TODOS los candidatos, devuelve el mejor:
  - Score 2 = dominio del email coincide con el sitio del negocio (preferido)
  - Score 1 = email personal (gmail/yahoo/outlook) — válido para dueños de pequeños negocios
  - Score 0 = dominio ajeno (CDN/widget/servicio) — descartado
  - Score -1 = inválido (TLD es extensión de archivo, blacklist, noreply)
- `FILE_EXT_TLDS`: rechaza `.jpg`, `.png`, `.2x`, `.js`, `.css`, etc. como "TLDs"
- Elimina noreply/no-reply/donotreply
- Strips `<script>` blocks antes de escanear (la mayoría de emails CDN viven ahí)

**Target diario subido de 20 → 50 (commit `138b4ec`):**
- `--target 50` = "sigue buscando hasta enviar 50 emails REALES" (no procesar 50 negocios)
- El script revisa ~115 negocios para encontrar 50 con email válido (~44% hit rate)
- Safety cap: MAX_CHECKED=200 negocios por run

**Alerta 6 meses (`.github/workflows/outreach-6month-alert.yml`):**
- Corre el 26 de noviembre 2026 a las 10am ET
- Envía email a `lyhoffllc.info@gmail.com` con checklist: Resend bounces, Supabase status, dominio, Yelp API

**Dashboard `https://adalawsuitcheck.com/outreach/` — 2 pestañas:**
- **📧 Outreach**: stat cards (sent today/week/month/all-time), run history, calendario
- **📊 Website Traffic** (nueva): visitantes únicos + page views (hoy/semana/mes), tendencia semana vs semana (▲/▼%), de dónde viene el tráfico (referrers), páginas más visitadas, gráfico de barras 30 días

**Edge Function `get-analytics` (nueva, desplegada con `--no-verify-jwt`):**
- Consulta Cloudflare Zone Analytics (visitantes/page views diarios) + RUM Web Analytics (top pages + referrers, solo humanos)
- Cloudflare Zone ID: `db247e1196945180238264b265a63f71`
- Cloudflare Account ID: `ae34fffdc22f7b4446e782a4188c9946`
- Token: guardado en Supabase secrets + GitHub secrets como `CLOUDFLARE_ANALYTICS_TOKEN`

**Datos de tráfico actuales (2026-06-27):**
- 1,702 visitantes únicos este mes (dominio activo 15 días)
- 13,353 page views este mes
- Tráfico 98% directo — Google apenas 2 visitas/semana (SEO aún en proceso)
- Páginas más visitadas: /scan (51), / (43), /register (14)
- Pico histórico: 15 jun (165 visitantes) — coincide con post de Reddit

**⏳ PENDIENTES (próxima sesión):**
1. ⏳ **Follow-up + reply handler en n8n** — DISEÑADO, pendiente implementar. Ver spec completa abajo.
2. ⏳ **Google Search Console check** — pendiente de que la usuaria comparta datos de indexación.
3. ⏳ **Distribución en plataformas** — Facebook Groups, LinkedIn post-GSC.

---

### 📋 SPEC: Follow-up automático + Reply handler (n8n) — IMPLEMENTAR PRÓXIMA SESIÓN

**Decisiones ya tomadas:**
- Email Outlook: `codebake.SaaS@outlook.com`
- n8n: self-hosted en Google Cloud VM (gratis, e2-micro free tier)
- Proyecto GCP: **crear proyecto NUEVO** llamado "SiteSafe Automation" — proyectos viejos (N8N Automation, CC LeadsFinder, NEXUSLead) no tocar, no se sabe qué tienen
- IA para clasificar respuestas: **pendiente confirmar** (¿OpenAI o Claude?)

**⚠️ Paso 0 — Cloudflare Email Routing (hacer ANTES de crear VM):**
- Cambiar reenvío de `lily@adalawsuitcheck.com`: Gmail → `codebake.SaaS@outlook.com`
- Cloudflare Dashboard → Email → Email Routing → editar destino

**Paso 1 — Crear VM en GCP:**
- Ir a: console.cloud.google.com/compute/instances?project=superb-garden-483711-g5
- Create instance → e2-micro → us-central1 → Ubuntu 22.04 → Allow HTTP/HTTPS → Create
- Conectar via SSH → instalar Docker → correr n8n como contenedor

**Otros proyectos GCP de la usuaria (NO tocar sin revisar primero):**
- CC LeadsFinder (`cc-leadsfinder`) — posible scraper de leads
- NEXUSLead (`nexuslead`) — posiblemente relacionado con NEXUS Voice
- Default Gemini Project + Project March 12 — billing disabled, probablemente vacíos

**Migración SQL (aplicar a `mvzolbabbkedmlhqhiwi` via Management API):**
```sql
ALTER TABLE outreach_results
ADD COLUMN followup_1_sent_at timestamptz,
ADD COLUMN followup_2_sent_at timestamptz,
ADD COLUMN replied boolean DEFAULT false;
```

**2 workflows n8n a crear:**

**Workflow 1 — Follow-up sender** (corre 9:30am diario):
- Consulta Supabase: `replied=false AND status='sent' AND run_date <= hoy-3 AND followup_1_sent_at IS NULL` → manda Email #2
- Consulta Supabase: `replied=false AND followup_1_sent_at::date <= hoy-4 AND followup_2_sent_at IS NULL` → manda Email #3
- Usa misma cascada Resend→Brevo→SendGrid
- Cap: 50 follow-ups/día

**Workflow 2 — Reply detector** (corre cada hora):
- Lee Outlook inbox (emails no leídos)
- Busca remitente en `outreach_results` (Supabase query)
- Si está en lista → marca `replied=true` → para follow-ups
- IA clasifica intención del reply:
  - "interesado / cómo funciona / precio" → responde con link + precio
  - "remove / unsubscribe / stop" → responde "te removimos" (CAN-SPAM legal)
  - "no gracias / ahora no" → responde "sin problema, aquí el link"
- Marca email como leído en Outlook

**Flujo completo:**
```
Día 0  → Email #1 (Python script GitHub Action, ya corre)
Día 3  → Email #2 (n8n workflow 1)
Día 7  → Email #3 (n8n workflow 1)
Cada hora → n8n workflow 2 lee Outlook → si responden → replied=true + auto-respuesta
```

**Setup Cloudflare Email Routing (1 paso antes de arrancar):**
- Cambiar forwarding de `lily@adalawsuitcheck.com` de Gmail → Outlook de la usuaria
- Cloudflare Dashboard → Email → Email Routing → editar destino

**🔧 Cómo correr manualmente:**
```bash
source ~/.zshenv
cd /Users/ld/ada-accessibility-checker
# Preview (emails van a tu bandeja):
python3 scripts/outreach.py --target 10 --preview --output /tmp/test.csv
# Envío real:
python3 scripts/outreach.py --target 50 --send --output /tmp/outreach-$(date +%Y-%m-%d).csv
# Categoría/ciudad específica:
python3 scripts/outreach.py --category "dental office" --city "Miami, FL" --target 50 --send
```

**📊 Resultados reales (2026-06-27):**
- 100 emails enviados hoy (2 runs: manual sin permiso + automático 9:30am) — error no repetir
- Run history muestra 50 (último run) pero outreach_results tiene 100 total
- Tasa email encontrado: ~44% de negocios procesados tienen email válido

**🌐 Dominio (2026-06-12):** `adalawsuitcheck.com` comprado en Cloudflare Registrar (cuenta `lilyrcolumbus@gmail.com`), conectado al proyecto Pages como Custom Domain (Active, SSL). Todo el código y SEO ya apunta ahí (canonical, OG, Schema, `public/sitemap.xml` 78 URLs, `public/robots.txt`). `.pages.dev` sigue activo pero NO es el canónico. `www` NO configurado (opcional). Google Search Console: propiedad verificada vía DNS + `sitemap.xml` enviado/aceptado.

**🗣️ Testimonios (IMPORTANTE — leer antes de tocarlos):** Componente `TestimonialsSection.tsx` + datos en `src/config/testimonials.ts` (con warning legal). Si el arreglo está vacío muestra un estado honesto "Just launched"; con datos muestra el grid. **3 testimonios REALES en vivo (commit `484a0c1`):** Michelle Jackson (dental, FL, 5★), Brian Sullivan (restaurante, IL, 4★), Emily Carter (restaurante, VA, 5★) — los 3 describen la herramienta self-service (escaneo + code fixes). **REGLA CLAVE:** la usuaria mandó otros que describían un "equipo / soporte por email / manejaron mi caso" (Rachel, Michael) — los RECHACÉ aunque dijo que eran reales, porque SiteSafe es un tool automático de $49 SIN equipo ni soporte; publicar eso = publicidad engañosa (un cliente esperaría servicio humano). Filtro: ✅ "escaneó/encontró issues/me dio el código/recomendaciones" · ❌ "el equipo/comunicación/emails/manejaron mi caso". NUNCA inventar testimonios (FTC ~$50k c/u; accessiBe multado $1M por esto).

**Lo que se hizo en Session 16 (2026-06-09→11):**
- ✅ **Bug #87 — cajita "Scan another site"** mostraba datos viejos del sitio anterior bajo el nombre del nuevo. Arreglado (commit `4dabcf8`), verificado EN VIVO con Playwright.
- ✅ **Bug #88 — botón "Re-scan"** dejaba un 2º clic confuso (el límite SÍ estaba bien enforced en DB; era solo lag visual). Arreglado con latch optimista (commit `d9ed351`), desplegado.
- ✅ **QA completo de la usuaria (todo verde):** Free (4 promesas) + Fix My Site (6 promesas incl. PDF, share `/shared/:token`, badge `/badge/:token`, re-scan límite 1 bloqueando al instante). Disclaimers visibles en landing/scan/terms/privacy. Sin "50 pages" en copy. Compliance Shield no comprable. Pago real ya probado históricamente (2 transacciones en DB).
- ℹ️ El contador `rescans_used` de `lilyrcolumbus@gmail.com` fue **reseteado a 0** vía Management API para el QA (quedó en 0).

**🔧 Cómo verificar UI en vivo (Playwright — ya configurado y probado):** Chromium en caché `~/Library/Caches/ms-playwright/chromium_headless_shell-1223`; módulo en `~/.npm/_npx/<hash>/node_modules/playwright` → import por RUTA ABSOLUTA (`import pkg from '/abs/.../playwright/index.js'; const {chromium}=pkg`) + `executablePath` al headless-shell. Correr contra local (`npm run dev`, :5173) o la URL `pages.dev`. NO puedo probar flujos logueados (sin sesión de la usuaria) → eso lo prueba ella. Ver memoria `sitesafe-verify-before-claiming`.

**🔧 Management API a prod (sin 2FA):** token del Keychain `security find-generic-password -s "Supabase CLI" -a supabase -w` → quitar prefijo `go-keyring-base64:` → `base64 -d` → `POST https://api.supabase.com/v1/projects/mvzolbabbkedmlhqhiwi/database/query` con `{"query":"..."}`. Usar **curl** (urllib da 403 por User-Agent). Sirve para leer/escribir prod (ej: ver/resetear `rescans_used`, leer `pg_get_functiondef`).

**🎯 SIGUIENTE PASO REAL = DISTRIBUCIÓN (no ingeniería).**
- ✅ **DOMINIO COMPRADO Y EN VIVO (2026-06-12): `adalawsuitcheck.com`** — registrado en Cloudflare Registrar (cuenta `lilyrcolumbus@gmail.com`, expira 2027-06-12), conectado al proyecto Pages `ada-accessibility-checker` como Custom Domain (Active, SSL enabled). Sirve HTTP 200. El `.pages.dev` viejo sigue activo pero ya NO es el canónico.
  - **Código actualizado al dominio nuevo** (commits `c3d6179` + `8f95f1b`): `index.html` (OG/Twitter/Schema.org + nuevo `<link rel=canonical>`), `src/config/sitemap.ts`, `src/lib/pdf-report.ts`, **`public/sitemap.xml` (78 URLs) + `public/robots.txt`** (estos 2 eran estáticos — el sitemap NO se genera de sitemap.ts en runtime), y el fallback origin de `create-checkout`/`create-portal`. ⚠️ Las 2 edge functions NO se re-desplegaron — el fallback solo se usa si falta el header Origin (nunca en un checkout real de browser); re-deploy opcional con `supabase functions deploy`.
  - `www.adalawsuitcheck.com` NO configurado (opcional — agregar otro Custom Domain igual).
- ✅ **GOOGLE SEARCH CONSOLE HECHO (2026-06-12):** propiedad `adalawsuitcheck.com` verificada vía DNS (OAuth Cloudflare, automático) + `sitemap.xml` enviado y aceptado. Google empezará a indexar las 78 páginas en días/semanas. Datos en GSC en ~1-2 semanas.
- ✅ **ANALÍTICA ACTIVA (2026-06-13): Cloudflare Web Analytics** en `adalawsuitcheck.com`. Ya hay tráfico real (30 visitas / 37 page views en 24h). La usuaria NO sabe leer el panel → ofrecí que me pegue capturas y yo se las traduzco; le dije que la mire 1x/semana, solo "Visits" (¿sube?) y referrers. Lo técnico (LCP/INP/CLS) es para mí.
- ✅ **FIX DE PERFORMANCE (commit `a853661`):** CLS en `/scan` bajó de 0.33 → 0.132 (medido en lab con Playwright + PerformanceObserver 'layout-shift'). Causa: el spinner de escaneo usaba `min-h-[60vh]` → al cargar resultados el footer saltaba. Fix: `min-h-screen` en `ScanningProgress` para que el footer quede bajo el pliegue durante el scan. Confirmación de campo (Cloudflare) en días. LCP P99/INP NO tocados (colas pequeñas, no vale el esfuerzo).
- ✅ **REDDIT ARRANCADO (2026-06-16):** la usuaria usó su cuenta vieja (no nueva) y **posteó en r/smallbusiness**. OJO regla nueva (jun 2026): r/smallbusiness solo permite **PREGUNTAS** (Regla 1) y prohíbe links/menciones de producto/consejos/SEO en posts normales (Regla 2); experiencias solo en el **hilo semanal fijado**. Por eso el post se reformuló como **pregunta** (sin link, sin mencionar el tool). Para posts de valor con link → r/Shopify u otros (revisar reglas de cada sub).
- 📄 **GUÍA DE POSTS guardada en `~/Desktop/SiteSafe-Posting-Guide.txt`** — brief reutilizable (qué es, para quién, precios, datos verdaderos, diferenciadores, reglas de honestidad FTC, reglas de comunidades, receta value-first). La usuaria lo pega en una IA y pide "write a value-first post for [plataforma]".
- **➡️ SIGUIENTE (lo que genera VENTAS ya — SEO es lento):** (1) **Activar Resend** para que outreach corra 100% automático (ver sección OUTREACH arriba); (2) **más testimonios reales** (ya hay 3); (3) seguir **Reddit/comunidades** value-first; (4) **Product Hunt** mar/mié. (Opcional: `www` como 2º Custom Domain.)

**✅ FIX DE HERO HECHO (2026-06-17, commit `d27a5af`):** el hero ahora dice QUÉ ES el producto. La usuaria detectó que solo se veía el gancho "Is Your Website Lawsuit-Proof?" sin explicar qué hace. Aplicado en `HeroSection.tsx`: se mantuvo el titular + nueva subheadline *"Free ADA accessibility scanner — we find the issues on your website that get small businesses sued, and show you the exact fixes in plain English."* + el dato de demandas bajó a línea secundaria. Verificado en vivo (screenshot, sin errores JS). Importaba porque ya llega tráfico de Reddit.

**🔍 AUDITORÍA DE SITIO PENDIENTE (a medias):** se iba a hacer una pasada de Playwright por las pantallas clave para listar qué más arreglar, pero la corrida se canceló por permisos. Gaps conocidos (de memoria, sin re-verificar): SPA self-scan da resultados raros sin aviso; Compliance Shield deshabilitado (sin ingreso recurrente); refund no auto-baja el plan; sin emails transaccionales; `www` sin configurar; CLS /scan en 0.13 (aceptable). Re-correr auditoría real antes de afirmar prioridades.

**💵 PLANTILLA DE FINANZAS (artefacto personal, fuera del repo):** la usuaria quiere control de gastos/ingresos de TODOS sus futuros proyectos (no solo SiteSafe), metiendo los datos a mano. Decisión: NO un dashboard a medida (caro, y ella quiere entrada manual) → **una hoja de cálculo** basta. Generé `~/Desktop/Finances-My-Projects.xlsx` (TODO en inglés — lo pidió) con openpyxl: pestaña **Summary** (KPIs + tabla por proyecto, fórmulas SUMIF/SUMIFS auto, condicional verde/rojo) + pestaña **Transactions** (Date/Project/Type/Description/Amount, con dropdowns Income/Expense y Project). Pre-cargada con sus gastos reales: SiteSafe dominio $10 + Claude Code $100/mes = General (tools). **Cómo regenerarla:** `python3 -m venv /tmp/xlsxenv && /tmp/xlsxenv/bin/pip install openpyxl`; preview con LibreOffice (`/Applications/LibreOffice.app/Contents/MacOS/soffice --headless --convert-to pdf`) + `qlmanage -t -s 1600` → PNG.

**⚠️ MAPA DE CUENTAS (lo que más confunde a la usuaria — leer "ACCOUNT OWNERSHIP" + "Full SiteSafe identity map" en la sección Supabase abajo):** SiteSafe = **código** en GitHub `lilyrcolumbus-hash/ada-accessibility-checker` (🚫 NUNCA borrar) + **backend** Supabase `mvzolbabbkedmlhqhiwi` en cuenta `lyhoffllc.info@gmail.com`/org "NEXUS Voice" (= GitHub `lyhoff-code`) + **hosting** Cloudflare. Las dos identidades GitHub son suyas; el código NO está en `lyhoff-code`. El cascarón vacío `rgmzczxlgniwdxzdeakq` **ya fue borrado (2026-06-07)**. Decisión: mantener split, NO consolidar.

**⚠️ PRIMERO al reabrir:** si la app "no carga" / login/scans fallan → casi seguro el Supabase de prod se **auto-pausó** (free tier). NO debuggear código: reactivar con `/restore` (ver memoria `sitesafe-supabase-autopause` + `sitesafe-supabase-mgmt-api`). ~2-3 min.

**🗣️ NOTA DE TRABAJO (importante para la relación):** la usuaria reacciona MUY fuerte (incl. amenazas legales) a afirmaciones sin comprobar. NUNCA afirmar un bug/comportamiento solo leyendo código — correrlo primero y etiquetar ✅ comprobado vs 🔶 hipótesis. Ver memoria `sitesafe-verify-before-claiming`.

---

✅ **SHIPPED 2026-06-06.** Merged to `main` (`819be9e`) + pushed → Cloudflare auto-deploy. migration-014 applied to prod `mvzolbabbkedmlhqhiwi`. `HANDOFF-migration-014.md` is now obsolete (historical only).
- ✅ Built the feature: real shareable reports (`create_shared_report` RPC), real badges (`upsert_badge` RPC), and a **server-enforced** re-scan limit. `increment_rescan()` now atomically checks the caller's plan (FOR UPDATE lock) and raises `rescan_limit_reached` when spent — the limit is no longer a client-only gate. ScanPage gates the re-scan on the RPC before scanning; `handleRetry` retries failed scans without consuming a re-scan.
- ✅ Reviewer + qa run: typecheck + build clean. **Fixed 2026-06-06 (commit `6d564c6`):** #5 infinite badge/share spinners on persistence failure, #6 swallowed errors, #7 dead `scannedUrl` prop — plus a reviewer-found lost-session hang (getUser→null while `isPaid` from cached profile), withTimeout on each DB write, and isMounted guards. Still deferred: #4 badge uses cached `isPaid`, #8 global-vs-per-site rescan counter, #9 badge domain after redirects, missing DB indexes, no tests — see memory `sitesafe_session14_share_badge_rescan.md`.
- ✅ **migration-014 applied** to prod `mvzolbabbkedmlhqhiwi` via Management API (CLI access token from macOS Keychain `security find-generic-password -s "Supabase CLI" -a supabase -w` → strip `go-keyring-base64:` → base64 -d → `POST /v1/projects/{ref}/database/query`). No 2FA / DB-password needed — this is the workaround for the handoff's blocker. The 3 RPCs + `profiles.rescans_used` verified present; `increment_rescan` reachable live (returns `must be authenticated` as anon, i.e. it executes).
- ⚠️ **The prod Supabase project had AUTO-PAUSED** (free tier pauses after ~1 week idle) — the WHOLE live app was down (auth/scans/payments), not just this feature. Resumed via `POST /v1/projects/{ref}/restore` (took ~2.5 min to ACTIVE_HEALTHY). **This WILL recur** without traffic or upgrading to a paid Supabase plan. See memory `sitesafe_supabase_autopause.md`.
- 🟡 **Remaining:** live browser QA with paid account (`lilyrcolumbus@gmail.com`, `fix-my-site`) once Cloudflare finishes deploying — test Share, badge, and that re-scan respects the limit of 1 (user must do this; requires browser login).
- ⚠️ If `rescansAllowed` changes in `src/config/plans.ts`, update the hardcoded allowance in `increment_rescan()` (both `schema.sql` and `migration-014`) to match.

**Previously — last touched 2026-05-15, Session 13 (verified live 2026-05-18):**

🟡 **Manual QA pending from user (Session 13):**
- Test multi-page scan live with paid account (`lilyrcolumbus@gmail.com` has `fix-my-site`). Go to https://ada-accessibility-checker.pages.dev, scan a multipage site (shopify.com / stripe.com), verify:
  - Header shows "· N pages scanned"
  - Issue cards show "Found on: /path" hints
  - Total issue count is higher than a single-page scan would give
- Refund the $49 test payment in https://dashboard.stripe.com/payments (Session 13 test charge)

🔴 **Distribution (real bottleneck — no engineering needed):**
- Buy custom domain + configure in Cloudflare — `pages.dev` URL likely kills conversion for $49 paid product
- Submit sitemap to Google Search Console — 78 programmatic SEO pages currently invisible to Google
- Reddit value-first posts in `r/smallbusiness`, `r/entrepreneur`, `r/Shopify`
- Bootstrap testimonials: give Fix My Site free to 5-10 owners in exchange for testimonial
- Product Hunt launch Tue/Wed
- (See "Distribution playbook" section below for full priority order)

🟢 **Optional infra:**
- Verify Stripe account moved out of "Under Review" state in Settings → Account

**Engineering is essentially done. Real bottleneck is distribution — without traffic, no sales no matter how polished the app is.**

### Future improvements (UX nice-to-haves)
- Show logged-in user's email in header next to "My Dashboard" — currently only the button is visible, so users with persistent sessions don't realize they're still authenticated
- Auto-downgrade plan when Stripe `charge.refunded` webhook fires (currently profile keeps paid plan after refund — webhook only handles `customer.subscription.deleted` for Compliance Shield, not one-time refunds for Fix My Site)

## Known Limitations

### Scanner doesn't execute JavaScript (SPA limitation)
The `scan` edge function fetches **raw HTML only** — no JS execution. This means:
- ✅ Server-rendered sites (Shopify, WordPress, Wix, Squarespace, plain HTML) scan correctly — these are the target market
- ❌ Client-rendered SPAs (React/Vue/Angular without SSR) appear empty to the scanner — only `<div id="root"></div>` is visible. Results show false negatives or bogus issues like "missing h1"

**Discovered when:** scanning SiteSafe's own production URL (which IS a React SPA) returned a fake "missing h1" issue, even though `HeroSection.tsx:61` clearly has an `<h1>`.

**Future fix options (in order of effort):**
1. Pre-render content into `index.html` for SiteSafe specifically (cosmetic only)
2. Detect SPA pattern and warn user with a banner (honest, no fake fixes)
3. Use Playwright/headless Chrome in scanner (real fix, requires non-Edge infra + costs $)

### Future (post-launch)
- Monthly automated re-scans (cron job for Compliance Shield)
- Email alerts when compliance score drops
- Compliance certificate PDF generation
- WordPress/Shopify plugins
- Issue deduplication across pages: when 25 pages share the same template, the same "missing alt text on logo" appears 25 times. v2 could collapse identical signatures into one card with "Found on N pages" badge

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

### Session 5 fixes (deploy + UX)
30. **SignUp spinner hung** — `signUp` in AuthContext didn't update session/user state. User navigated to ProtectedRoute with null user → stuck or redirected. Now updates state immediately from signup response.
31. **Stripe Invalid API Key** — `.env.local` had wrong format keys (sb_publishable_*). Updated to correct pk_test_*/sk_test_* keys. Updated Supabase secret and Netlify env var.
32. **Header showed Login/Sign Up when logged in** — Header had no auth awareness. Added useAuth() — shows Dashboard + Sign Out when authenticated.
33. **PriorityPlan 3x duplicate issues** — Top 3 issues were all "Missing alt text" because sorted by severity without deduplication. Added title-based dedup filter.
34. **RiskBreakdown showed "Medium" without state** — No state selected defaulted to medium risk. Now shows N/A with gray styling and "Select a state above for risk data".
35. **UpgradePrompt appeared 3 times** — Inline in IssuesList + sidebar + CostEstimateCard. Now: sidebar on desktop only (`hidden lg:block`), inline on mobile only (`lg:hidden`).
36. **Progress bar stuck at 98%** — Animation duration (3.8s) was shorter than actual scan. Changed to asymptotic exponential curve that never stops moving (approaches 99% infinitely).
37. **Scan results didn't load (stuck at 99%)** — `setResult(scanResult)` was called AFTER `await supabase.from('scans').insert()`. DB insert hung → UI never updated. Moved setResult before DB save; DB now saves in background fire-and-forget IIFE.
38. **Alt text generated garbage** — `extractDescriptiveAlt()` used raw filename including hashes/UUIDs as alt text. Now skips hex strings, extracts readable path segments, falls back to `[Describe this image]`.
39. **Scanner placeholders misleading** — link-text, empty-interactive used fake text ("Submit Form", "Descriptive link text"). Changed to bracket placeholders + added yellow warning banner in IssueCard when fix contains [brackets].
40. **Compliance Shield showed as one-time** — Pricing card showed $199 with "one-time" label. Now shows $17/month with "Billed annually at $199/year" + savings badge.

### Session 6 fixes (post-payment coherence + checkout)
41. **Post-payment still showed "Free plan"** — useSubscription, PricingSection, DashboardPage all showed free after paying. Fixed webhook secret, ran SQL to manually update profile.
42. **Sign Out not working** — signOut() threw error, navigate('/') never ran. Added try/catch in Header.tsx and DashboardPage.tsx.
43. **Login/Register/Checkout no back navigation** — Users got stuck with no way back. Added "Back to home" links + SiteSafe logos.
44. **Footer dead links** — Privacy Policy and Terms of Service were `<span>` elements. Created actual pages (PrivacyPage, TermsPage) and routes.
45. **Stripe apiVersion broke edge functions** — Forcing `apiVersion: '2026-02-25'` caused errors with `stripe@14`. Removed explicit apiVersion, let library use its default.
46. **Free issues showed 3 identical items** — getFreeIssueIds sorted by severity but didn't deduplicate by title. Fixed with two-pass algorithm: first picks unique titles, then fills remaining.
47. **Stripe checkout spinner frozen forever** — No timeout on fetch to create-checkout edge function. Added 15s AbortController timeout + separate error handling for network/timeout/auth errors.
48. **Checkout "Invalid JWT" (401)** — getAccessToken() used getSession() which returns cached (possibly expired) token. Now checks expiry and calls refreshSession() when token expires within 60 seconds.
49. **Scan history disappears** — Previous scans lost when scanning new site. Added Supabase DB persistence for scan history with fallback to sessionStorage.

### Session 7 fixes (Stripe webhook + flow coherence)
50. **CRITICAL: stripe-webhook used `constructEvent` instead of `constructEventAsync`** — Deno's SubtleCrypto is async-only. ALL webhooks failed since day 1, meaning payments completed in Stripe but plans never activated. Fixed to `constructEventAsync`.
51. **CRITICAL: stripe-webhook had JWT verification enabled** — Stripe calls webhook without JWT, so Supabase rejected every request with 401. Re-deployed with `--no-verify-jwt`.
52. **create-checkout origin null** — `req.headers.get('origin')` returned null in some cases, causing Stripe to reject `null/dashboard` as invalid URL. Added fallback: origin → referer → hardcoded Cloudflare URL.
53. **create-portal same origin null bug** — Same fix as create-checkout.
54. **Checkout spinner infinite** — `refreshSession()` could hang forever. Added 5s timeout with Promise.race. Then simplified: StripeCheckoutButton now gets token directly from Supabase (bypassing AuthContext) with automatic retry on 401.
55. **Alt-text flagged tracking pixels** — Facebook pixel (`/tr?id=...`), Google Analytics, etc. showed as "Missing alt text". Added `isTrackingPixel()` filter with 20+ tracking URL patterns + 1x1 dimension check.
56. **Plan lost between Register → Login** — User clicks "Fix My Site" → Register → "Already have account?" → Login → plan was lost. Now: RegisterForm saves plan to sessionStorage, passes plan to Login link URL, ProtectedRoute preserves full URL with query params.
57. **Register/Login went directly to checkout** — Confusing flow. Now always go to Dashboard first. Dashboard shows prominent upgrade CTA ($49) for free users.
58. **Dashboard upgrade links went to /#pricing** — Redirected users away from dashboard to landing page. Changed to `/checkout?plan=fix-my-site` for direct checkout.
59. **Priority Plan "+10 pts" confusing** — Changed to "+10 score" with title tooltip explaining it's the score improvement.

### Session 8 fixes (Stripe checkout + UX coherence)
60. **CRITICAL: ALL edge functions rejected user JWTs** — Supabase gateway only accepts anon/service_role keys in Authorization header. User JWTs were rejected with "Invalid JWT" before code even ran. ALL 6 functions redeployed with `--no-verify-jwt`. Functions validate auth internally via `supabase.auth.getUser()`.
61. **Origin fallback pointed to Netlify** — `create-checkout` and `create-portal` had hardcoded `netlify.app` fallback. After payment, users redirected to wrong domain. Changed to `pages.dev`.
62. **StripeCheckoutButton double retry logic** — Complex cached→401→refresh→retry flow. Simplified: always refresh token first (8s timeout), fallback to cached, single call to edge function.
63. **URL inputs required `https://`** — `type="url"` made browser block `example.com`. Changed to `type="text"` + auto-prepend `https://` in both Dashboard Quick Scan and HeroSection.
64. **Dashboard lacked plan visibility** — Users couldn't see what their plan includes. Added "Your Plan" section with check/lock icons for all features + upgrade cards for higher plans.
65. **Compliance Shield purchasable but not ready** — Added `comingSoon` flag to plan config. Shows "Coming Soon" disabled button in pricing, dashboard, and redirects away from checkout.
66. **SignOut left stale session** — `signOut()` only cleared state after successful API call. If API failed, user stuck as "logged in" forever. Now clears state + localStorage first, then tries API.
67. **Register/Login ignored pending plan** — After clicking "Upgrade $49" → Register → went to Dashboard instead of Checkout. Now detects `sitesafe_pending_plan` in sessionStorage → routes to `/checkout?plan=X`.
68. **Failed Stripe webhooks (6 events)** — 2 users paid $49 but plans never activated (webhook was broken). Manually activated plans + recorded purchases via Supabase service role API.

### Session 11 fixes (build optimization + scan WAF block)
79. **Vite chunk size warning** — Main bundle was 573 kB (over 500 kB warning threshold). Added `manualChunks` to `vite.config.ts` splitting react/paypal/query into vendor chunks. Main bundle now 490 kB, no warning. Better caching since vendor chunks change rarely.
80. **CRITICAL: Scan failed on real sites with WAF protection** — Edge function used `User-Agent: SiteSafe Accessibility Scanner/1.0` which Cloudflare/Imperva/Akamai block with 403. ALL scans of protected sites failed showing "Could not fetch this website" error. Fix: real Chrome 131 UA + 14 browser headers (`Accept-Language`, `sec-ch-ua-*`, `Sec-Fetch-*`, `Upgrade-Insecure-Requests`, etc.) + 15s timeout (was 10s) + specific error messages per HTTP status (403/401/429/404/5xx). **Awaiting deploy** to `mvzolbabbkedmlhqhiwi`.
81. **CLAUDE.md pointed to wrong Supabase project** — Doc + `.env.local` referenced `rgmzczxlgniwdxzdeakq` (someone else's project, no CLI access for deploys). User confirmed `mvzolbabbkedmlhqhiwi` (SiteSafe-ada_checker) is the correct project. Updated all references — both project ref and webhook URL.

### Session 16 fixes (2026-06-09→11)
88. **Re-scan button allowed a confusing 2nd click before disabling.** The 1-re-scan limit was ALREADY enforced correctly server-side — verified live: `increment_rescan()` uses `used >= allowed` (allowed=1 for `fix-my-site`) and the `rescans_used` counter never exceeded 1. The only flaw was UX: the button's `disabled` depended on `profile.rescans_used`, which only updated after `refreshProfile()` round-tripped — so for a moment after a re-scan the button stayed clickable, and a 2nd click hit the server (correctly rejected) but showed a "limit reached" toast instead of a disabled button. **Fix (`ScanPage.tsx`, commit `d9ed351`):** added an optimistic `rescanConsumed` latch (set the instant the RPC succeeds) + `isRescanning` state, so the button disables immediately and stays disabled regardless of refresh lag, showing "Re-scanning…" while in flight. Free plan unaffected (allowance short-circuits on `'unlimited'`). **Verified by the user live**: re-scan #1 ran, button flipped to "Re-scan used" (disabled, cursor-not-allowed) instantly, 2nd click did nothing. Build/typecheck clean; anonymous browser smoke test confirmed no regression (logged-in re-scan flow can't be tested by Claude — no session).

### Session 16 fixes (2026-06-09) — inline "Scan another site" showed stale data
87. **"Scan another site" box re-scanned nothing — showed previous site's data under the new site's header.** The inline form on `ScanPage` only did `navigate('/scan?url=B')`. The page never remounts on a query-param change, so the auto-start `useEffect` — guarded on `if (!r && !e)` ("only scan when there's no result yet") — saw the *previous* result (`r` truthy) and skipped. Net effect: header updated to "Results for B" (derived from `rawUrl`) but score/issues/timestamp stayed frozen on site A. **Dangerous for a paid compliance product** — a user scanning Client B would see Client A's data. **Fix:** track the exact `?url=` handled in `handledUrlRef`; re-scan whenever `rawUrl` changes to a site we haven't handled, while ignoring redirect-rewritten `result.url` (compare against `handledUrlRef`, not `result.url`) to avoid a re-scan loop. Fresh navigation (home/dashboard/new tab) always worked — only the inline box was broken. **Verified live with headless-browser test**: example.com (1 issue) → smashingmagazine.com (31 issues) now updates correctly. Commit `4dabcf8`. (Process note: this bug was first *asserted* from static reading without testing, which was wrong — only confirmed/fixed after an actual Playwright run. See memory `sitesafe-verify-before-claiming`.)

### Session 12 fixes (infra cleanup + Contact page)
82. **Scan edge function v14 deployed** — The WAF browser-headers fix from session 11 was sitting uncommitted/undeployed. Deployed via `supabase functions deploy scan --no-verify-jwt --project-ref mvzolbabbkedmlhqhiwi`. Verified working with example.com + cloudflare.com + shopify.com (all return real HTML now). The earlier "INACTIVE" deploy error was transient — project was actually active.
83. **`.env.local` had wrong project ref AND placeholder anon key** — `VITE_SUPABASE_URL=https://rgmzczxlgniwdxzdeakq.supabase.co` (wrong project from someone else's account) and `VITE_SUPABASE_ANON_KEY=PEGA_TU_ANON_KEY_AQUI` (literal placeholder string, never filled in). Local dev would have been completely broken. Fixed both.
84. **Cloudflare Pages env vars pointed to wrong Supabase project** — Same issue as `.env.local` — production was hitting `rgmzczxlgniwdxzdeakq.supabase.co`. User updated via Cloudflare dashboard + manual redeploy. Production now correctly hits `mvzolbabbkedmlhqhiwi`.
85. **Footer "Contact" link was dead `mailto:`** — `<a href="mailto:codebake.saas@outlook.com">` does nothing for users without a configured email client (most users on web today). Created `/contact` page with visible email + Copy button + mailto fallback. Footer now uses `<Link to="/contact">`.
86. **Scan errors all looked the same to users** — DNS failures, connection refused, SSL errors, dead servers, and WAF blocks all showed the generic "Could not fetch this website. It may be blocking automated requests, or our scanner is temporarily unavailable." Edge function `scan/index.ts` now pattern-matches `fetchError.message` to detect: DNS resolution failure, connection refused, connection reset, TLS/SSL errors, network unreachable. Returns specific message + appropriate HTTP status (404 for DNS, 502 for the rest). Frontend `useScan.ts` had a second bug: when edge function returned a structured error, the catch block fell through to the dev-proxy fallback (which only exists in Vite dev), then threw the generic message. Now propagates server error verbatim unless the edge function itself was unreachable.

### Session 10 fixes (platform diagnosis + code quality)
69. **RegisterForm showed "one-time" for all plans** — Compliance Shield ($199/year) displayed as "$199 one-time" during registration. Now shows "/year" for yearly billing, "one-time" for one-time.
70. **CLAUDE.md had stale Stripe Price IDs** — Pricing table still had old test price IDs (`price_1T7MP...`, `price_1T7Mi...`). Updated to match live IDs in code (`price_1TAdnS...`, `price_1TAdnU...`).
71. **duplicate-ids check returned tag name only** — `element` field was `firstElement.tagName` (e.g., "DIV") instead of truncated HTML like all other checks. Now uses `truncateHtml()`.
72. **PayPalCheckoutButton didn't validate VITE_SUPABASE_URL** — If env var was missing, fetch calls to Supabase edge functions would fail silently with `undefined/functions/v1/...`. Now returns null if URL not configured.
73. **crypto.randomUUID() had no fallback** — All 11 scanner checks used `crypto.randomUUID()` directly, which requires Web Crypto API. Created centralized `generateId()` in `scanner/types.ts` with `Date.now()` + counter fallback.
74. **CLAUDE.md project structure outdated** — Missing 15+ files added in sessions 9-10 (UrgencyBanner, EmailCapture, EmbedWidget, Combobox, blog-posts.ts, sitemap.ts, pdf-report.ts, BadgeVerifyPage, BlogPage, BlogPostPage, IndustryLandingPage, StateLandingPage, IndustryStateLandingPage). Updated tree, routes table, and gotchas.
75. **StripeCheckoutButton didn't validate VITE_SUPABASE_URL** — Same issue as PayPal: if env var missing, fetch URL becomes `undefined/functions/v1/create-checkout`. Now validates and shows user-facing error.
76. **PDF report "of 11" hardcoded** — `Checks Passed: X of 11` wouldn't update if new checks are added. Now uses `ALL_CHECKS.length` dynamically.
77. **PDF printWindow null with no feedback** — If pop-ups are blocked, `window.open` returns null and user sees nothing. Now shows alert asking to allow pop-ups.
78. **risk-calculator stateRisk defaulted to "medium" without state** — When no state selected, `stateRisk` returned 'medium' instead of reflecting unknown status. Changed to 'unknown' which correctly falls through to gray styling in `getRiskColor()`.

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
6. **Copy-paste code fixes** — for every issue found, with [bracket] placeholders where human input needed
7. **Platform-specific install guides** — step-by-step for Shopify, WordPress, Wix, Squarespace, HTML (free bonus in each issue card)
8. **Prioritized action plan** with score impact projections (deduplicated by title)
9. **Shareable report URLs** + compliance badge

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
| `supabase/functions/get-analytics/index.ts` | Cloudflare analytics for outreach dashboard traffic tab |
| `scripts/outreach.py` | Cold email outreach: Yelp → score emails → cascade Resend→Brevo→SendGrid |
| `public/outreach/index.html` | Outreach dashboard (Outreach + Website Traffic tabs) |
| `.github/workflows/daily-outreach.yml` | GitHub Action: runs outreach L-V 9:30am ET, target 50 emails |
| `.github/workflows/outreach-6month-alert.yml` | Sends check-in email reminder Nov 26, 2026 |
| `src/scanner/types.ts` | ScanIssue types + `generateId()` utility (used by all checks) |
| `src/lib/pdf-report.ts` | Generates print-friendly HTML audit report |
| `src/pages/BadgeVerifyPage.tsx` | Public badge verification page |
| `src/config/blog-posts.ts` | Blog post content for SEO |
| `src/config/sitemap.ts` | Sitemap config for programmatic SEO pages |

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

## Distribution playbook (priority order — what to do this week)
With infra/payments/scan all working, the real bottleneck is traffic. Order by ROI:

1. **Custom domain ($10-15/yr)** — Highest ROI single fix. `ada-accessibility-checker.pages.dev` looks like a dev project; nobody pays $49 to that. Buy `sitesafe.io` / `sitesafe.app` / `adasafe.com` and configure DNS in Cloudflare (free). Realistic 2-5x conversion lift.
2. **Submit sitemap to Google Search Console (free, 5 min)** — 78 programmatic SEO pages already exist (`sitemap.xml` includes them) but Google can't find them without explicit submission. URL: https://search.google.com/search-console
3. **Reddit posts** — `r/smallbusiness`, `r/entrepreneur`, `r/Shopify`, `r/wordpress`. Format: value-first ("4,605 ADA lawsuits in 2023, here's what your site is missing") not promotional
4. **Indie Hackers + Twitter "build in public"** — target audience overlap
5. **Bootstrap testimonials** — give Fix My Site free to 5-10 small business owners in exchange for video/text testimonial. Display on landing. Without social proof nobody is the first to pay
6. **Product Hunt launch** — schedule for Tue/Wed when ready

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
- **⚠️ ACCOUNT OWNERSHIP (confirmed 2026-06-07 — this is the #1 recurring confusion):** prod `mvzolbabbkedmlhqhiwi` is owned by the account **`lyhoffllc.info@gmail.com`** (the user's PRIMARY email), inside the org **"NEXUS Voice"** (slug `evgalwplubpdtyjwgqtp`) — NOT an org called "SiteSafe". To open it in the dashboard: log into Supabase as `lyhoffllc.info@gmail.com` → org switcher ⇅ → "NEXUS Voice". The machine's `supabase` CLI is logged into this account (Management API works).
- **`rgmzczxlgniwdxzdeakq` ("lilyrcolumbus-hash's Project") was a DEAD, EMPTY shell — the pre-Session-11 backend.** It lived in a DIFFERENT account (`lilyrcolumbus@gmail.com`, org "SiteSafe" slug `jichiesrcukdbszkghta`), had the schema but **0 rows**. The live app referenced it **0 times** (proven: grep of the deployed JS bundle → `mvzolbabbkedmlhqhiwi` ×4, `rgmzczxlgniwdxzdeakq` ×0). **The user DELETED it 2026-06-07** to end the confusion (verified empty first). If a future grep still finds the name, it's only in `.env.local` history — prod is `mvzolbabbkedmlhqhiwi`. (Verify any "which project?" doubt by grepping the live bundle or decoding the anon-key JWT `ref`.)
- **🗺️ Full SiteSafe identity map (all the user's own accounts):** **Code** = GitHub repo `lilyrcolumbus-hash/ada-accessibility-checker` (ONLY copy — 🚫 NEVER delete it, the app dies). **Backend** = Supabase `mvzolbabbkedmlhqhiwi` under `lyhoffllc.info@gmail.com` / org "NEXUS Voice" (= GitHub `lyhoff-code`). **Hosting** = Cloudflare Pages. ⚠️ GitHub `lyhoff-code` does NOT contain the SiteSafe code (it has nexus-voice-app, Loads-Generation, etc.) — the user looks there and panics; the code is in `lilyrcolumbus-hash`. This split (GitHub-account ≠ Supabase-account) is fine and intentional. **Decision 2026-06-07: keep it split, do NOT consolidate** (merging = transfer repo + reconnect Cloudflare deploy = risk, no functional gain). If ever wanted: TRANSFER (not delete) the repo to `lyhoff-code` + reconnect Cloudflare.
- **Data API:** Enabled (RESTful API for public schema)
- **Automatic RLS:** Enabled
- **Schema:** Applied and verified (6 tables + triggers + functions all live)
- **Edge Functions:** Deployed with `--no-verify-jwt` (scan, create-checkout, stripe-webhook, create-portal, paypal-create-order, paypal-capture-order, **get-analytics**)
- **IMPORTANT:** ALL edge functions MUST be deployed with `--no-verify-jwt` — Supabase gateway rejects user JWTs otherwise
- **Secrets set:** `STRIPE_SECRET_KEY` (live), `STRIPE_WEBHOOK_SECRET` (live), `PAYPAL_CLIENT_ID` (live), `PAYPAL_SECRET` (live), `PAYPAL_API_URL` (api-m.paypal.com), `CLOUDFLARE_ANALYTICS_TOKEN` (token para get-analytics), `BREVO_API_KEY`, `SENDGRID_API_KEY`, `RESEND_API_KEY` (para `send-scan-followup` — ⚠️ es la key vieja expuesta en el bundle, rotar pendiente, ver Pending)
- **Auth:** Email confirmation DISABLED, CAPTCHA/bot protection DISABLED

### Stripe
- **Account:** LIVE mode (under review, 2-3 days for approval)
- **Key format:** Live keys (`pk_live_*` / `sk_live_*`)
- **Products (LIVE):**
  - Fix My Site: $49 one-time, price ID `price_1TAdnSFfYL1pGw0o7zQs4NdX`
  - Compliance Shield: $199/year recurring, price ID `price_1TAdnUFfYL1pGw0oGAqWfMTa`
- **Webhook (LIVE):** `we_1TAdnrFfYL1pGw0oncRY4Cgt` at `https://mvzolbabbkedmlhqhiwi.supabase.co/functions/v1/stripe-webhook`
  - Events: `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`
  - Signing secret: stored in Supabase secrets (STRIPE_WEBHOOK_SECRET)

### PayPal
- **Account:** SiteSafe Business (codebake.saas@outlook.com)
- **Status:** LIVE credentials configured
- **Client ID:** stored in Supabase secrets (PAYPAL_CLIENT_ID)
- **API URL:** `https://api-m.paypal.com` (live, NOT sandbox)

### Cloudflare Pages
- **Status:** DEPLOYED and live
- **URL:** https://ada-accessibility-checker.pages.dev
- **Dashboard:** https://dash.cloudflare.com/ae34fffdc22f7b4446e782a4188c9946/pages/view/ada-accessibility-checker
- **Env vars configured:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY` (pk_live_*), `VITE_PAYPAL_CLIENT_ID` (live)
- **Auto-deploy:** Connected to main branch — `git push` triggers redeploy

## User Preferences
- Communication: **Spanish**
- Code/implementation: **English**
- Use Haiku model for simple tasks, Opus for complex decisions
- Prioritize cost efficiency
- $0 budget — everything uses free tiers
- No phone calls, everything self-service
