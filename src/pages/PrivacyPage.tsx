import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-8">
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </Link>

      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: March 7, 2026</p>

      <div className="prose prose-gray prose-sm max-w-none space-y-6">
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">1. Information We Collect</h2>
          <p className="text-gray-600 leading-relaxed">
            When you use SiteSafe, we collect: your email address and password when you create an account;
            URLs you submit for scanning; payment information processed securely through Stripe or PayPal
            (we do not store your card details); and basic usage data such as scan history and results.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">2. How We Use Your Information</h2>
          <p className="text-gray-600 leading-relaxed">
            We use your information to: provide and improve our accessibility scanning service;
            process payments; send transactional emails (account confirmation, payment receipts);
            and maintain your scan history and reports. We do not sell your data to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">3. Data Storage</h2>
          <p className="text-gray-600 leading-relaxed">
            Your data is stored securely using Supabase (hosted on AWS). Scan results are associated
            with your account and retained for as long as your account is active. You can delete your
            scan history at any time from your dashboard.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">4. Third-Party Services</h2>
          <p className="text-gray-600 leading-relaxed">
            We use the following third-party services: Supabase for authentication and database;
            Stripe for payment processing; PayPal as an alternative payment method; and Cloudflare
            for hosting. Each service has its own privacy policy.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">5. Cookies</h2>
          <p className="text-gray-600 leading-relaxed">
            We use essential cookies only for authentication (keeping you logged in). We do not use
            tracking cookies, analytics cookies, or advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">6. Your Rights</h2>
          <p className="text-gray-600 leading-relaxed">
            You can: access, update, or delete your account and data at any time; request a copy of
            your data; and opt out of non-essential communications. Contact us at codebake.saas@outlook.com
            for any privacy-related requests.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">7. Contact</h2>
          <p className="text-gray-600 leading-relaxed">
            For privacy questions or concerns, contact us at{' '}
            <a href="mailto:codebake.saas@outlook.com" className="text-primary-600 hover:text-primary-700">
              codebake.saas@outlook.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  )
}
