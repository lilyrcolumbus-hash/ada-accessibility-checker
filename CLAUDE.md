# ADA Website Accessibility Checker

## Product Name (TBD)
- Name not yet chosen. Should be short, memorable, and communicate "website accessibility" or "ADA compliance"
- Domain must be available and affordable

## Elevator Pitch (1 sentence)
A self-service web tool that scans any website for ADA accessibility violations, explains issues in plain English, and provides continuous monitoring — so small businesses can fix problems before a $10,000+ lawsuit finds them.

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

## Market Size (TAM / SAM / SOM)
- **TAM (Total Addressable Market):** 30.2 million small businesses in USA × ~80% have a website = ~24 million potential customers
- **SAM (Serviceable Available Market):** ~5 million small businesses with websites doing ecommerce or taking appointments online (highest lawsuit risk)
- **SOM (Serviceable Obtainable Market Year 1):** 500-2,000 paying customers at $29-99/mo = $15K-$200K ARR
- **Market value:** Global web accessibility software market growing rapidly. Gartner estimates GRC tools investment increasing 50% by 2026

## Unit Economics
- **Customer Acquisition Cost (CAC):** ~$0 (organic SEO, no paid ads)
- **Average Revenue Per User (ARPU):** $49/mo (blended across tiers)
- **Lifetime Value (LTV):** $49 × 12 months avg retention = $588
- **LTV:CAC ratio:** Extremely high (organic acquisition)
- **Gross margin:** ~95% (hosting is free tier, no API costs)
- **Break-even:** ~50 paying customers at $49/mo avg = ~$2,450/mo covers future scaling costs

## Revenue Milestones (Realistic)
| Period | Target | How |
|---|---|---|
| Month 1 | Launch MVP + first free users | Deploy scanner + programmatic SEO pages |
| Month 2-3 | First 10-50 paying customers ($300-$2,500/mo) | SEO indexing + Product Hunt launch |
| Month 4-6 | 50-200 customers ($2,500-$10K/mo) | SEO traffic growing + word of mouth |
| Month 6-12 | 200-500 customers ($10K-$25K/mo) | Established SEO + add features |
| Year 2 | 500-2,000 customers ($25K-$100K/mo) | Multiple traffic channels + referrals |

## Risks and Challenges
| Risk | Severity | Mitigation |
|---|---|---|
| Big company builds same tool | Medium | Our head start + SEO moat + niche focus on small businesses |
| ADA lawsuits decrease | Low | Trend growing since 2018. New regulations increase, not decrease |
| Free tools become better | Medium | We differentiate on simplicity + monitoring + reports, not just scanning |
| Supabase free tier limits | Low | By the time we hit limits, revenue covers upgrade ($25/mo) |
| Legal liability (false compliance) | High | Clear disclaimers: "This tool helps identify issues but does not guarantee legal compliance. Consult an attorney." |
| User scans malicious URLs | Medium | URL validation + sandboxed fetching + rate limiting |

## Legal Disclaimers (IMPORTANT)
- The tool does NOT guarantee ADA compliance or legal protection
- Results are informational, not legal advice
- Users should consult an accessibility specialist or attorney for full compliance
- We are a scanning/monitoring tool, not a remediation service
- These disclaimers must be visible on the landing page, scan results, and terms of service

## Future Roadmap (After MVP)
| Phase | Features |
|---|---|
| V1 (MVP) | Single page scan + results in simple language + compliance score |
| V2 | Full site scan + user accounts + Stripe payments |
| V3 | Monitoring + email alerts + programmatic SEO pages |
| V4 | PDF compliance reports + audit history |
| V5 | Multi-site support (agencies) + team accounts |
| V6 | API access for developers/agencies to integrate |
| V7 | Remediation suggestions with code snippets |
| V8 | WordPress/Shopify plugins for direct integration |
| Future | AI-powered auto-fix suggestions + competitor benchmarking |

## Competitive Moat (Why competitors can't easily copy us)
1. **SEO moat:** 500+ programmatic pages indexed by Google. Takes months for competitors to replicate
2. **Niche positioning:** "For small businesses" is specific. Enterprise tools won't go downmarket
3. **Trust:** accessiBe burned the market. Being transparent and honest builds trust competitors lost
4. **Price lock:** At $29/mo, it's not worth it for big companies to compete on price
5. **Simple language database:** Our library of plain-English explanations for every WCAG rule is a unique asset

## Potential Partnerships
- **Web design agencies:** They build sites for small businesses. They can recommend us to clients
- **Insurance companies:** Cyber liability insurers could bundle our tool to reduce ADA lawsuit risk
- **Hosting platforms:** Netlify, Squarespace, Wix could integrate our scanner
- **Legal firms:** ADA defense attorneys could recommend us to clients as prevention
- **Business associations:** Local chambers of commerce, restaurant associations, dental associations

## SEO Keywords to Target (High Intent)
- "ADA website compliance checker" / "ADA compliance check"
- "Is my website ADA compliant"
- "WCAG 2.1 compliance test"
- "Website accessibility audit free"
- "ADA website lawsuit prevention"
- "ADA compliance for small business"
- "[industry] website accessibility" (restaurants, dental, ecommerce, hotels)
- "[state] ADA website requirements"
- "accessiBe alternative"
- "WCAG checker free"

## Landing Page Messaging (Key Copy Points)
- Headline: "Is your website lawsuit-proof?" or "Check your website for ADA violations in 30 seconds"
- Subhead: "4,000+ businesses were sued last year for inaccessible websites. 67% were small businesses."
- CTA: "Scan my website free"
- Trust signals: "Real scanning, not an overlay. accessiBe was fined $1M for fake compliance."
- Urgency: "New federal deadline: April 26, 2026"
- Price anchor: "Starting at $29/mo — less than a single hour with a lawyer"

## User Preferences
- Communication: Spanish
- Code/implementation: English
- Use Haiku model for simple tasks, Opus for complex decisions
- Prioritize cost efficiency
- $0 budget — everything must use free tiers
- No phone calls, no physical contact, everything self-service
