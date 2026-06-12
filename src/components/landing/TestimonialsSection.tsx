import { Link } from 'react-router-dom'
import { Star, Quote, Rocket, ShieldCheck, Code2, Clock } from 'lucide-react'
import { TESTIMONIALS } from '@/config/testimonials'
import { cn } from '@/lib/utils'

// Shows real customer testimonials once they exist (TESTIMONIALS array).
// Until then, renders an honest "just launched — be one of the first" state.
// We never render fabricated quotes: empty array → founding-customer state.
export function TestimonialsSection() {
  const hasTestimonials = TESTIMONIALS.length > 0

  if (!hasTestimonials) {
    return <FoundingState />
  }

  return (
    <section className="bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Trusted by small businesses
          </h2>
          <p className="mt-3 text-lg text-gray-500">
            Real owners who got their sites lawsuit-ready with SiteSafe.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={`${t.name}-${t.business}`}
              className="flex flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <Quote className="h-6 w-6 text-primary-300" aria-hidden="true" />
              {typeof t.rating === 'number' && (
                <div className="mt-3 flex gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-4 w-4',
                        i < t.rating! ? 'fill-warning-400 text-warning-400' : 'text-gray-200',
                      )}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              )}
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-gray-700">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-5 border-t border-gray-100 pt-4">
                <p className="text-sm font-bold text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-500">
                  {t.business}
                  {t.location ? ` · ${t.location}` : ''}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

// Honest social proof while there are no real testimonials yet — true product
// facts + a founding-customer framing. Nothing here claims a customer said
// anything they didn't.
const facts = [
  {
    icon: ShieldCheck,
    title: '11 WCAG 2.1 AA checks',
    body: 'Every scan runs the same checks behind real ADA lawsuits — alt text, contrast, labels, headings and more.',
  },
  {
    icon: Code2,
    title: 'Copy-paste code fixes',
    body: 'Not an overlay. Each issue comes with the exact fix you can hand to any developer — or paste yourself.',
  },
  {
    icon: Clock,
    title: 'Results in seconds',
    body: 'Scan any page instantly and see your compliance score, risk level and the issues that matter.',
  },
] as const

function FoundingState() {
  return (
    <section className="bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-700">
            <Rocket className="h-3.5 w-3.5" aria-hidden="true" />
            Just launched
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Be one of the first to get lawsuit-ready
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-500">
            SiteSafe is brand new — get ahead of the April 2026 ADA deadline before your competitors
            do. Here’s exactly what every scan gives you.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {facts.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-6 text-center shadow-sm"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-gray-900">{title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/scan"
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-700"
          >
            Scan your website free
          </Link>
          <p className="mt-3 text-xs text-gray-400">No credit card required · See your risk in seconds</p>
        </div>
      </div>
    </section>
  )
}
