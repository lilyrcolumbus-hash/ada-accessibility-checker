#!/usr/bin/env python3
"""
SiteSafe Outreach Script
========================
1. Busca negocios en Yelp (nombres + teléfonos)
2. Encuentra su website real via DuckDuckGo
3. Escanea el site para issues ADA con BeautifulSoup
4. Extrae el email de contacto de su web
5. Genera email personalizado listo para enviar
6. Exporta todo a outreach.csv

Setup:
  pip install requests beautifulsoup4 duckduckgo-search

Env vars requeridas:
  YELP_API_KEY  — https://fusion.yelp.com (gratis)

Uso:
  python3 scripts/outreach.py --category "dental office" --city "Miami, FL" --limit 20
  python3 scripts/outreach.py --category restaurant --city "Chicago, IL" --limit 30
"""

import os, csv, sys, time, re, json, argparse, requests, socket, smtplib, datetime
from urllib.parse import quote, urlparse
from dataclasses import dataclass
from pathlib import Path
from bs4 import BeautifulSoup

# ── Config ───────────────────────────────────────────────────────────────────

YELP_API_KEY        = os.environ.get("YELP_API_KEY", "")
RESEND_API_KEY      = os.environ.get("RESEND_API_KEY", "")
FROM_EMAIL          = os.environ.get("FROM_EMAIL", "")
SUPABASE_URL        = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
SITESAFE_URL        = "https://adalawsuitcheck.com"
SENDER_NAME         = "Lily from SiteSafe"

OUTREACH_DIR   = Path.home() / "Desktop" / "SiteSafe-Outreach"
CONTACTED_LOG  = OUTREACH_DIR / "contacted.csv"  # local backup

# ── Daily rotation — 25 categories × 30 cities = 750 unique combos ───────────
CATEGORIES = [
    "restaurant", "dental office", "hotel", "law firm", "physical therapy",
    "salon", "optometry", "chiropractor", "veterinary", "auto repair",
    "spa", "gym", "pharmacy", "real estate", "accounting",
    "insurance", "florist", "jewelry store", "clothing store", "bakery",
    "coffee shop", "urgent care", "pediatrician", "dermatologist", "wedding venue",
]
CITIES = [
    "Miami, FL", "Chicago, IL", "Dallas, TX", "Atlanta, GA", "Phoenix, AZ",
    "Philadelphia, PA", "San Antonio, TX", "Austin, TX", "Charlotte, NC", "Seattle, WA",
    "Los Angeles, CA", "Houston, TX", "San Diego, CA", "Denver, CO", "Nashville, TN",
    "Portland, OR", "Las Vegas, NV", "Boston, MA", "Orlando, FL", "Minneapolis, MN",
    "Detroit, MI", "Baltimore, MD", "Sacramento, CA", "Kansas City, MO", "Tampa, FL",
    "Indianapolis, IN", "Columbus, OH", "Raleigh, NC", "Salt Lake City, UT", "New Orleans, LA",
]

def _daily_defaults() -> tuple[str, str]:
    """Returns (category, city) based on day-of-year for automatic rotation."""
    day = int(datetime.date.today().strftime("%j"))
    return CATEGORIES[day % len(CATEGORIES)], CITIES[(day * 7) % len(CITIES)]

BROWSER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

EMAIL_BLACKLIST = {"example.com", "domain.com", "wixpress.com", "squarespace.com",
                   "shopify.com", "wordpress.com", "sentry.io", "googleapis.com"}

SKIP_DOMAINS = {"yelp.com", "facebook.com", "instagram.com", "twitter.com",
                "linkedin.com", "google.com", "tripadvisor.com", "zoominfo.com",
                "yellowpages.com", "bbb.org", "mapquest.com", "doordash.com",
                "grubhub.com", "opentable.com", "zocdoc.com"}

BAD_LINK_TEXTS = {"click here", "here", "read more", "more", "learn more", "link", "this", "click"}

# ── Data model ───────────────────────────────────────────────────────────────

