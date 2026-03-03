# SiteSafe — ADA Website Accessibility Checker

## Product Overview
A self-service web tool that scans any website for ADA/WCAG 2.1 AA accessibility violations, explains issues in plain English with copy-paste code fixes, and provides risk assessment — so small businesses can fix problems before a $10,000+ lawsuit finds them.

**Business model:** One-time payments (NOT subscriptions). User explicitly rejected subscriptions as unnecessary — if we tell them the errors and how to fix them, there's no reason to keep paying monthly.

## Pricing (One-Time, No Subscriptions)
| Plan | Price | Key Features |
|---|---|---|
| **Free Scan** | $0 | 1 page, score, risk, 3 issues visible, 1 code fix |
| **Full Report** | $49 one-time | Up to 50 pages, all issues + fixes, shareable report, 1 re-scan |
| **Agency Pack** | $199 one-time | Unlimited pages, up to 10 websites, 3 re-scans, compliance badge |

Plan IDs: `free`, `full-report`, `agency`. Old IDs (`starter`, `pro`, `business`) no longer exist.

## Tech Stack
- **Frontend:** React 19 + Vite 7 + TypeScript + Tailwind CSS v4 (uses `@theme` for custom colors)
- **Backend/DB:** Supabase (Auth + PostgreSQL + Edge Functions in Deno)
- **Payments:** Stripe one-time payments (mode: `payment`, NOT `subscription`) via `@stripe/stripe-js`
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
│   │   │   ├── PricingSection.tsx  # 3-plan comparison table (12 feature rows)
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
│   │   ├── dashboard/
│   │   │   └── BadgePreview.tsx    # Embeddable compliance badge + embed code
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ProtectedRoute.tsx  # Redirects to /login if not authenticated
│   │   └── ui/
│   │       ├── Button.tsx          # variant: primary/outline/ghost, size: sm/md/lg
│   │       ├── Card.tsx            # Card, CardHeader, CardContent
│   │       ├── Badge.tsx           # variant: default/critical/serious/moderate/minor/success
│   │       └── Input.tsx
│   ├── pages/
│   │   ├── LandingPage.tsx         # Assembles all landing sections
│   │   ├── ScanPage.tsx            # Main results page (score + issues + risk + cost)
│   │   ├── DashboardPage.tsx       # Scan history + subscription status (protected)
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── SharedReportPage.tsx    # Public read-only report (no auth required)
│   ├── hooks/
│   │   ├── useScan.ts              # Core: fetch HTML → run scanner → persist to sessionStorage + DB
│   │   └── useSubscription.ts      # Returns { plan, isPaid, isLoading }
│   ├── contexts/
│   │   └── AuthContext.tsx          # Supabase auth provider (LAZY imports only!)
│   ├── config/
│   │   ├── plans.ts                # Plan definitions: free / full-report / agency
│   │   └── constants.ts            # INDUSTRY_RISK, TOP_LAWSUIT_STATES, lawsuit data
│   └── lib/
│       ├── supabase.ts             # Conditional client: Proxy stub when env vars missing
│       └── utils.ts                # cn() (clsx+twMerge), getDomain()
├── supabase/
│   ├── schema.sql                  # DB schema (6 tables + triggers + functions, see DB Schema section)
│   └── functions/
│       ├── _shared/cors.ts         # CORS headers helper for all edge functions
│       ├── scan/index.ts           # Fetch URL HTML (CORS proxy)
│       ├── create-checkout/index.ts # Stripe Checkout Session (mode: 'payment')
│       ├── stripe-webhook/index.ts  # Handles checkout.session.completed → purchases table
│       └── create-portal/index.ts   # Stripe Customer Portal link
├── vite.config.ts                  # Custom CORS proxy plugin (HTTP+HTTPS, follows redirects, rejectUnauthorized: false)
├── netlify.toml                    # Build config (npm run build → dist/) + SPA redirect (/* → /index.html)
├── tsconfig.json                   # Base config: ES2020, bundler resolution, @/* path alias
├── tsconfig.app.json               # Extends tsconfig.json, includes only src/
├── package.json                    # name: "sitesafe", type: module
└── .env.local                      # VITE_SUPABASE_URL (configured),
                                    # VITE_SUPABASE_ANON_KEY (configured),
                                    # VITE_STRIPE_PUBLISHABLE_KEY (pending)
