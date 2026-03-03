import { ShieldCheck, Code, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

const trustPoints = [
  {
    icon: ShieldCheck,
    title: 'Real Scanning, Not a Band-Aid',
    body: 'We analyze your actual HTML and CSS — no fake overlay widgets that mask problems without fixing them.',
    iconClass: 'text-success-600 bg-success-50',
  },
  {
    icon: Code,
    title: 'Overlays Do Not Work',
    body: 'accessiBe was fined $1M by the FTC. 22.6% of businesses sued for ADA violations already had an overlay installed.',
    iconClass: 'text-danger-600 bg-danger-50',
  },
  {
    icon: Eye,
    title: 'Fixes You Can Verify',
    body: 'Every fix we recommend is a copy-paste code change you can inspect, verify, and hand to any developer.',
    iconClass: 'text-primary-600 bg-primary-50',
  },
] as const;

export function TrustSection() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Heading */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Real Scanning. Not an Overlay.
          </h2>
          <p className="mt-3 text-lg text-gray-500">
            Overlay widgets are the #1 source of false confidence in ADA compliance — and lawsuits
            prove it.
          </p>
        </div>

        {/* Trust points */}
        <div className="grid gap-8 sm:grid-cols-3">
          {trustPoints.map(({ icon: Icon, title, body, iconClass }) => (
            <div
              key={title}
              className={cn(
                'flex flex-col gap-4 rounded-xl border border-gray-100 p-6 text-center shadow-sm',
              )}
            >
              <div
                className={cn(
                  'mx-auto flex h-14 w-14 items-center justify-center rounded-full',
                  iconClass,
                )}
              >
                <Icon className="h-7 w-7" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-gray-900">{title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{body}</p>
            </div>
          ))}
        </div>

        {/* Bottom disclaimer */}
        <div className="mt-10 rounded-lg border border-gray-200 bg-gray-50 p-5 text-center text-xs leading-relaxed text-gray-400">
          SiteSafe does not guarantee ADA compliance or legal protection. Results are informational,
          not legal advice. Consult an accessibility specialist or attorney for full compliance.
        </div>
      </div>
    </section>
  );
}
