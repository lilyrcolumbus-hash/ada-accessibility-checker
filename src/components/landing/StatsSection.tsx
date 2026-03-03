import { Scale, Building2, DollarSign, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const stats = [
  {
    icon: Scale,
    value: '4,605',
    label: 'ADA lawsuits filed in 2023',
    iconClass: 'text-danger-600 bg-danger-50',
  },
  {
    icon: Building2,
    value: '67%',
    label: 'target small businesses',
    iconClass: 'text-warning-600 bg-warning-50',
  },
  {
    icon: DollarSign,
    value: '$10,000+',
    label: 'average settlement cost',
    iconClass: 'text-danger-600 bg-danger-50',
  },
  {
    icon: AlertTriangle,
    value: '98%',
    label: 'of websites fail compliance',
    iconClass: 'text-warning-600 bg-warning-50',
  },
] as const;

export function StatsSection() {
  return (
    <section className="bg-white px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map(({ icon: Icon, value, label, iconClass }) => (
            <div
              key={label}
              className={cn(
                'flex flex-col items-center gap-3 rounded-xl border border-gray-100 bg-gray-50',
                'px-4 py-8 text-center shadow-sm transition-shadow hover:shadow-md',
              )}
            >
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-full', iconClass)}>
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <p className="text-3xl font-extrabold text-gray-900 sm:text-4xl">{value}</p>
              <p className="text-sm font-medium text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
