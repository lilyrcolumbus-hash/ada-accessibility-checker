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
  // Example shape (DO NOT publish until it's a real customer quote):
  // {
  //   quote: "Found 12 issues my developer missed. The fixes were copy-paste simple.",
  //   name: "Sarah M.",
  //   business: "Bright Smile Dental",
  //   location: "Tampa, FL",
  //   rating: 5,
  // },
]