@dataclass
class Business:
    name: str
    category: str
    city: str
    phone: str = ""
    website: str = ""
    email: str = ""
    issues: int = 0
    critical: int = 0
    scan_error: str = ""
    lang: str = "en"  # detected from html lang attribute

# ── Yelp: obtener nombres de negocios ────────────────────────────────────────

def yelp_search(category: str, city: str, limit: int = 50, offset: int = 0) -> list[Business]:
    if not YELP_API_KEY:
        print("ERROR: YELP_API_KEY no está configurada.")
        sys.exit(1)

    headers = {"Authorization": f"Bearer {YELP_API_KEY}"}
    resp = requests.get(
        "https://api.yelp.com/v3/businesses/search",
        headers=headers,
        params={"term": category, "location": city, "limit": min(limit, 50), "offset": offset},
        timeout=10,
    )
    if resp.status_code in (400, 404):
        return []
    resp.raise_for_status()
    data = resp.json()
    return [
        Business(name=b.get("name", ""), category=category, city=city, phone=b.get("phone", ""))
        for b in data.get("businesses", [])
    ]


def yellowpages_search(category: str, city: str) -> list[Business]:
    """Fuente secundaria: Yellow Pages — tiene email/website en muchos listings."""
    try:
        url = f"https://www.yellowpages.com/search?search_terms={quote(category)}&geo_location_terms={quote(city)}"
        resp = requests.get(url, headers=BROWSER_HEADERS, timeout=15)
        if resp.status_code != 200:
            return []
        soup = BeautifulSoup(resp.text, "html.parser")
        results = []
        for card in soup.select(".result .info"):
            name_el   = card.select_one(".business-name span")
            web_el    = card.select_one("a.track-visit-website")
            phone_el  = card.select_one(".phones.phone.primary")
            if not name_el:
                continue
            website = web_el["href"] if web_el and web_el.get("href", "").startswith("http") else ""
            results.append(Business(
                name=name_el.get_text(strip=True),
                category=category,
                city=city,
                phone=phone_el.get_text(strip=True) if phone_el else "",
                website=website,
            ))
        return results
    except Exception as e:
        print(f"  YellowPages error: {e}")
        return []

# ── DuckDuckGo: encontrar website real del negocio ───────────────────────────

SKIP_DOMAINS_EXTENDED = SKIP_DOMAINS | {
    "wikipedia.org", "wikimedia.org", "wikidata.org",
    "yelp.com", "maps.google.com", "apple.com",
    "nextdoor.com", "citysearch.com", "foursquare.com",
    "superpages.com", "manta.com", "thumbtack.com",
}

def find_website(biz_name: str, city: str) -> str:
    """Busca en DuckDuckGo el website oficial del negocio."""
    try:
        from ddgs import DDGS
        # Usar el nombre sin comillas para mayor flexibilidad, añadir city y "site:" negativo
        state = city.split(",")[-1].strip() if "," in city else city
        query = f'{biz_name} {state} restaurant official site'
        with DDGS() as d:
            for result in d.text(query, max_results=8):
                url = result.get("href", "")
                if not url or not url.startswith("http"):
                    continue
                domain = urlparse(url).netloc.replace("www.", "").lower()
                if any(skip in domain for skip in SKIP_DOMAINS_EXTENDED):
                    continue
                # Descartar resultados donde el dominio no tenga relación con el nombre del negocio
                name_words = [w.lower() for w in biz_name.split() if len(w) > 3]
                if name_words and not any(w in domain for w in name_words):
                    continue
                return url
    except Exception as e:
        print(f"    DuckDuckGo error: {e}")
    return ""

# ── Extractor de email desde el website ──────────────────────────────────────

CONTACT_PATHS = ["/contact", "/contact-us", "/about", "/about-us", "/team", "/staff", "/reach-us"]

# Patrones de email que usan casi todos los negocios pequeños
EMAIL_PREFIXES = ["info", "contact", "hello", "office", "admin", "hola", "contacto"]

