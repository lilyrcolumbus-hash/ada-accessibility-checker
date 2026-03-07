import { Link } from 'react-router-dom'
import { Shield, ArrowLeft } from 'lucide-react'
import { RegisterForm } from '@/components/auth/RegisterForm'

export function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800 px-4 py-12">
      {/* Back to home */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
        <Link to="/" className="flex items-center gap-2 text-white">
          <Shield className="h-6 w-6" />
          <span className="text-lg font-bold">SiteSafe</span>
        </Link>
      </div>
      <RegisterForm />
    </div>
  )
}
