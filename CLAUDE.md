# ADA Website Accessibility Checker

## What is this project?
A web app that scans websites for ADA/WCAG 2.1 AA compliance and helps small businesses avoid lawsuits (4,000+/year, 67% target small businesses, penalties up to $150,000).

## The Problem We Solve
- **ADA (Americans with Disabilities Act):** US federal law since 1990 requiring businesses to be accessible to people with disabilities — including websites
- **WCAG 2.1 AA:** The official technical standard that defines what "accessible" means (contrast ratios, alt text, keyboard navigation, etc.)
- **April 26, 2026 deadline:** DOJ rule officially makes WCAG 2.1 AA the mandatory standard. Before this, the law was vague ("be accessible" without specific rules). Now it's measurable and enforceable
- **98% of websites DON'T comply** — massive market
- **Serial lawsuit filers** (individuals like Brian Whitaker with 1,700+ lawsuits) use automated tools to find non-compliant sites and sue them. It's a legal business for them
- **67% of lawsuits target small businesses** under $25M revenue. Businesses under $500K revenue are sued MOST
- **Typical settlement:** $5,000-$20,000. Defense costs: $50,000-$100,000+
- **Our pitch to businesses:** Pay $29/month or risk a $10,000+ lawsuit. The choice is obvious

## Why NOW (Market Timing)
- April 2026 deadline creates urgency and media coverage → more Google searches
- accessiBe (main competitor) was fined $1M by FTC in Feb 2025 for false advertising → market trust broken, businesses looking for alternatives
- 22.6% of businesses sued in 2025 HAD accessibility overlays installed — overlays don't protect
- ADA lawsuits increased 37% in H1 2025 vs 2024
- Trend has been growing since 2018 and will NOT decrease

## Target Market
- Small businesses in USA: restaurants, dental offices, ecommerce/Shopify stores, hotels, local services, law firms, salons
- They are NOT tech-savvy — the app must explain everything in simple language, no jargon
- They are scared of lawsuits but don't know how to fix their websites
- They won't make phone calls — must be 100% self-service

## Competitive Landscape
| Competitor | Price | Why we win |
|---|---|---|
| accessiBe | $49-349/mo | Fined $1M by FTC. Overlay doesn't work. 22.6% of sued sites had it |
| UserWay | $49-490/mo | Same overlay problem |
| AudioEye | $49-199/mo | Better but targets mid-market, not small businesses |
| WAVE | Free | Only scans 1 page, no monitoring, no alerts, too technical for non-devs |
| Google Lighthouse | Free | For developers only, not business owners |
| Level Access / Deque | $500+/mo | Enterprise only, requires sales calls |
| **Us** | **Free scan / $29-99/mo** | **Simple language + monitoring + alerts + legal report. For small businesses** |

## Our Differentiation
1. **Price:** $29/mo vs $49-490/mo (competitors) or $500+/mo (enterprise)
2. **Simple language:** Results say "Your logo image has no description for blind users" NOT "img element missing alt attribute"
3. **Real scanning:** We check actual HTML, not an overlay band-aid that doesn't work
4. **Monitoring + alerts:** Continuous, not one-time scan
5. **Legal report:** Document businesses can show their lawyer as proof of compliance efforts
6. **Self-service:** No calls, no demos, no salespeople. Scan → see results → pay → done

## Revenue Model
- **Free tier:** Scan 1 page, see results
- **Starter ($29/mo):** Scan full site (up to 50 pages) + monthly monitoring + email alerts
- **Pro ($79/mo):** Unlimited pages + weekly monitoring + compliance report + priority alerts
- **Business ($99/mo):** Multiple sites + PDF compliance certificate + audit history

## Distribution Strategy (No Sales, No Ads, $0)
- **Programmatic SEO:** Auto-generate hundreds of pages like:
  - "ADA compliance checker for restaurants"
  - "WCAG 2.1 compliance test for dental offices"
  - "Is my website ADA compliant California"
  - "Website accessibility audit free"
  - 50 states × 10+ industries = 500+ landing pages
- **Product Hunt:** Free launch, one-time traffic spike
- **Communities:** Share value (not spam) in business owner groups
- **Building in public:** Twitter/X posts about progress

