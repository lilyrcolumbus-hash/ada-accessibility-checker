# SiteSafe — ADA Website Accessibility Checker

A self-service web app that scans any website for ADA/WCAG 2.1 AA accessibility violations, explains each issue in plain English, and provides copy-paste code fixes — so small businesses can catch problems before a lawsuit does.

**Live demo:** [ada-accessibility-checker.pages.dev](https://ada-accessibility-checker.pages.dev)

## What it does

1. Enter any URL — the scanner engine crawls it and runs 11 automated WCAG 2.1 AA checks (contrast, alt text, form labels, heading hierarchy, ARIA roles, and more).
2. Get a compliance score, a risk assessment, and an estimated legal-exposure cost.
3. Each violation ships with a plain-English explanation, the relevant WCAG success criterion, and a before/after code snippet — no accessibility background required to fix it.
4. Upgrade to a paid plan for full multi-page scans, a shareable report, and ongoing monthly re-scans.

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Backend:** Supabase (Postgres, Auth, Row Level Security, Edge Functions)
- **Payments:** Stripe (subscriptions) + PayPal, both live
- **Hosting:** Cloudflare Pages
- **Scanner engine:** custom-built (no third-party accessibility API) — parses raw HTML and runs all 11 checks server-side in a Supabase Edge Function

## Key features

- Custom WCAG 2.1 AA scanner engine with severity scoring and estimated fix time per issue
- Risk score + potential lawsuit cost estimate, based on real ADA litigation data
- Auth, dashboard with scan history, and shareable public reports
- Stripe + PayPal checkout with webhook-driven plan activation
- Automated re-scans and email alerts for subscribed sites

## Known limitation

The scanner currently reads raw HTML only (no JavaScript execution), so it's built for server-rendered sites — the majority of small-business sites (Shopify, WordPress, Wix, Squarespace). Client-rendered single-page apps are a known gap, tracked for a future headless-browser-based scan mode.

## Running locally

```bash
npm install
npm run dev
```

Requires a `.env.local` with:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_PAYPAL_CLIENT_ID=
```
