// Customer testimonials shown on the landing page.
//
// ⚠️ LEGAL — READ BEFORE EDITING:
// Only add REAL testimonials from REAL customers who actually said this.
// The FTC bans fabricated reviews/testimonials (fines up to ~$50k each), and
// fake social proof is exactly what accessiBe was fined $1M for. Never invent
// quotes, names, or businesses. When you collect a real one (e.g. by giving
// Fix My Site free in exchange for feedback), add an object below and it shows
// up automatically — no other change needed.
//
// While this array is empty, TestimonialsSection renders an honest
// "just launched / be one of the first" state instead.

export interface Testimonial {
  /** The customer's exact words. */
  quote: string
  /** Real first name (or first name + last initial). */
  name: string
  /** Their business, e.g. "Miami Beach Bistro". */
  business: string
  /** Optional: city/state, e.g. "Austin, TX". */
  location?: string
  /** Optional rating 1–5 (only if they actually gave one). */
  rating?: number
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'As a dentist, I had no idea my website was putting me at risk of an ADA lawsuit. SiteSafe caught it in seconds and gave me the exact code to fix it. For any dental practice, this is worth way more than the $49 it costs.',
    name: 'Michelle Jackson',
    business: 'Dental Practice',
    location: 'FL',
    rating: 5,
  },
  {
    quote:
      "As a restaurant owner in Illinois, I was nervous about ADA lawsuits — we're the #4 state for them. SiteSafe found issues on my site I never would have caught myself. I wish the report was a little easier to read, but the fixes worked and that's what matters.",
    name: 'Brian Sullivan',
    business: 'Restaurant Owner',
    location: 'Rockford, IL',
    rating: 4,
  },
  {
    quote:
      'As a small restaurant owner, I needed to make sure our website was accessible and compliant without overcomplicating things. The process was simple, the guidance was clear, and the recommendations were easy to follow and implement. Overall, a smooth experience and I’m satisfied with the results.',
    name: 'Emily Carter',
    business: 'Restaurant Owner',
    location: 'VA',
    rating: 5,
  },
]
