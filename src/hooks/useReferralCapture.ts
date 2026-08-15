import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export const REF_CODE_STORAGE_KEY = 'sitesafe_ref_code'
const REF_CODE_PATTERN = /^[a-zA-Z0-9-]{1,40}$/

/**
 * Captures ?ref=CODE from any URL (a partner's link may point anywhere on
 * the site, not just /register) and persists it for the rest of the
 * session so checkout can attribute the sale later.
 */
export function useReferralCapture(): void {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref && REF_CODE_PATTERN.test(ref)) {
      sessionStorage.setItem(REF_CODE_STORAGE_KEY, ref)
    }
  }, [searchParams])
}
