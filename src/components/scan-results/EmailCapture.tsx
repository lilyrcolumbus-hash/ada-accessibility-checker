import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle, UserPlus } from 'lucide-react';
import Button from '@/components/ui/Button';
import type { ScanResult } from '@/scanner/types';

const RESEND_KEY = 're_JLAg1eJ3_3vCaby1f7XPDcsFmWLWKQCBj';

async function sendScanFollowupEmail(email: string, result: ScanResult) {
  const domain = result.url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const topIssue = result.issues.find(i => i.severity === 'critical') ?? result.issues[0] ?? null;
  const scoreColor = result.score >= 90 ? '#16a34a' : result.score >= 70 ? '#ca8a04' : result.score >= 50 ? '#ea580c' : '#dc2626';
  const scoreLabel = result.score >= 90 ? 'Good' : result.score >= 70 ? 'Needs Work' : result.score >= 50 ? 'Poor' : 'Critical';
  const urgencyLine = result.criticalCount > 0
    ? `Your site has <strong style="color:#dc2626">${result.criticalCount} critical violation${result.criticalCount !== 1 ? 's' : ''}</strong> — these are the ones that trigger lawsuits.`
    : `Your site has <strong>${result.totalIssues} accessibility issue${result.totalIssues !== 1 ? 's' : ''}</strong> that could expose you to legal risk.`;
  const topIssueBlock = topIssue ? `
    <div style="background:#fef2f2;border-left:4px solid #dc2626;border-radius:4px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:0.05em;">Top issue found</p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#1f2937;">${topIssue.title}</p>
      <p style="margin:0 0 12px;font-size:14px;color:#4b5563;">${topIssue.description}</p>
      <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#374151;">How to fix it:</p>
      <p style="margin:0;font-size:13px;color:#4b5563;">${topIssue.fixDescription}</p>
    </div>` : '';

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#1e40af;padding:24px 32px;">
      <p style="margin:0;font-size:18px;font-weight:700;color:#fff;">SiteSafe</p>
      <p style="margin:4px 0 0;font-size:13px;color:#93c5fd;">ADA Accessibility Report for ${domain}</p>
    </div>
    <div style="padding:28px 32px 20px;border-bottom:1px solid #f3f4f6;">
      <p style="margin:0 0 12px;font-size:15px;color:#374151;">Your accessibility score:</p>
      <div style="display:flex;align-items:center;gap:16px;">
        <div style="width:64px;height:64px;border-radius:50%;background:${scoreColor};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <span style="font-size:22px;font-weight:800;color:#fff;">${result.score}</span>
        </div>
        <div>
          <p style="margin:0;font-size:18px;font-weight:700;color:${scoreColor};">${scoreLabel}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">${urgencyLine}</p>
        </div>
      </div>
    </div>
    <div style="padding:20px 32px;">
      ${topIssueBlock}
      <p style="margin:0 0 16px;font-size:14px;color:#4b5563;">The full report includes the exact code fix for every issue — copy, paste, done. No developer needed.</p>
      <a href="https://adalawsuitcheck.com/register?plan=fix-my-site" style="display:block;text-align:center;background:#1e40af;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 24px;border-radius:8px;margin-bottom:12px;">Get All ${result.totalIssues} Fixes — $49 One-Time</a>
      <a href="https://adalawsuitcheck.com/scan?url=${encodeURIComponent(result.url)}" style="display:block;text-align:center;color:#1e40af;text-decoration:none;font-size:13px;font-weight:500;padding:8px;">View your free scan results →</a>
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #f3f4f6;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">You received this because you scanned ${domain} on SiteSafe. This is not legal advice — results are informational only.<br>SiteSafe · adalawsuitcheck.com</p>
    </div>
  </div></body></html>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Lily from SiteSafe <lily@adalawsuitcheck.com>',
      to: [email],
      subject: `Your ${domain} accessibility report: score ${result.score}/100 (${result.totalIssues} issues found)`,
      html,
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
    ? `Email me my full report (${issueCount} issues found)`
    : 'Email me my accessibility report';

  return (
    <div className="rounded-xl border border-primary-200 bg-primary-50 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="rounded-lg bg-primary-100 p-2 flex-shrink-0">
            <Mail className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{headline}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Get your top issue + the exact code fix sent to your inbox.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2 w-full sm:w-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            placeholder="you@company.com"
            aria-label="Email address"
            className="flex-1 sm:w-56 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
          <Button type="submit" size="sm" loading={saving} disabled={saving}>
            {saving ? 'Sending...' : 'Send Report'}
          </Button>
        </form>
      </div>
      {error && (
        <p className="mt-2 text-xs text-danger-600">{error}</p>
      )}
      <div className="mt-3 flex items-center gap-2 border-t border-primary-100 pt-3">
        <UserPlus className="h-3.5 w-3.5 text-gray-400" />
        <Link to="/register" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
          Create a free account to save your results
        </Link>
      </div>
    </div>
  );
}