def domain_accepts_email(domain: str) -> bool:
    """Comprueba en < 3s si el dominio tiene servidor de email (registro MX o A)."""
    try:
        import subprocess
        r = subprocess.run(["dig", "+short", "+time=2", "MX", domain],
                          capture_output=True, text=True, timeout=4)
        if r.stdout.strip():
            return True
        # Fallback: si resuelve A record, probablemente tiene email
        socket.setdefaulttimeout(3)
        socket.gethostbyname(domain)
        return True
    except Exception:
        return False

def smtp_verify(email: str) -> bool:
    """Verifica si el email existe via SMTP handshake (sin enviar nada). ~60% fiable."""
    domain = email.split("@")[1]
    try:
        import subprocess
        mx_raw = subprocess.run(
            ["dig", "+short", "+time=2", "MX", domain],
            capture_output=True, text=True, timeout=4
        ).stdout.strip()
        if not mx_raw:
            return False
        # Tomar el MX de menor prioridad (número más bajo = preferido)
        mx_lines = [l for l in mx_raw.splitlines() if l.strip()]
        mx_host = sorted(mx_lines, key=lambda l: int(l.split()[0]) if l.split()[0].isdigit() else 99)[0].split()[-1].rstrip(".")
        with smtplib.SMTP(timeout=6) as s:
            s.connect(mx_host, 25)
            s.ehlo("adalawsuitcheck.com")
            s.mail("verify@adalawsuitcheck.com")
            code, _ = s.rcpt(email)
            return code == 250
    except Exception:
        return False

def guess_email(domain: str) -> str:
    """Prueba prefijos comunes en el dominio. Usa SMTP si es posible, MX como fallback."""
    if not domain_accepts_email(domain):
        return ""
    for prefix in EMAIL_PREFIXES:
        candidate = f"{prefix}@{domain}"
        if smtp_verify(candidate):
            return candidate
    # Si SMTP no funciona (servidor bloquea verificación), devolver info@ por defecto
    # — es el más universal para negocios pequeños
    return f"info@{domain}"

def extract_email(base_url: str) -> str:
    email_re = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")

    def _clean(candidate: str) -> str:
        """Devuelve el email si es válido, vacío si no."""
        domain = candidate.split("@")[1].lower()
        if domain in EMAIL_BLACKLIST:
            return ""
        if any(bad in domain for bad in ("example", "yourbrand", "sentry", "wix", "placeholder")):
            return ""
        return candidate

    def scrape(url: str) -> str:
        try:
            resp = requests.get(url, headers=BROWSER_HEADERS, timeout=8, allow_redirects=True)
            if resp.status_code != 200:
                return ""
            text = re.sub(r"<script[^>]*>.*?</script>", "", resp.text, flags=re.DOTALL)
            for candidate in email_re.findall(text):
                if clean := _clean(candidate):
                    return clean
        except Exception:
            pass
        return ""

    # 1. Página principal
    email = scrape(base_url)
    if email:
        return email

    # 2. Páginas de contacto / about / team
    parsed = urlparse(base_url)
    base = f"{parsed.scheme}://{parsed.netloc}"
    for path in CONTACT_PATHS:
        email = scrape(f"{base}{path}")
        if email:
            return email

    # 3. DuckDuckGo: buscar "@domain.com" en snippets
    domain = parsed.netloc.replace("www.", "")
    try:
        from ddgs import DDGS
        with DDGS() as d:
            for result in d.text(f'"@{domain}" contact email', max_results=5):
                for candidate in email_re.findall(result.get("body", "")):
                    if clean := _clean(candidate):
                        return clean
    except Exception:
        pass

    # 4. Email permutation: info@, contact@, hello@... + verificación SMTP/MX
    guessed = guess_email(domain)
    if guessed:
        return guessed

    return ""

# ── Scanner ADA (BeautifulSoup, sin llamar al edge function) ─────────────────

