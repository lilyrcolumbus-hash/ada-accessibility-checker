import { Search, FileSearch, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  {
    icon: Search,
    step: '1',
    title: 'Enter Your URL',
    description: 'Paste your website address and click scan.',
  },
  {
    icon: FileSearch,
    step: '2',
    title: 'See Your Results',
    description:
      'Get a compliance score, risk assessment, and every issue explained in plain English.',
  },
  {
    icon: Wrench,
    step: '3',
    title: 'Fix & Protect',
    description:
      'Follow copy-paste code fixes. Monitor your site for ongoing compliance.',
  },
] as const;

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Heading */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-3 text-lg text-gray-500">
            Check your site for ADA violations in three simple steps.
          </p>
        </div>

        {/* Steps */}
        <div className="relative grid gap-10 md:grid-cols-3">
          {/* Connector line (desktop) */}
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-10 hidden h-0.5 bg-primary-100 md:block"
            style={{ left: '16.7%', right: '16.7%' }}
          />

          {steps.map(({ icon: Icon, step, title, description }) => (
            <div key={step} className="relative flex flex-col items-center gap-4 text-center">
              {/* Icon bubble */}
              <div
                className={cn(
                  'relative z-10 flex h-20 w-20 items-center justify-center rounded-full',
                  'border-4 border-white bg-primary-600 shadow-md',
                )}
              >
                <Icon className="h-9 w-9 text-white" aria-hidden="true" />
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-primary-700 shadow">
                  {step}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
