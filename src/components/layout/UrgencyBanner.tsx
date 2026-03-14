import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

const DISMISS_KEY = 'sitesafe_urgency_dismissed';
const DEADLINE = new Date('2026-04-26T00:00:00');

export function UrgencyBanner() {
  const [dismissed, setDismissed] = useState(() => !!sessionStorage.getItem(DISMISS_KEY));

  if (dismissed) return null;

  const now = new Date();
  const diffMs = DEADLINE.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  }

  return (
    <div className="relative bg-danger-600 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium sm:text-sm">
        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
        <span>
          Federal ADA deadline: April 26, 2026 — <strong>{daysLeft} days left</strong>
        </span>
        <button
          onClick={handleDismiss}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-danger-700 transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