def scan_site(url: str) -> tuple[int, int, str, str]:
    try:
        resp = requests.get(url, headers=BROWSER_HEADERS, timeout=12, allow_redirects=True)
        if resp.status_code != 200:
            return 0, 0, f"HTTP {resp.status_code}", "en"
        if "text/html" not in resp.headers.get("content-type", ""):
            return 0, 0, "Not HTML", "en"
        lang = detect_language(resp.text)
        issues, critical, err = _count_issues(resp.text)
        return issues, critical, err, lang
    except requests.exceptions.Timeout:
        return 0, 0, "Timeout", "en"
    except requests.exceptions.ConnectionError:
        return 0, 0, "Connection error", "en"
    except Exception as e:
        return 0, 0, str(e)[:60], "en"

def detect_language(html: str) -> str:
    """Detecta idioma del sitio via atributo lang del HTML."""
    match = re.search(r'<html[^>]+lang=["\']([^"\']+)["\']', html, re.IGNORECASE)
    if match:
        lang = match.group(1).lower()
        if lang.startswith("es"):
            return "es"
    return "en"

def _count_issues(html: str) -> tuple[int, int, str]:
    try:
        soup = BeautifulSoup(html, "html.parser")
    except Exception as e:
        return 0, 0, f"Parse error: {e}"

    issues = 0
    critical = 0

    # 1. Imágenes sin alt text (WCAG 1.1.1)
    for img in soup.find_all("img"):
        if img.get("role") in ("presentation", "none"):
            continue
        if img.get("alt") is None and not img.get("aria-label"):
            issues += 1
            critical += 1

    # 2. Falta lang en <html> (WCAG 3.1.1)
    html_tag = soup.find("html")
    if html_tag and not html_tag.get("lang"):
        issues += 1

    # 3. Inputs sin label (WCAG 1.3.1)
    for inp in soup.find_all(["input", "textarea", "select"]):
        if inp.get("type") in ("hidden", "submit", "button", "reset", "image"):
            continue
        inp_id = inp.get("id")
        has_label = bool(soup.find("label", attrs={"for": inp_id})) if inp_id else False
        if not has_label and not inp.get("aria-label") and not inp.get("aria-labelledby"):
            issues += 1
            critical += 1

    # 4. Links con texto no descriptivo (WCAG 2.4.4)
    for a in soup.find_all("a", href=True):
        if a.get_text(strip=True).lower() in BAD_LINK_TEXTS:
            issues += 1

    # 5. Botones/links vacíos (WCAG 4.1.2)
    for el in soup.find_all(["button", "a"]):
        text = el.get_text(strip=True)
        has_aria = el.get("aria-label") or el.get("aria-labelledby")
        has_img_alt = any(i.get("alt", "").strip() for i in el.find_all("img"))
        if not text and not has_aria and not has_img_alt:
            issues += 1
            critical += 1

    # 6. Media con autoplay sin controls (WCAG 1.4.2)
    for media in soup.find_all(["video", "audio"]):
        if media.has_attr("autoplay") and not media.has_attr("controls"):
            issues += 1

    return issues, critical, ""

# ── Generador de email personalizado ─────────────────────────────────────────