## Tech Stack (all $0)
- **Frontend:** Static site on Netlify (free tier)
- **Backend/DB:** Supabase (free tier — 500MB DB, 50K monthly active users)
- **Payments:** Stripe (no upfront cost, they take % per transaction)
- **No AI API needed** — pure HTML/CSS analysis
- **Built entirely with Claude Code**

## What the App Does (User Flow)
1. User lands on our page (from Google search)
2. Enters their website URL
3. App fetches the page HTML/CSS
4. Scans for WCAG 2.1 AA violations
5. Shows results in SIMPLE language with severity levels (critical/warning/info)
6. Shows a compliance score (e.g., "Your site is 34% compliant")
7. Free: see results for 1 page
8. Paid: scan full site + get monitoring + alerts + reports

## WCAG 2.1 AA Checks to Implement
- Color contrast ratio (minimum 4.5:1 for normal text, 3:1 for large text)
- Images without alt text
- Form inputs without labels
- Missing heading hierarchy (h1 → h2 → h3, no skipping levels)
- Links without descriptive text (no "click here")
- Missing lang attribute on HTML element
- Keyboard navigation support (all interactive elements focusable)
- ARIA roles and attributes validation
- Video/audio without captions or transcripts
- Touch target sizes (minimum 44x44px)
- Empty buttons or links
- Duplicate IDs on page
- Tables without headers
- Auto-playing media
- Text resize support (up to 200%)

## Build Plan
1. **Week 1:** Core scanner engine + landing page + free scan feature + deploy to Netlify
2. **Week 2:** User accounts (Supabase auth) + results dashboard + Stripe payments
3. **Week 3+:** Programmatic SEO pages + scheduled monitoring + email alerts
4. **Month 2+:** Compliance PDF reports + site history + multi-site support

## Key Metrics to Track
- Scans per day (free)
- Free → paid conversion rate
- Monthly recurring revenue (MRR)
- Organic traffic from SEO pages
- Churn rate

## ADA Lawsuit Data (for marketing copy)
- 4,605 lawsuits in 2023
- 4,000+ in 2024
- 2,014 in H1 2025 (37% increase)
- Typical settlement: $5,000-$20,000
- Defense costs: $50,000-$100,000+
- Serial filers: Brian Whitaker (1,700+), Orlando Garcia (800+)
- Top states: New York, Florida, California, Illinois

## Ideal Customer Profiles

### Customer 1: Small Ecommerce Store Owner
- Sells products online via Shopify, WooCommerce, or custom site
- Revenue: $50K-$500K/year
- Has heard about ADA lawsuits from other store owners or news
- Does NOT have a developer on staff
- Willing to pay $29-79/mo to avoid a $10,000 lawsuit
- Finds us by Googling "is my Shopify store ADA compliant"

### Customer 2: Local Service Business Owner
- Dentist, restaurant, salon, hotel, law firm, plumber
- Has a basic website (often built with Wix, Squarespace, or WordPress)
- Revenue: $200K-$2M/year
- Doesn't know what WCAG means but fears lawsuits
- Needs results explained in plain English
- Finds us by Googling "ADA website compliance check free"

### Customer 3: Marketing Agency Managing Client Sites
- Manages 10-50 small business websites
- Needs to scan multiple client sites
- Willing to pay $99/mo for multi-site monitoring
- Uses our compliance reports to upsell accessibility fixes to their clients
- Finds us through SEO or Product Hunt

### Customer 4: Government Entity (Post April 2026)
- City website, school district, public utility
- MUST comply by law (April 26, 2026 deadline)
- Needs compliance documentation for audits
- Finds us by Googling "WCAG 2.1 AA compliance tool government"

## Why Customers Buy (Psychology)
- **Fear:** "I don't want to be sued for $10,000+"
- **Urgency:** "The April 2026 deadline is coming"
- **Simplicity:** "I can check my site in 30 seconds without being technical"
- **Price:** "It's $29/month vs risking thousands in lawsuits"
- **Proof:** "accessiBe was fined by the government, I need something real"

## User Preferences
- Communication: Spanish
- Code/implementation: English
- Use Haiku model for simple tasks, Opus for complex decisions
- Prioritize cost efficiency
- $0 budget — everything must use free tiers
- No phone calls, no physical contact, everything self-service
