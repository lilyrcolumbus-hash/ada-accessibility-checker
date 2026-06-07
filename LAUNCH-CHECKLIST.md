# LAUNCH CHECKLIST — SiteSafe

> Qué comprobar para tener seguridad TOTAL de que se puede promocionar al mercado.
> Estado: 2026-06-07. La app YA está publicada (https://ada-accessibility-checker.pages.dev);
> esto es para decidir si **empujar tráfico/marketing** con confianza.

---

## ✅ Ya verificado por Claude (no repetir)
- Landing carga (200), título/h1 OK, 0 errores de JS.
- Flujo de escaneo anónimo end-to-end con Playwright: escanea → renderiza score, issues, riesgo, costo. Sin errores de consola.
- Manejo de errores: un sitio que bloquea bots (403) muestra mensaje claro, NO spinner infinito.
- Spinners infinitos de badge/share arreglados (Session 15) — ya no pueden colgarse aunque falle la BD.
- Precios correctos ($49 / $199), rutas `/login /register /contact /scan` → 200.
- Backend del scanner sano (varios sitios server-rendered devuelven HTML 200 en <1s).
- Supabase prod (`mvzolbabbkedmlhqhiwi`) despierto, RPCs Share/badge/re-scan existen y responden.

## 🔴 SOLO la usuaria puede comprobar (necesita su login + tarjeta)

### 1. El dinero realmente entra (lo más crítico)
- En incógnito → "Fix My Site $49" → registrar cuenta → pagar con **tarjeta real** (Stripe LIVE cobra de verdad).
- Debe pasar: redirige a Stripe → paga → vuelve a `/dashboard` con plan "Fix My Site" desbloqueado.
- Luego **REFUNDEAR** ese pago en el dashboard de Stripe.

### 2. Las 3 features nuevas (Session 14) — lo que Claude NO pudo probar sin login
Logueada con `lilyrcolumbus@gmail.com` (plan fix-my-site), escanear un sitio y comprobar:
- **Share:** "Create share link" → genera link → abrirlo en incógnito → se ve el reporte público sin login.
- **Badge:** aparece el badge (no "Generating…" colgado) → "Show code" → el link `/badge/...` abre la página de verificación.
- **Re-scan:** primer "Re-scan" funciona; el segundo se **bloquea** ("Re-scan used"). Ese es el límite server-side.

### 3. Precisión del scanner en el mercado real (chequeo ÉTICO)
- Escanear 2-3 sitios reales del tipo del cliente (Shopify, WordPress de restaurante/dentista, Wix).
- Los problemas reportados deben tener sentido; los fixes razonables.
- ⚠️ NO promocionar para sitios React/Vue sin SSR — ahí el scanner da resultados falsos (limitación conocida). El mercado objetivo (server-rendered) está bien.

### 4. Móvil
- Abrir en el teléfono: landing OK, escanear OK, resultados no se rompen, botón de pago OK.

## 🟡 Antes de CADA campaña de tráfico (Reddit, Product Hunt, etc.)
- Abrir la web en incógnito. Si carga y escanea → adelante.
- Si NO carga / login/scan fallan → el Supabase se **auto-pausó** (free tier). Pedir a Claude que lo reactive (`/restore`, ~3 min). NO mandar tráfico a una app dormida.

## Veredicto
Si **1, 2 y 3 pasan** → seguridad real para promocionar. **1 y 2 son los bloqueantes** (que el dinero entre y que lo vendido funcione). **3 es el seguro ético**. Lo que queda fuera de "perfecto" (índices de BD, tests, contador re-scan global vs por-sitio) NO toca a un cliente que paga — se mejora después, con ventas.

## Cuentas que importan (para no confundirse)
- **Supabase PROD:** `mvzolbabbkedmlhqhiwi` → cuenta `lyhoffllc.info@gmail.com`, org "NEXUS Voice". (NO `rgmzczxlgniwdxzdeakq`, que es un cascarón vacío en la cuenta `lilyrcolumbus@gmail.com` — borrable.)
- **Stripe:** dashboard de Stripe (login aparte) — solo para refunds.
- **GitHub:** repo `lilyrcolumbus-hash/ada-accessibility-checker` — NUNCA borrar, es el código vivo.