def generate_email(biz: Business) -> dict:
    scan_link = f"{SITESAFE_URL}/scan?url={quote(biz.website, safe='')}"
    domain = urlparse(biz.website).netloc.replace("www.", "")
    es = biz.lang == "es"

    if biz.issues == 0 or biz.scan_error:
        if es:
            subject = f"Revisé {domain} — esto es lo que encontré"
            body = f"""Hola {biz.name},

Pasé por {domain} y quise dejarte saber cómo está tu sitio antes de que alguien más lo revise con malas intenciones.

En 2023 se presentaron 4,605 demandas ADA — el 67% contra pequeños negocios. Desde abril 2026 el cumplimiento es obligatorio por ley federal. Un acuerdo típico: $5,000–$20,000.

Tu reporte gratuito (qué revisar y cómo corregirlo):

    {scan_link}

Sin costo. Sin tarjeta. 30 segundos para revisarlo.

¿Esto es algo que tienes en tu lista de pendientes, o ya lo tienes cubierto?

Lily
SiteSafe · adalawsuitcheck.com"""
        else:
            subject = f"Checked {domain} — here's what I found"
            body = f"""Hi {biz.name},

I came across {domain} and wanted to give you a heads up before someone else does.

A small business gets hit with an ADA lawsuit every 2 hours in the US. The DOJ made compliance mandatory as of April 2026, and 67% of cases target businesses just like yours.

Your free report — what to look at and how to fix it:

    {scan_link}

Free. No credit card. Takes 30 seconds to review.

Is this something on your radar, or already taken care of?

Lily
SiteSafe · adalawsuitcheck.com"""
    else:
        if es:
            subject = f"Encontré {biz.issues} problemas en {domain} — aquí están los arreglos"
            body = f"""Hola {biz.name},

Pasé por {domain} y encontré {biz.issues} problemas de accesibilidad ADA — {biz.critical} de ellos son exactamente los que los demandantes buscan.

Un negocio pequeño recibe una demanda ADA cada 2 horas en EEUU. Solo defenderte cuesta $50,000 en promedio, aunque ganes.

Ya preparé tu reporte gratuito con cada arreglo escrito en español claro:

    {scan_link}

Sin desarrollador. La mayoría de los arreglos toma menos de 10 minutos.

¿Tienes a alguien encargado de tu sitio, o lo manejas tú mismo?

Lily
SiteSafe · adalawsuitcheck.com"""
        else:
            subject = f"Found {biz.issues} issues on {domain} — here are the fixes"
            body = f"""Hi {biz.name},

I came across {domain} and ran a quick ADA check. Found {biz.issues} issues — {biz.critical} of them are exactly what ADA lawsuit filers look for.

One small business gets hit with an ADA lawsuit every 2 hours in the US. Defense alone averages $50,000, even if you win.

I already put together your free report with every fix written out in plain English:

    {scan_link}

No developer needed. Most fixes take under 10 minutes.

Do you handle the website yourself, or is there someone on your team I should loop in?

Lily
SiteSafe · adalawsuitcheck.com"""
    return {"subject": subject, "body": body, "scan_url": scan_link}

# ── Envío via Resend (opcional) ───────────────────────────────────────────────

def send_email(to: str, subject: str, body: str) -> bool:
    if not RESEND_API_KEY or not FROM_EMAIL:
        return False
    try:
        resp = requests.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
            json={"from": f"{SENDER_NAME} <lily@adalawsuitcheck.com>", "reply_to": "codebake.SaaS@outlook.com", "to": to, "subject": subject, "text": body},
            timeout=10,
        )
        return resp.status_code in (200, 201)
    except Exception:
        return False

# ── Supabase REST helpers ─────────────────────────────────────────────────────


def _sb_headers() -> dict:
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }

def _sb_get(table: str, params: str = "") -> list:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return []
    try:
        r = requests.get(f"{SUPABASE_URL}/rest/v1/{table}?{params}",
                         headers=_sb_headers(), timeout=15)
        return r.json() if r.ok else []
    except Exception:
        return []

def _sb_upsert(table: str, data: dict) -> bool:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return False
    try:
        r = requests.post(
            f"{SUPABASE_URL}/rest/v1/{table}",
            headers={**_sb_headers(), "Prefer": "resolution=ignore-duplicates,return=minimal"},
            json=data, timeout=15,
        )
        return r.ok
    except Exception:
        return False

