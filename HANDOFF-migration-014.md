# HANDOFF — SiteSafe / migration-014 (compartir + badge + límite re-scan)

> ✅ **RESUELTO 2026-06-06 — ESTE DOCUMENTO ES HISTÓRICO, YA NO HAY BLOQUEO.**
> migration-014 aplicada a prod `mvzolbabbkedmlhqhiwi` (vía Management API con el token del CLI,
> sin necesitar 2FA ni contraseña de BD — ver CLAUDE.md Session 14 y memoria `sitesafe-supabase-mgmt-api`).
> Mergeado a `main` (commit `819be9e`) + push → Cloudflare auto-deploy. Las 3 RPCs + `profiles.rescans_used`
> verificadas en vivo. Nota: el proyecto estaba auto-pausado (free tier) y hubo que reactivarlo primero.
> Único pendiente: QA en navegador con cuenta de pago. El texto abajo se conserva solo como referencia.
>
> Documento de traspaso original. Estado al 2026-06-06.
> Proyecto: SiteSafe (ADA accessibility checker). Comunicación en español, código en inglés.

---

## 🎯 EN UNA FRASE

La feature de **reportes compartibles + badges reales + límite de re-scan** está **codeada y commiteada** en una rama, pero **NO publicada** porque falta **un solo paso manual**: correr el SQL `migration-014` en la base de datos de producción. Ese paso está **bloqueado** por acceso (2FA / contraseña de BD).

---

## 🚧 EL BLOQUEO EXACTO (lo único pendiente)

Para activar la feature hay que ejecutar el SQL `migration-014-share-badge-rescan.sql` en el proyecto Supabase de producción `mvzolbabbkedmlhqhiwi`.

No se ha podido porque:
- **Web (supabase.com):** el login del proyecto real pide **código 2FA de 6 dígitos** (app autenticadora) → el usuario no lo tenía a mano.
- **Terminal (CLI):** `supabase db push` requiere la **contraseña de la base de datos** → no está guardada en la máquina, el usuario no la tenía a mano.
- El token del CLI está cifrado en el Keychain (formato `go-keyring-chunked`) → no se puede reutilizar por curl a la Management API.

### Para DESBLOQUEAR — basta UNA de estas:

**A) Contraseña de la base de datos** (la del proyecto Supabase, distinta del login). Con ella:
```bash
cd /Users/ld/ada-accessibility-checker
supabase link --project-ref mvzolbabbkedmlhqhiwi   # pide la contraseña → configura conexión IPv4
supabase db push                                    # aplica migration-014
```

**B) Código 2FA de Supabase** (Google Authenticator / Authy en el teléfono). Con él:
1. Entrar a https://supabase.com/dashboard/project/mvzolbabbkedmlhqhiwi/sql/new
2. Pegar el SQL de `supabase/migration-014-share-badge-rescan.sql`
3. Run → "Success. No rows returned"
4. (Opcional) desde Settings → Database se puede **resetear** la contraseña de BD para luego usar la Opción A.

**C) Si no hay ni 2FA ni contraseña:** recuperar la cuenta Supabase dueña del proyecto (org `evgalwplubpdtyjwgqtp`, proyecto `SiteSafe-ada_checker`). El CLI de la máquina actual SÍ está logueado en esa cuenta (`supabase projects list` la muestra), así que la cuenta existe y es accesible desde la terminal.

---

## ⚠️ TRAMPA IMPORTANTE: HAY DOS COPIAS DEL REPO

| Carpeta | Rama | Estado |
|---|---|---|
| `/Users/ld/ada-accessibility-checker/` (**PADRE**) | `feature/share-badge-rescan` | ✅ **Aquí está el trabajo nuevo** (Session 14). Commits `9c37754` + `32eb1e2`. Aquí vive `supabase/migration-014-share-badge-rescan.sql` |
| `/Users/ld/ada-accessibility-checker/ada-accessibility-checker/` (**ANIDADA**) | `main` (viejo `882750f`) | El CLAUDE.md grande del proyecto vive aquí. NO tiene la feature. |

