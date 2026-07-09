import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

const DISMISS_KEY = 'sitesafe_urgency_dismissed_v2';

export function UrgencyBanner() {
  const [dismissed, setDismissed] = useState(() => !!sessionStorage.getItem(DISMISS_KEY));

  if (dismissed) return null;

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  }

  return (
    <div className="relative bg-danger-600 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium sm:text-sm">
        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
        <span>
          ADA lawsuits hit a record high in 2025 — <strong>over 2,000 small businesses sued in the first half of the year alone.</strong>
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
