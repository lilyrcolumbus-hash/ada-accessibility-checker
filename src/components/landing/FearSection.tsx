import { AlertTriangle, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TOP_LAWSUIT_STATES, INDUSTRY_RISK } from '@/config/constants';
import Button from '@/components/ui/Button';

const riskFactors = [
  'You sell products or services online',
  'Your website was built before 2022',
  'You use Wix, Squarespace, WordPress, Shopify, or WooCommerce without accessibility plugins',
  'You have never tested your site with a screen reader',
  'Your images have no alt text',
  'Your contact form has no labels',
  'You operate in New York, California, Florida, Illinois, or Minnesota',
  'Your business has fewer than 50 employees',
];

// Convert the TOP_LAWSUIT_STATES record to a sorted array for display
const topStates = Object.entries(TOP_LAWSUIT_STATES)
  .map(([state, data]) => ({ state, ...data }))
  .sort((a, b) => b.lawsuits - a.lawsuits)
  .slice(0, 5);

// Convert INDUSTRY_RISK record to a sorted array of industry names
const topIndustries = Object.entries(INDUSTRY_RISK)
  .sort((a, b) => b[1].lawsuitCount - a[1].lawsuitCount)
  .map(([key]) => key.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
  .filter((name) => name.toLowerCase() !== 'other');

export function FearSection() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-danger-200 bg-danger-50 px-3 py-1 text-sm font-semibold text-danger-700">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Urgent
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            The Risk Is Already Here
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            ADA website lawsuits are filed against small businesses every day, and courts increasingly
            treat <strong className="text-danger-700">WCAG 2.1 AA</strong> as the standard.
            Non-compliance means lawsuits.
          </p>
        </div>

        {/* Two-column content */}
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Risk factors */}
          <div className="rounded-xl border border-danger-100 bg-danger-50 p-7">
            <h3 className="mb-5 text-lg font-bold text-danger-800">
              Your Business Is at Risk If...
            </h3>
            <ul className="space-y-3">
              {riskFactors.map((factor) => (
                <li key={factor} className="flex items-start gap-3 text-sm text-danger-700">
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0 text-danger-500"
                    aria-hidden="true"
                  />
                  {factor}
                </li>
              ))}
            </ul>
          </div>

          {/* Top lawsuit states */}
          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-7">
              <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-gray-900">
                <MapPin className="h-5 w-5 text-primary-600" aria-hidden="true" />
                Top 5 States for ADA Lawsuits
              </h3>
              <ol className="space-y-3">
                {topStates.map((item, index) => (
                  <li key={item.state} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                      {index + 1}
                    </span>
                    <div className="flex flex-1 items-center justify-between">
                      <span className="text-sm font-medium text-gray-800">{item.state}</span>
                      <span className="text-sm text-gray-500">
                        {item.lawsuits.toLocaleString()} lawsuits
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-xs text-gray-400">
                California businesses face added exposure under the Unruh Civil Rights Act, which allows
                statutory damages of $4,000 per violation on top of federal ADA claims.
              </p>
            </div>

            {/* Industry risk */}
            {topIndustries.length > 0 && (
              <div className="rounded-xl border border-warning-100 bg-warning-50 p-7">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-warning-700">
                  Highest-Risk Industries
                </h3>
                <div className="flex flex-wrap gap-2">
                  {topIndustries.map((industry) => (
                    <span
                      key={industry}
                      className="rounded-full border border-warning-200 bg-white px-3 py-1 text-xs font-medium text-warning-800"
                    >
                      {industry}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <a href="#hero">
            <Button size="lg">Check Your Risk — Free</Button>
          </a>
          <p className="mt-3 text-sm text-gray-400">No signup required. Instant results.</p>
        </div>
      </div>
    </section>
  );
}
