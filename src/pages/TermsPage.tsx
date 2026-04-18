import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-8">
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </Link>

      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: March 7, 2026</p>

      <div className="prose prose-gray prose-sm max-w-none space-y-6">
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">1. Service Description</h2>
          <p className="text-gray-600 leading-relaxed">
            SiteSafe provides automated website accessibility scanning and reporting tools. Our service
            identifies potential WCAG 2.1 AA compliance issues and suggests code fixes. SiteSafe is a
            tool for informational purposes and does not guarantee full ADA compliance or legal protection.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">2. Disclaimer</h2>
          <p className="text-gray-600 leading-relaxed font-medium">
            SiteSafe does not provide legal advice. Our scan results, risk assessments, and compliance
            scores are informational estimates only. They should not be relied upon as a guarantee of
            ADA compliance or as a defense against legal action. We strongly recommend consulting a
            qualified accessibility specialist or attorney for full compliance assurance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">3. Plans & Payments</h2>
          <p className="text-gray-600 leading-relaxed">
            <strong>Free Scan:</strong> Available without payment. Includes 1 page scan with top 3 issues shown.<br />
            <strong>Fix My Site ($49):</strong> One-time payment. Includes full site scan, all issues with fixes,
            Audit Report, and 1 re-scan.<br />
            <strong>Compliance Shield ($199/year):</strong> Annual subscription. Includes everything in Fix My Site
            plus up to 5 sites, unlimited re-scans, and monthly monitoring.
          </p>
          <p className="text-gray-600 leading-relaxed mt-2">
            Payments are processed securely through Stripe or PayPal. One-time payments are non-refundable
            once the scan report has been generated. Annual subscriptions can be cancelled at any time;
            you will retain access until the end of the billing period.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">4. Acceptable Use</h2>
          <p className="text-gray-600 leading-relaxed">
            You may only scan websites that you own or have authorization to test. You agree not to use
            SiteSafe for any unlawful purpose, to scan malicious or harmful URLs, or to attempt to
            circumvent our service limitations.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">5. Limitation of Liability</h2>
          <p className="text-gray-600 leading-relaxed">
            SiteSafe is provided "as is" without warranties of any kind. We are not liable for any
            damages resulting from your use of the service, including but not limited to: inaccurate
            scan results, missed accessibility issues, legal actions taken against you, or any
            consequential damages. Our maximum liability is limited to the amount you paid for the service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">6. Scan Accuracy</h2>
          <p className="text-gray-600 leading-relaxed">
            Our automated scanner checks for common WCAG 2.1 AA violations but cannot detect all
            accessibility issues. Manual testing, screen reader testing, and user testing are
            recommended for comprehensive compliance. Scan results may vary based on the website's
            structure and content at the time of scanning.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">7. Changes to Terms</h2>
          <p className="text-gray-600 leading-relaxed">
            We may update these terms from time to time. Continued use of SiteSafe after changes
            constitutes acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">8. Contact</h2>
          <p className="text-gray-600 leading-relaxed">
            For questions about these terms, contact us at{' '}
            <a href="mailto:codebake.saas@outlook.com" className="text-primary-600 hover:text-primary-700">
              codebake.saas@outlook.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  )
}
