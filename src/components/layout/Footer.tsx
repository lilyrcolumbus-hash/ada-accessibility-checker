import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <Link to="/" className="flex items-center gap-2 text-primary-700 hover:text-primary-800">
              <Shield className="h-6 w-6 fill-primary-100 stroke-primary-700" />
              <span className="text-lg font-bold tracking-tight">SiteSafe</span>
            </Link>
            <p className="text-sm text-gray-500">Protect your business from ADA lawsuits</p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Company
            </h3>
            <Link to="/privacy" className="text-sm text-gray-600 hover:text-primary-700">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-sm text-gray-600 hover:text-primary-700">
              Terms of Service
            </Link>
            <a href="mailto:hello@sitesafe.com" className="text-sm text-gray-600 hover:text-primary-700">
              Contact
            </a>
          </div>

          {/* Legal disclaimer */}
          <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Legal Disclaimer
            </h3>
            <p className="text-xs leading-relaxed text-gray-400">
              SiteSafe does not guarantee ADA compliance or legal protection. Results are
              informational, not legal advice. Consult an accessibility specialist or attorney for
              full compliance.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
          &copy; 2026 SiteSafe. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
