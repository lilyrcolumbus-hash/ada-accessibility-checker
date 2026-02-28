# ADA Website Accessibility Checker

## What is this project?
A web app that scans websites for ADA/WCAG 2.1 AA compliance and helps small businesses avoid lawsuits (4,000+/year, 67% target small businesses, penalties up to $150,000).

## Business Context
- **Target market:** Small businesses in USA (restaurants, dental offices, ecommerce, local services)
- **Problem:** 98% of websites don't comply with WCAG 2.1 AA. Serial lawsuit filers scan thousands of sites and sue non-compliant businesses. Typical settlement: $5,000-$20,000
- **Key deadline:** April 26, 2026 — DOJ rule makes WCAG 2.1 AA the official standard
- **Revenue model:** Free scan (1 page) → $29-99/month for monitoring + alerts + reports
- **Competitors gap:** accessiBe ($49-349/mo, fined $1M by FTC), WAVE (free but no monitoring), enterprise tools ($500+/mo). NOBODY serves small businesses at $29/mo
- **Distribution:** Programmatic SEO (hundreds of auto-generated pages like "ADA compliance check [industry] [state]") — no phone calls, no sales team, self-service
- **Full research:** See /Users/ld/business-research/ repo (19 agent reports)

## Tech Stack (all $0)
- **Frontend:** Static site on Netlify (free tier)
- **Backend/DB:** Supabase (free tier)
- **Payments:** Stripe (no upfront cost)
- **No AI API needed** — pure HTML/CSS analysis (contrast ratios, alt text, aria labels, heading structure, form labels, keyboard navigation)

## What the app does
1. User enters a URL → app fetches the page HTML/CSS
2. Scans for WCAG 2.1 AA violations (contrast, alt text, headings, forms, keyboard nav, aria)
3. Shows results in simple language (not technical jargon)
4. Free: scan 1 page
5. Paid ($29-99/mo): scan full site + continuous monitoring + email alerts + compliance reports

## WCAG 2.1 AA checks to implement
- Color contrast ratio (minimum 4.5:1 for text, 3:1 for large text)
- Images without alt text
- Form inputs without labels
- Missing heading hierarchy (h1 → h2 → h3)
- Links without descriptive text
- Missing lang attribute on HTML
- Keyboard navigation support
- ARIA roles and attributes
- Video/audio without captions
- Touch target sizes (minimum 44x44px)

## Build plan
1. Week 1: Core scanner + landing page + free scan feature
2. Week 2: User accounts + dashboard + Stripe payments
3. Week 3+: Programmatic SEO pages + monitoring/alerts

## User preferences
- Communication: Spanish
- Code/implementation: English
- Use Haiku model for simple tasks, Opus for complex decisions
- Prioritize cost efficiency
- $0 budget — everything must use free tiers
