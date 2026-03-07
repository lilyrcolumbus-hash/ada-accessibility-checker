import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

export function HeroSection() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please enter a website URL.');
      return;
    }

    // Validate URL format — only allow http/https
    let testUrl: URL;
    try {
      testUrl = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    } catch {
      setError('Please enter a valid website URL.');
      return;
    }

    if (testUrl.protocol !== 'http:' && testUrl.protocol !== 'https:') {
      setError('Please enter a valid website URL (http or https).');
      return;
    }

    setError('');
    navigate(`/scan?url=${encodeURIComponent(trimmed)}`);
  }

  return (
    <section
      id="hero"
      className={cn(
        'relative overflow-hidden bg-gradient-to-b from-primary-50 to-white',
        'px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8',
      )}
    >
      {/* Decorative blur blob */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary-100 opacity-40 blur-3xl"
      />

      <div className="relative mx-auto max-w-3xl text-center">
        {/* Badge */}
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-danger-200 bg-danger-50 px-3 py-1 text-sm font-medium text-danger-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-danger-500" />
          New federal deadline: April 26, 2026
        </div>

        {/* Headline */}
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
          Is Your Website{' '}
          <span className="text-primary-700">Lawsuit-Proof?</span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl">
          4,605 ADA lawsuits were filed in 2023.{' '}
          <strong className="text-gray-800">67% targeted small businesses.</strong> Check your site
          in 30 seconds — free.
        </p>

        {/* URL input form */}
        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-9 flex max-w-xl flex-col gap-3 sm:flex-row"
          noValidate
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError('');
              }}
              placeholder="yourbusiness.com"
              className={cn(
                'w-full rounded-lg border bg-white py-3.5 pl-10 pr-4 text-base text-gray-900 shadow-sm',
                'placeholder:text-gray-400',
                'focus:outline-none focus:ring-2',
                error
                  ? 'border-danger-400 focus:ring-danger-300'
                  : 'border-gray-300 focus:ring-primary-300',
              )}
              aria-label="Website URL"
              aria-describedby={error ? 'url-error' : undefined}
              autoComplete="url"
              inputMode="url"
            />
          </div>
          <Button type="submit" size="lg" className="shrink-0 whitespace-nowrap">
            Scan My Website
          </Button>
        </form>

        {/* Input error */}
        {error && (
          <p id="url-error" role="alert" className="mt-2 text-sm text-danger-600">
            {error}
          </p>
        )}

        {/* Trust line */}
        <p className="mt-4 text-sm text-gray-400">No signup required. Instant results.</p>
      </div>
    </section>
  );
}
