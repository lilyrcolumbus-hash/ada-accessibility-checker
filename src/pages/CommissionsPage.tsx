import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DollarSign, Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import Button from '@/components/ui/Button'

interface CommissionRow {
  id: string
  referred_by: string
  plan: string
  amount: number
  commission_amount: number | null
  paid: boolean
  paid_at: string | null
  created_at: string
}

const PLAN_LABELS: Record<string, string> = {
  'fix-my-site': 'Fix My Site',
  'compliance-shield': 'Compliance Shield',
}

export default function CommissionsPage() {
  const { code } = useParams<{ code: string }>()
  const [rows, setRows] = useState<CommissionRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCommissions() {
      if (!code) return

      try {
        const { supabase } = await import('@/lib/supabase')
        const { data, error: rpcError } = await supabase.rpc('get_commissions_by_code', {
          p_code: code,
        })

        if (rpcError || !data) {
          setError('Could not load commission data.')
          return
        }

        setRows(data as CommissionRow[])
      } catch {
        setError('Could not load commission data.')
      } finally {
        setLoading(false)
      }
    }

    fetchCommissions()
  }, [code])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-danger-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Couldn't Load Report</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/">
            <Button>Back to SiteSafe</Button>
          </Link>
        </div>
      </div>
    )
  }

  const list = rows ?? []
  const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`
  const totalOwed = list.filter((r) => !r.paid).reduce((sum, r) => sum + (r.commission_amount ?? 0), 0)
  const totalPaid = list.filter((r) => r.paid).reduce((sum, r) => sum + (r.commission_amount ?? 0), 0)

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
            <DollarSign className="h-4 w-4" />
            Partner code: {code}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            Your Commission Report
          </h1>
        </div>

        {/* Summary */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <Clock className="mx-auto mb-2 h-6 w-6 text-warning-500" />
            <p className="text-3xl font-extrabold text-gray-900">{dollars(totalOwed)}</p>
            <p className="mt-1 text-sm text-gray-500">Owed, not yet paid</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-success-500" />
            <p className="text-3xl font-extrabold text-gray-900">{dollars(totalPaid)}</p>
            <p className="mt-1 text-sm text-gray-500">Already paid out</p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {list.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-500">
              No referred sales yet for this partner code.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Plan</th>
                    <th className="px-5 py-3">Sale</th>
                    <th className="px-5 py-3">Commission</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {list.map((row) => (
                    <tr key={row.id}>
                      <td className="px-5 py-3 text-gray-600">
                        {new Date(row.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-900">
                        {PLAN_LABELS[row.plan] ?? row.plan}
                      </td>
                      <td className="px-5 py-3 text-gray-600">{dollars(row.amount)}</td>
                      <td className="px-5 py-3 font-semibold text-gray-900">
                        {row.commission_amount != null ? dollars(row.commission_amount) : '—'}
                      </td>
                      <td className="px-5 py-3">
                        {row.paid ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success-100 px-2.5 py-0.5 text-xs font-medium text-success-700">
                            <CheckCircle2 className="h-3 w-3" /> Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warning-100 px-2.5 py-0.5 text-xs font-medium text-warning-700">
                            <Clock className="h-3 w-3" /> Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Commission amounts are locked in at the rate in effect on the date of each sale.
        </p>
      </div>
    </div>
  )
}