def upload_dashboard_html(html: str) -> str:
    """Uploads dashboard HTML to Supabase Storage. Returns the public URL."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return ""
    try:
        resp = requests.put(
            f"{SUPABASE_URL}/storage/v1/object/outreach/latest.html",
            headers={
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "text/html; charset=utf-8",
                "x-upsert": "true",
            },
            data=html.encode("utf-8"),
            timeout=30,
        )
        if resp.ok:
            return f"{SUPABASE_URL}/storage/v1/object/public/outreach/latest.html"
    except Exception as e:
        print(f"  Warning: dashboard upload failed: {e}")
    return ""

# ── Deduplication — permanent contacted log ───────────────────────────────────

def load_contacted() -> set[str]:
    """Loads already-contacted emails: Supabase first, local CSV as fallback."""
    rows = _sb_get("outreach_contacted", "select=email")
    if rows:
        cloud = {r["email"].lower() for r in rows if r.get("email")}
        print(f"  [Supabase] {len(cloud)} emails already contacted")
        return cloud
    if CONTACTED_LOG.exists():
        with open(CONTACTED_LOG, newline="", encoding="utf-8") as f:
            return {row["email"].lower() for row in csv.DictReader(f) if row.get("email")}
    return set()

def mark_contacted(email: str, biz_name: str, website: str, issues: int = 0) -> None:
    """Records email in Supabase (cloud) and local CSV as backup."""
    email_lower = email.lower()
    _sb_upsert("outreach_contacted", {
        "email": email_lower, "name": biz_name, "website": website, "issues": issues,
        "contacted_at": datetime.date.today().isoformat(),
    })
    try:
        OUTREACH_DIR.mkdir(parents=True, exist_ok=True)
        write_header = not CONTACTED_LOG.exists()
        with open(CONTACTED_LOG, "a", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=["date", "email", "name", "website"])
            if write_header:
                w.writeheader()
            w.writerow({"date": datetime.date.today().isoformat(),
                        "email": email_lower, "name": biz_name, "website": website})
    except Exception:
        pass

# ── Main ─────────────────────────────────────────────────────────────────────

def process_biz(biz: Business, already_contacted: set, results: list,
                args, sent_count: int) -> int:
    """Processes one business. Returns 1 if email was sent, 0 otherwise."""

    # 1. Find website (Yellow Pages sometimes includes it directly)
    if not biz.website:
        biz.website = find_website(biz.name, biz.city)
    if biz.website:
        print(f"  ✓ website: {biz.website}")
    else:
        print(f"  ✗ website not found — skip")
        return 0

    # 2. Email (scrape multiple pages + DuckDuckGo fallback)
    biz.email = extract_email(biz.website)
    if biz.email and biz.email.lower() in already_contacted:
        print(f"  ⟳ {biz.email} already contacted — skip")
        return 0
    print(f"  {'✓ email: ' + biz.email if biz.email else '✗ email not found'}")

    # 3. ADA scan
    biz.issues, biz.critical, biz.scan_error, biz.lang = scan_site(biz.website)
    if biz.scan_error:
        print(f"  ⚠ scan: {biz.scan_error}")
    else:
        lang_tag = " 🇪🇸 spanish site" if biz.lang == "es" else ""
        print(f"  → {biz.issues} issues ({biz.critical} critical){lang_tag}")

    # 4. Generate email
    email_data = generate_email(biz)
    row = {
        "name": biz.name, "website": biz.website, "email": biz.email,
        "phone": biz.phone, "issues": biz.issues, "critical": biz.critical,
        "scan_error": biz.scan_error,
        "scan_url": email_data["scan_url"], "subject": email_data["subject"],
        "body": email_data["body"], "status": "",
    }

    # 5. Send / preview
    newly_sent = 0
    if args.preview and biz.email:
        send_email("codebake.SaaS@outlook.com",
                   f"[PREVIEW] {email_data['subject']}",
                   f"--- PREVIEW for: {biz.email} ---\n\n{email_data['body']}")
        row["status"] = "preview_sent"
    elif args.send and biz.email:
        ok = send_email(biz.email, email_data["subject"], email_data["body"])
        row["status"] = "sent" if ok else "failed"
        if ok:
            newly_sent = 1
            mark_contacted(biz.email, biz.name, biz.website, biz.issues)
        time.sleep(2)
    elif not biz.email:
        row["status"] = "no_email"
    else:
        row["status"] = "ready"

    results.append(row)
    time.sleep(1)
    return newly_sent


def main():
    default_cat, default_city = _daily_defaults()
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", default=default_cat)
    parser.add_argument("--city", default=default_city)
    parser.add_argument("--target", type=int, default=20,
                        help="Target emails to send (keeps searching until reached)")
    parser.add_argument("--limit", type=int, default=0,
                        help="Fixed business limit (legacy mode, disables --target)")
    parser.add_argument("--output", default="outreach.csv")
    parser.add_argument("--send", action="store_true")
    parser.add_argument("--preview", action="store_true")
    args = parser.parse_args()

    already_contacted = load_contacted()
    results: list[dict] = []
    sent = 0
    checked = 0
    MAX_CHECKED = 200  # safety cap to prevent infinite runs

    # ── Legacy mode (explicit --limit) ───────────────────────────────────────
    if args.limit > 0:
        print(f"\nSearching: {args.category} in {args.city} (fixed limit {args.limit})\n")
        businesses = yelp_search(args.category, args.city, limit=args.limit)
        print(f"Yelp found {len(businesses)} businesses\n")
        for i, biz in enumerate(businesses, 1):
            print(f"[{i}/{len(businesses)}] {biz.name}")
            sent += process_biz(biz, already_contacted, results, args, sent)
    else:
        # ── Target mode: run until N emails sent ─────────────────────────────
        target = args.target
        print(f"\nDaily target: {target} emails")
        print(f"Sources: Yelp → Yellow Pages")
        print(f"Category: {args.category} | City: {args.city}\n")

        sources_exhausted = {"yelp": False, "yp": False}
        yelp_offset = 0
        yp_done = False

        while sent < target and checked < MAX_CHECKED:
            if not sources_exhausted["yelp"]:
                batch = yelp_search(args.category, args.city, limit=50, offset=yelp_offset)
                yelp_offset += 50
                if not batch:
                    sources_exhausted["yelp"] = True
                    print("  [Yelp exhausted — switching to Yellow Pages]\n")
                else:
                    for biz in batch:
                        if sent >= target or checked >= MAX_CHECKED:
                            break
                        checked += 1
                        print(f"[Yelp {checked}] {biz.name}")
                        sent += process_biz(biz, already_contacted, results, args, sent)
                        if sent >= target:
                            break
                    continue

            if not sources_exhausted["yp"] and not yp_done:
                print("\n[Searching Yellow Pages...]\n")
                yp_batch = yellowpages_search(args.category, args.city)
                yp_done = True
                if not yp_batch:
                    sources_exhausted["yp"] = True
                    print("  [Yellow Pages: no results]\n")
                else:
                    for biz in yp_batch:
                        if sent >= target or checked >= MAX_CHECKED:
                            break
                        checked += 1
                        print(f"[YP {checked}] {biz.name}")
                        sent += process_biz(biz, already_contacted, results, args, sent)
                continue

            print(f"\nSources exhausted. Sent: {sent}/{target}")
            break

        if sent >= target:
            print(f"\n✅ Target reached: {sent} emails sent.")
        elif checked >= MAX_CHECKED:
            print(f"\n⚠ Safety cap hit ({MAX_CHECKED} businesses checked). Sent: {sent}/{target}")

    # ── Save CSV ──────────────────────────────────────────────────────────────
    if not results:
        print("\nNo businesses found with a website.")
        return

    FIELDS = ["name","website","email","phone","issues","critical","scan_error",
              "scan_url","subject","body","status"]
    with open(args.output, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(results)

    with_email = sum(1 for r in results if r.get("email"))
    print(f"\n{'─'*50}")
    print(f"✓ {checked} businesses checked")
    print(f"✓ {with_email} with email found")
    print(f"✓ {sent} emails sent")
    print(f"✓ Saved to: {args.output}")

    # ── Generate and upload dashboard to Supabase Storage ────────────────────
    if SUPABASE_URL and SUPABASE_SERVICE_KEY:
        try:
            sys.path.insert(0, str(Path(__file__).parent))
            from generate_report import generate_html
            date_str = datetime.date.today().isoformat()
            html = generate_html(results, date_str, args.output, "", server_mode=False)
            url = upload_dashboard_html(html)
            if url:
                print(f"✓ Dashboard at: {url}")
        except Exception as e:
            print(f"  Warning: dashboard not uploaded: {e}")

if __name__ == "__main__":
    main()