```

## Routes
| Path | Page | Auth | Layout |
|---|---|---|---|
| `/` | LandingPage | Public | Header + Footer |
| `/scan` | ScanPage | Public | Header + Footer |
| `/scan?url=example.com` | ScanPage (auto-starts scan) | Public | Header + Footer |
| `/login` | LoginPage | Public | Standalone |
| `/register` | RegisterPage | Public | Standalone |
| `/register?plan=full-report` | RegisterPage (pre-selected plan) | Public | Standalone |
| `/dashboard` | DashboardPage | Protected | Standalone |
| `/shared/:token` | SharedReportPage | Public | Standalone |
| `*` | Redirect to `/` | — | — |

Note: `BadgePreviewPage` does NOT have a route yet. `BadgePreview.tsx` exists as a component in `components/dashboard/` but is not integrated into any page. This is a pending task.

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
- Free: score visible, risk visible, first 3 issues visible, rest blurred with Lock overlay
- Paid: everything visible + shareable reports + compliance badge
- `useSubscription()` hook returns `{ plan, isPaid, isLoading }`
- `IssuesList` shows 3 visible + 2 blurred + UpgradePrompt for remaining

### 6. DB schema uses `purchases` table (NOT `subscriptions`)
One-time payments. `stripe-webhook` handles `checkout.session.completed` and inserts into `purchases` table with `plan_id` and `amount`.

### 7. Path alias `@/*`
`tsconfig.json` defines `@/*` → `./src/*`. All imports use `@/components/...`, `@/lib/...`, etc. Vite resolves it via `resolve.alias` in `vite.config.ts`.

## DB Schema (supabase/schema.sql)

### Tables (6)
| Table | Purpose | RLS |
|---|---|---|
| `profiles` | Extends auth.users (email, plan, stripe_customer_id) | Yes — own profile only |
| `scans` | Scan results (url, domain, score, issue counts, results JSONB) | Yes — own scans only |
| `purchases` | One-time payments (plan, stripe_payment_id, amount) | Yes — own purchases only |
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
- Landing page (Hero, Stats, HowItWorks, Fear, Pricing comparison table, TrustSignals, Footer)
- Scan results page (ScoreGauge, RiskBadge, RiskBreakdown, IssueCard, IssuesList, PriorityPlan, CostEstimateCard, UpgradePrompt)
- Auth pages (Login, Register) + AuthContext
- Dashboard page (scan history)
- Shared report page + Badge preview page
- DB schema SQL
- Supabase Edge Functions (scan, create-checkout, stripe-webhook, create-portal)
- netlify.toml
- Pricing restructured to one-time payments
- Visual redesign of scan results (severity color coding, gradient score section, dramatic risk/cost display)
- Supabase project created (ref: `mvzolbabbkedmlhqhiwi`, Data API + automatic RLS enabled)
- `.env.local` configured with real Supabase URL + anon key
- Stripe account created (keys obtained — new format: `sb_publishable_*` / `sb_secret_*`)

### Pending (to launch)
- Run `schema.sql` in Supabase SQL Editor (6 tables: profiles, scans, purchases, shared_reports, badges, scan_usage + triggers + functions)
- Add Stripe publishable key to `.env.local` (`VITE_STRIPE_PUBLISHABLE_KEY`)
- Create 2 Stripe products: $49 Full Report + $199 Agency Pack
- Add Stripe secret key + webhook secret to Supabase Edge Function env vars
- Deploy Supabase Edge Functions (`supabase functions deploy`)
- Deploy to Netlify (connect repo, configure env vars)
- Buy custom domain
- End-to-end testing of payment flow

### Future (post-launch)
- Programmatic SEO pages (industry × state landing pages)
- PDF compliance reports
- Email alerts
- Multi-page scanning (crawl entire site)
- WordPress/Shopify plugins

## Bugs Fixed
1. **Blank page** — AuthContext statically imported supabase, crashing when not configured. Fixed with lazy imports.
2. **AuthContext state not updating** — signIn didn't call setSession/setUser. Fixed.
3. **Dashboard wrong URL** — navigated to `/?url=` instead of `/scan?url=`. Fixed.
4. **Dashboard wrong sessionStorage key** — read `sitesafe_scans` instead of `sitesafe_scan_result`. Fixed.
5. **FearSection dead link** — linked to `/scan` without URL. Changed to `#hero` scroll.
6. **ScanPage no URL** — showed error instead of input form. Fixed with inline form.
7. **RegisterForm "/mo" text** — still said monthly after plan restructure. Fixed to "one-time".
8. **CORS proxy SSL error** — added `rejectUnauthorized: false` to Node https.get.

## Design System
- **Font:** Inter (system-ui fallback), set in `index.css` body rule
- **SEO:** Title "SiteSafe — ADA Website Accessibility Checker", meta description about scanning + $10K lawsuits
- **Colors:** Tailwind v4 `@theme` custom palette — primary (blue), danger (red), warning (amber), success (green)
- **Severity colors:** Critical=danger-500 (red), Serious=orange-500, Moderate=warning-500 (amber), Minor=blue-400
- **Score colors:** >=90 green, >=70 lime, >=50 amber, >=30 orange, <30 red (from `getScoreColor()`)
- **Risk levels:** extreme (red+pulse), high (orange), medium (amber), low (green)
- **Cards:** white bg, rounded-xl, border-gray-200, shadow-sm
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
| accessiBe | $49-349/mo | Fined $1M by FTC. Overlay doesn't work |
| UserWay | $49-490/mo | Same overlay problem |
| AudioEye | $49-199/mo | Targets mid-market, not small businesses |
| WAVE | Free | 1 page only, too technical for non-devs |
| Lighthouse | Free | For developers only |
| Level Access | $500+/mo | Enterprise, requires sales calls |
| **Us** | **$0 / $49 / $199** | **One-time, plain English, code fixes, risk scoring** |

## Our Differentiators
1. **One-time pricing** — no subscriptions, no recurring fees
2. **Plain English** — "Your logo has no description for blind users" not "img missing alt"
3. **Copy-paste code fixes** — for every issue found
4. **Risk score** by industry + US state (lawsuit data)
5. **Prioritized action plan** with score impact projections
6. **Cost/time estimate** for all fixes
7. **Accessible color alternatives** for contrast fixes
8. **Shareable report URLs** + compliance badge

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

## Key Files Quick Reference
| File | Purpose |
|---|---|
| `index.html` | Root HTML: SEO title + meta description, loads /src/main.tsx |
| `src/main.tsx` | Entry point: BrowserRouter + QueryClient + AuthProvider + Toaster |
| `src/App.tsx` | All route definitions |
| `src/hooks/useScan.ts` | Core: fetch HTML → run scanner → persist to sessionStorage + DB |
| `src/hooks/useSubscription.ts` | Returns { plan, isPaid, isLoading } for gating |
| `src/pages/ScanPage.tsx` | Main results page (score hero + issues + risk + cost) |
| `src/scanner/engine.ts` | Runs all 11 checks, aggregates into ScanResult |
| `src/scanner/types.ts` | All TypeScript types (ScanIssue, ScanResult, RiskAssessment, etc.) |
| `src/scanner/scoring.ts` | Score 0-100, getScoreColor(), getScoreLabel() |
| `src/contexts/AuthContext.tsx` | Auth provider — MUST use lazy supabase imports! |
| `src/config/plans.ts` | 3 plan definitions with limits (free/full-report/agency) |
| `src/config/constants.ts` | INDUSTRY_RISK, TOP_LAWSUIT_STATES, lawsuit statistics |
| `src/lib/supabase.ts` | Conditional client — Proxy stub when env vars missing |
| `src/components/landing/PricingSection.tsx` | 3-plan comparison table (12 feature rows) |
| `vite.config.ts` | CORS proxy plugin for dev mode scanning |
| `supabase/schema.sql` | Full DB schema (6 tables + triggers + functions) |

## Provider Stack (main.tsx)
```
BrowserRouter
  └── QueryClientProvider (TanStack Query, staleTime: 5min, retry: 1)
      └── AuthProvider (Supabase auth, lazy imports)
          └── App (routes)
          └── Toaster (react-hot-toast, top-right)
```

## App Architecture
- **No useAuth hook** — auth is accessed via `useContext(AuthContext)` directly from `AuthContext.tsx`
- **No ScanHistory component** — DashboardPage reads scan history directly from sessionStorage
- **BadgePreview component exists** but has no route/page yet (pending integration)
- **SharedReportPage** uses `import IssueCard from` (default export, not named)

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

## Unit Economics (One-Time Model)
- **CAC:** ~$0 (organic SEO)
- **Average order:** ~$80 (blended $49 + $199)
- **Gross margin:** ~95% (hosting free, no API costs)
- **Break-even:** ~30 sales covers basic infrastructure costs

## Revenue Milestones
| Period | Target |
|---|---|
| Month 1 | Launch MVP + first free users |
| Month 2-3 | First 20-50 paid reports ($1K-$4K) |
| Month 4-6 | 100-300 paid reports ($5K-$15K) |
| Month 6-12 | 500+ paid reports ($25K+) |

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
- **Region:** (set during project creation)
- **Data API:** Enabled (RESTful API for public schema)
- **Automatic RLS:** Enabled (all new tables get RLS by default)
- **Schema:** NOT yet applied — `schema.sql` still needs to be run in SQL Editor

### Stripe
- **Account:** Created
- **Key format:** New format (`sb_publishable_*` / `sb_secret_*`, NOT the old `pk_*` / `sk_*`)
- **Products:** NOT yet created (need $49 Full Report + $199 Agency Pack)
- **Webhook:** NOT yet configured

### Netlify
- **Status:** NOT yet deployed
- **Config:** `netlify.toml` ready in repo

## User Preferences
- Communication: **Spanish**
- Code/implementation: **English**
- Use Haiku model for simple tasks, Opus for complex decisions
- Prioritize cost efficiency
- $0 budget — everything uses free tiers
- No phone calls, everything self-service
