import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import https from 'https'
import http from 'http'

function fetchPage(targetUrl: string): Promise<{ html: string; finalUrl: string }> {
  return new Promise((resolve, reject) => {
    const mod = targetUrl.startsWith('https') ? https : http
    mod.get(targetUrl, {
      headers: {
        'User-Agent': 'SiteSafe Accessibility Scanner/1.0',
        Accept: 'text/html,application/xhtml+xml',
      },
      rejectUnauthorized: false,
    }, (response) => {
      // Follow redirects
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        const redirectUrl = new URL(response.headers.location, targetUrl).toString()
        fetchPage(redirectUrl).then(resolve).catch(reject)
        return
      }

      const chunks: Buffer[] = []
      response.on('data', (chunk: Buffer) => chunks.push(chunk))
      response.on('end', () => {
        const html = Buffer.concat(chunks).toString('utf-8')
        resolve({ html, finalUrl: targetUrl })
      })
      response.on('error', reject)
    }).on('error', reject)
  })
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'cors-proxy',
      configureServer(server) {
        server.middlewares.use('/api/fetch-page', async (req, res) => {
          const fullUrl = req.originalUrl || req.url || ''
          const url = new URL(fullUrl, 'http://localhost')
          const targetUrl = url.searchParams.get('url')

          if (!targetUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Missing url parameter' }))
            return
          }

          try {
            const { html, finalUrl } = await fetchPage(targetUrl)
            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            })
            res.end(JSON.stringify({ html, finalUrl }))
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Fetch failed'
            res.writeHead(502, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: message }))
          }
        })
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          paypal: ['@paypal/react-paypal-js'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
})
