function getApiUrl(): string {
  const url = Deno.env.get('PAYPAL_API_URL')
  if (!url) {
    throw new Error('PAYPAL_API_URL environment variable is required')
  }
  return url
}

export async function getPayPalAccessToken(): Promise<string> {
  const clientId = Deno.env.get('PAYPAL_CLIENT_ID')
  const secret = Deno.env.get('PAYPAL_SECRET')

  if (!clientId || !secret) {
    throw new Error('PayPal credentials not configured')
  }

  const res = await fetch(`${getApiUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${secret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PayPal auth failed: ${res.status} ${text}`)
  }

  const data = await res.json()
  return data.access_token
}

export function getPayPalApiUrl(): string {
  return getApiUrl()
}
