import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle, UserPlus } from 'lucide-react';
import Button from '@/components/ui/Button';

const STORAGE_KEY = 'sitesafe_captured_email';

export default function EmailCapture() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(() => !!localStorage.getItem(STORAGE_KEY));
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
    localStorage.setItem(STORAGE_KEY, trimmed);
    setSubmitted(true);
    setError('');
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
          <div>
            <p className="text-sm font-semibold text-green-800">Report saved!</p>
            <p className="text-xs text-green-700 mt-0.5">
              Create a free account to access your results anytime.
            </p>
          </div>
          <Link to="/register" className="ml-auto">
            <Button size="sm" variant="outline" className="gap-1.5 whitespace-nowrap border-green-300 text-green-700 hover:bg-green-100">
              <UserPlus className="h-3.5 w-3.5" />
              Sign Up Free
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="rounded-lg bg-primary-50 p-2 flex-shrink-0">
            <Mail className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Get your full report by email</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Save a copy of your accessibility audit before you leave.
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
          <Button type="submit" size="sm">
            Send
          </Button>
        </form>
      </div>
      {error && (
        <p className="mt-2 text-xs text-danger-600">{error}</p>
      )}
      <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
        <UserPlus className="h-3.5 w-3.5 text-gray-400" />
        <Link to="/register" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
          Create a free account to save your results
        </Link>
      </div>
    </div>
  );
}
