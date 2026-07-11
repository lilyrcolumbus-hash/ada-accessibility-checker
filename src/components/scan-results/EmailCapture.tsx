import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle, UserPlus } from 'lucide-react';
import Button from '@/components/ui/Button';
import type { ScanResult } from '@/scanner/types';

async function sendScanFollowupEmail(email: string, result: ScanResult) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) return;

  const topIssue = result.issues.find(i => i.severity === 'critical') ?? result.issues[0] ?? null;

  await fetch(`${supabaseUrl}/functions/v1/send-scan-followup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      url: result.url,
      score: result.score,
      criticalCount: result.criticalCount,
      seriousCount: result.seriousCount,
      totalIssues: result.totalIssues,
      topIssue,
    }),
  });
}

const STORAGE_KEY = 'sitesafe_captured_email';

interface Props {
  result?: ScanResult;
}

export default function EmailCapture({ result }: Props) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(() => !!localStorage.getItem(STORAGE_KEY));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSaving(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      await supabase.from('leads').insert({ email: trimmed });
    } catch {
      // DB save failed — still proceed
    }

    // Send personalized follow-up email with scan results
    if (result) {
      sendScanFollowupEmail(trimmed, result).catch(() => {/* fire and forget */});
    }

    localStorage.setItem(STORAGE_KEY, trimmed);
    setSubmitted(true);
    setError('');
    setSaving(false);
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-success-200 bg-success-50 p-5">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 flex-shrink-0 text-success-600" />
          <div>
            <p className="text-sm font-semibold text-success-800">Report sent to your inbox!</p>
            <p className="text-xs text-success-700 mt-0.5">
              Check your email — we sent your full accessibility report.
            </p>
          </div>
          <Link to="/register" className="ml-auto">
            <Button size="sm" variant="outline" className="gap-1.5 whitespace-nowrap border-success-300 text-success-700 hover:bg-success-100">
              <UserPlus className="h-3.5 w-3.5" />
              Sign Up Free
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const issueCount = result?.totalIssues ?? 0;
  const headline = issueCount > 0
    ? `Get your full report — all ${issueCount} issues + fixes`
    : 'Get your full accessibility report';

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-primary-400 bg-gradient-to-br from-primary-50 via-primary-50 to-blue-100 p-6 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="rounded-xl bg-primary-600 p-3 flex-shrink-0 shadow-sm">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="inline-block rounded-full bg-primary-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary-700 mb-1.5">
              Free · No signup required
            </span>
            <p className="text-lg sm:text-xl font-extrabold text-gray-900 leading-tight">{headline}</p>
            <p className="text-sm text-gray-600 mt-1">
              Your top issue + the exact copy-paste code fix, sent straight to your inbox in seconds.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            placeholder="you@company.com"
            aria-label="Email address"
            className="flex-1 sm:w-60 rounded-lg border-2 border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
          />
          <Button type="submit" size="lg" loading={saving} disabled={saving} className="whitespace-nowrap shadow-md">
            {saving ? 'Sending...' : 'Email Me My Report →'}
          </Button>
        </form>
      </div>
      {error && (
        <p className="mt-2 text-xs text-danger-600">{error}</p>
      )}
      <div className="mt-4 flex items-center gap-2 border-t border-primary-200 pt-3">
        <UserPlus className="h-3.5 w-3.5 text-gray-400" />
        <Link to="/register" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
          Create a free account to save your results
        </Link>
      </div>
    </div>
  );
}