**Ambas** están vinculadas al MISMO proyecto Supabase real `mvzolbabbkedmlhqhiwi`.
**El trabajo de la feature está en la carpeta PADRE.** Trabaja ahí para el merge/push.

---

## ✅ QUÉ YA ESTÁ HECHO (rama `feature/share-badge-rescan`, carpeta PADRE)

Commit `9c37754` "Add shareable reports, real badges, server-enforced re-scan limit":
- `supabase/migration-014-share-badge-rescan.sql` — **NUEVO** (las 3 funciones RPC + columna `rescans_used`)
- `supabase/schema.sql` — actualizado (+97 líneas, mismas funciones para que el esquema quede sincronizado)
- `src/pages/ScanPage.tsx` — botón Share + badge wireados a las RPC
- `src/components/scan-results/EmbedWidget.tsx` — usa `upsert_badge`
- `src/hooks/useScan.ts` — llama a `increment_rescan` para el límite de re-scan
- `src/contexts/AuthContext.tsx`, `src/config/plans.ts`, `index.html` — ajustes menores

Commit `32eb1e2` "Document Session 14".

**El SQL ya fue verificado contra el esquema real:** las tablas `shared_reports`, `badges`, `profiles` tienen todas las columnas que las funciones necesitan. El SQL es **idempotente** (`create or replace`, `add column if not exists`) → seguro de correr varias veces.

⚠️ Detalle menor (no bloquea): en `increment_rescan()` los usuarios `free` quedan como "ilimitado" (rama `else`), pero `plans.ts` dice `rescanIncluded: false` para free. En la práctica no importa (free no tiene botón de re-scan). Si algún día se habilita, ajustar.

---

## 📋 PASOS PARA TERMINAR (en orden — el SQL VA PRIMERO)

> Orden crítico: si publicas el frontend ANTES de correr el SQL, los usuarios verán errores al usar Share/badge/re-scan porque las funciones RPC aún no existirían en la BD.

1. **Correr `migration-014`** en `mvzolbabbkedmlhqhiwi` (ver "DESBLOQUEAR" arriba). Verificar éxito.
2. **Verificar** que existen las funciones (opcional):
   `create_shared_report`, `upsert_badge`, `increment_rescan` + columna `profiles.rescans_used`.
3. **Publicar el código** (desde carpeta PADRE):
   ```bash
   cd /Users/ld/ada-accessibility-checker
   git checkout main
   git merge feature/share-badge-rescan
   git push            # Cloudflare Pages publica solo al pushear a main
   ```
4. **QA en vivo** en https://ada-accessibility-checker.pages.dev con cuenta de pago
   (`lilyrcolumbus@gmail.com` tiene plan `fix-my-site`): probar Share, badge y que el re-scan respete el límite de 1.

---

## 🔑 DATOS DE INFRAESTRUCTURA

- **Supabase producción:** proyecto `mvzolbabbkedmlhqhiwi` (org `evgalwplubpdtyjwgqtp`, "SiteSafe-ada_checker", región Ohio).
  - SQL editor: https://supabase.com/dashboard/project/mvzolbabbkedmlhqhiwi/sql/new
  - El CLI de la máquina actual ya está logueado en esta cuenta.
- **Supabase VIEJO/VACÍO (ignorar):** `rgmzczxlgniwdxzdeakq` ("lilycolumbus-hash's Project") — sin migraciones, 0 requests. NO es producción. No correr nada aquí.
- **Cloudflare Pages:** https://ada-accessibility-checker.pages.dev — auto-deploy al pushear a `main`.
- **Edge functions:** desplegar SIEMPRE con `--no-verify-jwt --project-ref mvzolbabbkedmlhqhiwi`.

---

## 📎 EL SQL (referencia rápida)

El archivo completo está en `supabase/migration-014-share-badge-rescan.sql` (carpeta PADRE).
Crea: `profiles.rescans_used` (int) + RPCs `create_shared_report(uuid)`, `upsert_badge(text,integer)`, `increment_rescan()` + sus `grant ... to authenticated`. Todo `security definer`.
