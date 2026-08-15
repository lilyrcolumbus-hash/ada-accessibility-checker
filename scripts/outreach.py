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

  # Partner outreach a agencias/freelancers web (pitch de comisión, no venta directa).
  # Guarda en outreach_agency_results / outreach_agency_runs — nunca toca las
  # tablas ni el dashboard del outreach a negocios.
  python3 scripts/outreach.py --audience agency --category "web design agency" --city "Austin, TX" --target 10 --send
"""

import os, csv, sys, time, re, json, argparse, requests, socket, smtplib, datetime
from urllib.parse import quote, urlparse
from dataclasses import dataclass
from pathlib import Path
from bs4 import BeautifulSoup

# ── Config ───────────────────────────────────────────────────────────────────

YELP_API_KEY        = os.environ.get("YELP_API_KEY", "")
RESEND_API_KEY      = os.environ.get("RESEND_API_KEY", "")
BREVO_API_KEY       = os.environ.get("BREVO_API_KEY", "")
SENDGRID_API_KEY    = os.environ.get("SENDGRID_API_KEY", "")
FROM_EMAIL          = os.environ.get("FROM_EMAIL", "lily@adalawsuitcheck.com")
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

# Agency/freelancer partner-outreach pool — used when --audience agency.
# These are the people who ALREADY built the website for the same small
# businesses SiteSafe targets, so a referral pitch to them borrows trust
# a cold pitch to the end business doesn't have.
AGENCY_CATEGORIES = [
    "web design agency", "web designer", "wordpress developer",
    "shopify expert", "digital marketing agency",
]

def _daily_defaults(categories: list[str] = CATEGORIES) -> tuple[str, str]:
    """Returns (category, city) based on day-of-year for automatic rotation."""
    day = int(datetime.date.today().strftime("%j"))
    return categories[day % len(categories)], CITIES[(day * 7) % len(CITIES)]

BROWSER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

EMAIL_BLACKLIST = {"example.com", "domain.com", "wixpress.com", "squarespace.com",
                   "shopify.com", "wordpress.com", "sentry.io", "googleapis.com"}

# TLDs that are actually file extensions — matched regex produces false emails like 700x400@2x.jpg
FILE_EXT_TLDS = frozenset({
    "jpg", "jpeg", "png", "gif", "svg", "webp", "ico", "bmp", "tiff",
    "css", "js", "ts", "json", "xml", "txt", "csv", "pdf", "zip",
    "mp4", "mov", "avi", "mp3", "wav", "woff", "woff2", "ttf", "eot",
    "2x", "1x", "3x",
})

# Personal email providers — valid for small business owners
PERSONAL_EMAIL_DOMAINS = frozenset({
    "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com",
    "aol.com", "protonmail.com", "live.com", "msn.com", "me.com",
})

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

    parsed_base = urlparse(base_url)
    site_domain = parsed_base.netloc.lower().replace("www.", "")  # e.g. "fairmont.com"
    # Root label before TLD: "fairmont" from "fairmont.com", "milkandhoney" from "milkandhoneyspa.com"
    site_root = site_domain.rsplit(".", 1)[0].split(".")[-1] if site_domain else ""

    def _score(candidate: str) -> int:
        """
        2 = email domain matches or is related to the business website (best)
        1 = personal email (gmail/yahoo/outlook — valid for small business owners)
        0 = unrelated business domain (skip)
        -1 = invalid (file extension TLD, blacklisted, noreply, etc.)
        """
        lower = candidate.lower()
        if "@" not in lower:
            return -1
        local, domain = lower.split("@", 1)

        # Reject file-extension TLDs — catches "700x400@2x.jpg" etc.
        tld = domain.rsplit(".", 1)[-1]
        if tld in FILE_EXT_TLDS:
            return -1

        if domain in EMAIL_BLACKLIST:
            return -1
        if any(bad in domain for bad in ("example", "yourbrand", "sentry", "wix", "placeholder")):
            return -1
        if "noreply" in local or "no-reply" in local or "donotreply" in local:
            return -1

        # Personal email (gmail, yahoo, etc.) — valid for small biz owners
        if domain in PERSONAL_EMAIL_DOMAINS:
            return 1

        # Domain matches the business website
        email_domain_root = domain.rsplit(".", 1)[0].split(".")[-1]
        if domain == site_domain:
            return 2  # exact match
        if domain.endswith("." + site_domain) or site_domain.endswith("." + domain):
            return 2  # subdomain relationship
        if site_root and email_domain_root == site_root:
            return 2  # same registrable root (e.g. salon.com / salonaustin.com — wait, roots differ; this mainly catches spa.com/spa-seattle.com)

        # Unrelated business domain — likely a CDN, analytics, or embedded service widget
        return 0

    def scrape(url: str) -> list[tuple[int, str]]:
        """Returns scored (score, email) candidates, score >= 1 only."""
        try:
            resp = requests.get(url, headers=BROWSER_HEADERS, timeout=8, allow_redirects=True)
            if resp.status_code != 200:
                return []
            # Strip <script> blocks before scanning — most CDN/service emails live there
            text = re.sub(r"<script[^>]*>.*?</script>", "", resp.text, flags=re.DOTALL)
            seen: set[str] = set()
            results: list[tuple[int, str]] = []
            for candidate in email_re.findall(text):
                norm = candidate.lower()
                if norm in seen:
                    continue
                seen.add(norm)
                s = _score(candidate)
                if s >= 1:
                    results.append((s, candidate))
            return results
        except Exception:
            return []

    def _best(candidates: list[tuple[int, str]]) -> str:
        if not candidates:
            return ""
        return max(candidates, key=lambda x: x[0])[1]

    all_candidates: list[tuple[int, str]] = []

    # 1. Página principal
    all_candidates.extend(scrape(base_url))
    if any(s >= 2 for s, _ in all_candidates):
        return _best([(s, e) for s, e in all_candidates if s >= 2])

    # 2. Páginas de contacto / about / team
    parsed = urlparse(base_url)
    base = f"{parsed.scheme}://{parsed.netloc}"
    for path in CONTACT_PATHS:
        all_candidates.extend(scrape(f"{base}{path}"))
        if any(s >= 2 for s, _ in all_candidates):
            return _best([(s, e) for s, e in all_candidates if s >= 2])

    # Check personal emails collected so far before trying DuckDuckGo
    personal = [(s, e) for s, e in all_candidates if s == 1]
    if personal:
        return _best(personal)

    # 3. DuckDuckGo: buscar "@domain.com" en snippets
    domain = parsed.netloc.replace("www.", "")
    try:
        from ddgs import DDGS
        with DDGS() as d:
            for result in d.text(f'"@{domain}" contact email', max_results=5):
                for candidate in email_re.findall(result.get("body", "")):
                    s = _score(candidate)
                    if s >= 1:
                        all_candidates.append((s, candidate))
    except Exception:
        pass

    if all_candidates:
        domain_match = [(s, e) for s, e in all_candidates if s >= 2]
        if domain_match:
            return _best(domain_match)
        personal = [(s, e) for s, e in all_candidates if s == 1]
        if personal:
            return _best(personal)

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

def generate_partner_email(biz: Business) -> dict:
    """
    Partner pitch for web design agencies / freelancers — NOT the direct-sale
    pitch used for end businesses. These people already have the trust of the
    same small-business clients SiteSafe targets, so the offer is a referral
    commission, not a fix-your-site sale.

    Deliberately does NOT promise a live tracking link or an automated payout
    system — that infrastructure doesn't exist yet. This is a demand-validation
    message: does anyone reply at all? Building tracking is only worth it once
    that's confirmed. Never promise a mechanism you can't yet deliver.
    """
    domain = urlparse(biz.website).netloc.replace("www.", "") if biz.website else ""
    es = biz.lang == "es"

    if es:
        subject = f"Idea para tus clientes de {domain or biz.name}"
        body = f"""Hola,

Vi que ustedes diseñan sitios para negocios chicos — justo el público al que hoy se le exige cumplir con accesibilidad ADA/WCAG. La mayoría de esos sitios no cumple, y suele salir caro para el dueño cuando se vuelve un problema real.

Armé SiteSafe (adalawsuitcheck.com): escanea el sitio, marca los problemas y da el arreglo en español simple, algo que puede aplicar alguien sin ser desarrollador.

Te propongo ofrecérselo a tus clientes con tu marca por delante — vos ya tenés su confianza — y compartir contigo lo que genere cada uno que se sume. Sin trabajo extra de tu parte, solo compartir un link.

¿Te interesa? Respondeme y te paso los detalles.

Lily
SiteSafe · adalawsuitcheck.com"""
    else:
        subject = f"Idea for your {domain or biz.name} clients"
        body = f"""Hi,

I noticed you build websites for small businesses — exactly the audience that's now expected to meet ADA/WCAG accessibility standards. Most of those sites don't, and it tends to turn into a costly problem for the owner later on.

I built SiteSafe (adalawsuitcheck.com) — it scans a site, flags the issues, and hands over a plain-English fix, something a non-developer can apply.

I'd like to offer it to your clients through you, since they already trust you, and share the upside with you for every one who signs up. No extra work on your end beyond passing along a link.

Interested? Reply and I'll send the details.

Lily
SiteSafe · adalawsuitcheck.com"""
    return {"subject": subject, "body": body, "scan_url": f"{SITESAFE_URL}"}

# ── Envío de email — Plan A: Resend / Plan B: Brevo / Plan C: SendGrid ───────

UNSUBSCRIBE_HEADERS = {
    "List-Unsubscribe": "<mailto:codebake.SaaS@outlook.com?subject=unsubscribe>",
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
}

def _try_resend(to: str, subject: str, body: str) -> tuple[bool, str | None]:
    if not RESEND_API_KEY:
        return False, None
    try:
        resp = requests.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
            json={
                "from": f"{SENDER_NAME} <{FROM_EMAIL}>",
                "reply_to": "codebake.SaaS@outlook.com",
                "to": to, "subject": subject, "text": body,
                "headers": UNSUBSCRIBE_HEADERS,
            },
            timeout=10,
        )
        if resp.status_code in (200, 201):
            return True, resp.json().get("id")
        print(f"  ✗ Resend {resp.status_code}: {resp.text[:150]}")
        return False, None
    except Exception as e:
        print(f"  ✗ Resend exception: {e}")
        return False, None

def _try_brevo(to: str, subject: str, body: str) -> tuple[bool, str | None]:
    if not BREVO_API_KEY:
        return False, None
    try:
        resp = requests.post(
            "https://api.brevo.com/v3/smtp/email",
            headers={"api-key": BREVO_API_KEY, "Content-Type": "application/json"},
            json={
                "sender": {"name": SENDER_NAME, "email": FROM_EMAIL},
                "replyTo": {"email": "codebake.SaaS@outlook.com"},
                "to": [{"email": to}],
                "subject": subject,
                "textContent": body,
                "headers": UNSUBSCRIBE_HEADERS,
            },
            timeout=10,
        )
        if resp.status_code in (200, 201):
            data = resp.json()
            msg_id = data.get("messageId") or (data.get("messageIds") or [None])[0]
            return True, msg_id
        print(f"  ✗ Brevo {resp.status_code}: {resp.text[:150]}")
        return False, None
    except Exception as e:
        print(f"  ✗ Brevo exception: {e}")
        return False, None

def _try_sendgrid(to: str, subject: str, body: str) -> tuple[bool, str | None]:
    if not SENDGRID_API_KEY:
        return False, None
    try:
        resp = requests.post(
            "https://api.sendgrid.com/v3/mail/send",
            headers={"Authorization": f"Bearer {SENDGRID_API_KEY}", "Content-Type": "application/json"},
            json={
                "personalizations": [{"to": [{"email": to}]}],
                "from": {"email": FROM_EMAIL, "name": SENDER_NAME},
                "reply_to": {"email": "codebake.SaaS@outlook.com"},
                "subject": subject,
                "content": [{"type": "text/plain", "value": body}],
                "headers": UNSUBSCRIBE_HEADERS,
            },
            timeout=10,
        )
        if resp.status_code == 202:
            # SendGrid returns the message id in a response header, e.g. "<id>.filterdrecv-xxx"
            msg_id = resp.headers.get("X-Message-Id")
            return True, msg_id
        print(f"  ✗ SendGrid {resp.status_code}: {resp.text[:150]}")
        return False, None
    except Exception as e:
        print(f"  ✗ SendGrid exception: {e}")
        return False, None

def send_email(to: str, subject: str, body: str) -> tuple[bool, str | None, str | None]:
    """
    Intenta enviar en cascada: Resend → Brevo → SendGrid.
    Usa el primero que tenga API key configurada y responda OK.
    Devuelve (exito, proveedor_usado, id_del_mensaje_en_ese_proveedor).
    """
    providers = [
        ("Resend",   _try_resend),
        ("Brevo",    _try_brevo),
        ("SendGrid", _try_sendgrid),
    ]
    for name, fn in providers:
        ok, msg_id = fn(to, subject, body)
        if ok:
            print(f"  ✓ Sent via {name}")
            return True, name, msg_id
        # Si falla, intenta el siguiente automáticamente
    print("  ✗ All email providers failed")
    return False, None, None

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

def _sb_patch(table: str, params: str, data: dict) -> bool:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return False
    try:
        r = requests.patch(
            f"{SUPABASE_URL}/rest/v1/{table}?{params}",
            headers={**_sb_headers(), "Prefer": "return=minimal"},
            json=data, timeout=15,
        )
        return r.ok
    except Exception:
        return False

# ── Verificación real de entrega contra cada proveedor ───────────────────────

def _check_resend_status(message_id: str) -> str | None:
    try:
        r = requests.get(f"https://api.resend.com/emails/{message_id}",
                          headers={"Authorization": f"Bearer {RESEND_API_KEY}"}, timeout=10)
        if r.ok:
            return r.json().get("last_event")
    except Exception:
        pass
    return None

_BREVO_EVENT_PRIORITY = {
    # higher number wins when a message has multiple events
    "hardBounces": 5, "softBounces": 5, "bounces": 5, "blocked": 5, "invalid": 5, "error": 5,
    "spam": 4, "complaints": 4,
    "deferred": 3,
    "delivered": 2, "opened": 2, "clicks": 2, "uniqueOpened": 2, "unsubscribed": 2,
    "requests": 1,
}
_BREVO_EVENT_TO_STATUS = {
    "hardBounces": "bounced", "softBounces": "bounced", "bounces": "bounced",
    "blocked": "suppressed", "invalid": "suppressed", "error": "bounced",
    "spam": "complained", "complaints": "complained",
    "deferred": "delivery_delayed",
    "delivered": "delivered", "opened": "delivered", "clicks": "delivered", "uniqueOpened": "delivered",
    "unsubscribed": "delivered",
}

def _fetch_brevo_events_for_date(run_date: str) -> dict:
    """
    Brevo's events endpoint does NOT support filtering by messageId server-side
    (confirmed empirically — the messageId query param is silently ignored).
    Fetch all events for the day once and index them by messageId instead.
    """
    events_by_msg: dict[str, str] = {}
    try:
        r = requests.get("https://api.brevo.com/v3/smtp/statistics/events",
                          headers={"api-key": BREVO_API_KEY},
                          params={"startDate": run_date, "endDate": run_date, "limit": 500, "sort": "desc"},
                          timeout=15)
        if not r.ok:
            return events_by_msg
        for e in r.json().get("events") or []:
            msg_id, event = e.get("messageId"), e.get("event")
            if not msg_id or event not in _BREVO_EVENT_PRIORITY:
                continue
            prev = events_by_msg.get(msg_id)
            if not prev or _BREVO_EVENT_PRIORITY[event] > _BREVO_EVENT_PRIORITY.get(prev, 0):
                events_by_msg[msg_id] = event
    except Exception:
        pass
    return {k: _BREVO_EVENT_TO_STATUS.get(v, v) for k, v in events_by_msg.items()}

def _check_sendgrid_status(message_id: str) -> str | None:
    # Implemented per SendGrid's documented Email Activity API. In manual testing
    # (2026-07-10) this account's /v3/messages returned an empty result even 40s+
    # after a confirmed 202-accepted send — likely Email Activity isn't enabled on
    # this plan. SendGrid is the last fallback in the cascade, so this only matters
    # when both Resend and Brevo fail; leaving it in place in case the account gets
    # Activity access later. Returns None (delivery_status stays "pending") if empty.
    try:
        r = requests.get("https://api.sendgrid.com/v3/messages",
                          headers={"Authorization": f"Bearer {SENDGRID_API_KEY}"},
                          params={"query": f'msg_id="{message_id}"'}, timeout=10)
        if r.ok:
            msgs = r.json().get("messages") or []
            if msgs:
                return msgs[0].get("status")
    except Exception:
        pass
    return None

def verify_deliveries(run_date: str, results_table: str = "outreach_results",
                       runs_table: str = "outreach_runs") -> None:
    """
    Consulta a cada proveedor real (Resend/Brevo/SendGrid) el estado de entrega
    de cada correo enviado hoy, usando el provider_message_id guardado al enviar.
    Actualiza delivery_status en Supabase con el dato verificado — ya no con lo
    que el script asumió, sino con lo que la plataforma confirma.
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return
    rows = _sb_get(results_table,
                    f"select=id,provider,provider_message_id&run_date=eq.{run_date}"
                    f"&status=eq.sent&provider_message_id=not.is.null")
    if not rows:
        return
    print(f"\n[Verifying delivery status for {len(rows)} sent emails...]")
    brevo_events = _fetch_brevo_events_for_date(run_date) if any(r.get("provider") == "Brevo" for r in rows) else {}
    verified = 0
    delivered_count = 0
    for row in rows:
        provider, msg_id = row.get("provider"), row["provider_message_id"]
        if provider == "Resend":
            status = _check_resend_status(msg_id)
        elif provider == "Brevo":
            status = brevo_events.get(msg_id)
        elif provider == "SendGrid":
            status = _check_sendgrid_status(msg_id)
        else:
            status = None
        if status:
            _sb_patch(results_table, f"id=eq.{row['id']}", {"delivery_status": status})
            verified += 1
            if status == "delivered":
                delivered_count += 1
    print(f"[Verified {verified}/{len(rows)} — {delivered_count} confirmed delivered]")
    _sb_patch(runs_table, f"run_date=eq.{run_date}", {"delivered": delivered_count})

FINAL_DELIVERY_STATUSES = ("delivered", "bounced", "suppressed", "complained")

def reverify_stale_deliveries(days_back: int = 7, results_table: str = "outreach_results",
                               runs_table: str = "outreach_runs") -> None:
    """
    Re-checks delivery_status for rows a previous run left in a NON-final state
    (still 'sent', or 'delivery_delayed') — verify_deliveries() only waits ~20s
    after sending, which is often too soon for Resend/Brevo/SendGrid to have
    resolved a message's real fate. Once that one-shot check writes a
    transient snapshot, nothing ever asked again — so those rows could stay
    stuck showing a stale status forever. This re-checks up to `days_back` of
    history (real time has passed since those sends, so providers usually
    have a final answer by now) and updates outreach_runs.delivered for any
    day whose confirmed count changed as a result.
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return
    cutoff = (datetime.date.today() - datetime.timedelta(days=days_back)).isoformat()
    final_list = ",".join(FINAL_DELIVERY_STATUSES)
    rows = _sb_get(
        results_table,
        f"select=id,run_date,provider,provider_message_id,delivery_status"
        f"&status=eq.sent&provider_message_id=not.is.null&run_date=gte.{cutoff}"
        f"&delivery_status=not.in.({final_list})",
    )
    if not rows:
        return
    print(f"\n[Re-verifying {len(rows)} stale delivery statuses from the last {days_back} days...]")

    brevo_dates = {r["run_date"] for r in rows if r.get("provider") == "Brevo"}
    brevo_events_by_date = {d: _fetch_brevo_events_for_date(d) for d in brevo_dates}

    updated = 0
    affected_dates = set()
    for row in rows:
        provider, msg_id = row.get("provider"), row["provider_message_id"]
        if provider == "Resend":
            status = _check_resend_status(msg_id)
        elif provider == "Brevo":
            status = brevo_events_by_date.get(row["run_date"], {}).get(msg_id)
        elif provider == "SendGrid":
            status = _check_sendgrid_status(msg_id)
        else:
            status = None
        if status and status != row.get("delivery_status"):
            _sb_patch(results_table, f"id=eq.{row['id']}", {"delivery_status": status})
            updated += 1
            affected_dates.add(row["run_date"])

    print(f"[Re-verify] {updated}/{len(rows)} statuses changed")
    for run_date in sorted(affected_dates):
        delivered = _count_delivered(run_date, results_table)
        _sb_patch(runs_table, f"run_date=eq.{run_date}", {"delivered": delivered})
        print(f"[Re-verify] {run_date}: delivered now {delivered}")

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
                args, sent_count: int, results_table: str = "outreach_results") -> int:
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

    # 4. Generate email — partner pitch for agencies, direct-sale pitch for businesses
    email_data = generate_partner_email(biz) if args.audience == "agency" else generate_email(biz)
    row = {
        "name": biz.name, "website": biz.website, "email": biz.email,
        "phone": biz.phone, "issues": biz.issues, "critical": biz.critical,
        "scan_error": biz.scan_error,
        "scan_url": email_data["scan_url"], "subject": email_data["subject"],
        "body": email_data["body"], "status": "",
    }

    # 5. Send / preview
    newly_sent = 0
    provider = None
    provider_message_id = None
    if args.preview and biz.email:
        ok, _, _ = send_email("codebake.SaaS@outlook.com",
                   f"[PREVIEW] {email_data['subject']}",
                   f"--- PREVIEW for: {biz.email} ---\n\n{email_data['body']}")
        row["status"] = "preview_sent"
        if ok:
            newly_sent = 1
    elif args.send and biz.email:
        ok, provider, provider_message_id = send_email(biz.email, email_data["subject"], email_data["body"])
        row["status"] = "sent" if ok else "failed"
        if ok:
            newly_sent = 1
            mark_contacted(biz.email, biz.name, biz.website, biz.issues)
        time.sleep(2)
    elif not biz.email:
        row["status"] = "no_email"
    else:
        row["status"] = "ready"

    # Save to Supabase immediately — dashboard updates in real-time
    if row["status"] in ("sent", "preview_sent", "failed"):
        _sb_upsert(results_table, {
            "run_date": datetime.date.today().isoformat(),
            "name": row.get("name",""), "website": row.get("website",""),
            "email": row.get("email",""), "phone": row.get("phone",""),
            "issues": int(row.get("issues") or 0), "critical": int(row.get("critical") or 0),
            "scan_error": row.get("scan_error",""), "scan_url": row.get("scan_url",""),
            "subject": row.get("subject",""), "body": row.get("body",""),
            "status": row["status"],
            "provider": provider,
            "provider_message_id": provider_message_id,
            "delivery_status": "pending" if row["status"] == "sent" else row["status"],
        })

    results.append(row)
    time.sleep(1)
    return newly_sent


def _count_delivered(run_date: str, results_table: str = "outreach_results") -> int:
    rows = _sb_get(results_table, f"select=id&run_date=eq.{run_date}&delivery_status=eq.delivered")
    return len(rows)


def _search_and_send(category: str, city: str, args, already_contacted: set,
                      results: list, state: dict, want: int, max_checked: int,
                      results_table: str = "outreach_results") -> int:
    """
    Sends up to `want` NEWLY-accepted emails (Yelp first, then Yellow Pages once
    exhausted), continuing from wherever `state` left off on the previous call —
    so calling this again for a top-up round doesn't re-search from scratch.
    Mutates `state` and `results` in place. Returns how many were newly accepted.
    """
    got = 0
    while got < want and state["checked"] < max_checked:
        if not state["exhausted"]["yelp"]:
            batch = yelp_search(category, city, limit=50, offset=state["yelp_offset"])
            state["yelp_offset"] += 50
            if not batch:
                state["exhausted"]["yelp"] = True
                print("  [Yelp exhausted — switching to Yellow Pages]\n")
            else:
                for biz in batch:
                    if got >= want or state["checked"] >= max_checked:
                        break
                    state["checked"] += 1
                    print(f"[Yelp {state['checked']}] {biz.name}")
                    got += process_biz(biz, already_contacted, results, args, state["checked"], results_table)
                continue

        if not state["exhausted"]["yp"] and not state["yp_done"]:
            print("\n[Searching Yellow Pages...]\n")
            yp_batch = yellowpages_search(category, city)
            state["yp_done"] = True
            if not yp_batch:
                state["exhausted"]["yp"] = True
                print("  [Yellow Pages: no results]\n")
            else:
                for biz in yp_batch:
                    if got >= want or state["checked"] >= max_checked:
                        break
                    state["checked"] += 1
                    print(f"[YP {state['checked']}] {biz.name}")
                    got += process_biz(biz, already_contacted, results, args, state["checked"], results_table)
            continue

        print(f"\n[Sources exhausted — {state['checked']} businesses checked this run]")
        break
    return got


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--audience", choices=["business", "agency"], default="business",
                        help="business = direct pitch to end businesses (default, unchanged). "
                             "agency = partner/referral pitch to web design agencies & freelancers, "
                             "tracked in separate outreach_agency_* tables so it never mixes into "
                             "the business outreach KPIs.")
    parser.add_argument("--category", default=None)
    parser.add_argument("--city", default=None)
    parser.add_argument("--target", type=int, default=20,
                        help="Target emails to send (keeps searching until reached)")
    parser.add_argument("--limit", type=int, default=0,
                        help="Fixed business limit (legacy mode, disables --target)")
    parser.add_argument("--output", default="outreach.csv")
    parser.add_argument("--send", action="store_true")
    parser.add_argument("--preview", action="store_true")
    args = parser.parse_args()

    # Defaults depend on --audience, so they're resolved after parsing rather
    # than baked into argparse's `default=` (which would need audience first).
    if args.category is None or args.city is None:
        pool = AGENCY_CATEGORIES if args.audience == "agency" else CATEGORIES
        default_cat, default_city = _daily_defaults(pool)
        args.category = args.category or default_cat
        args.city = args.city or default_city

    RESULTS_TABLE = "outreach_results" if args.audience == "business" else "outreach_agency_results"
    RUNS_TABLE = "outreach_runs" if args.audience == "business" else "outreach_agency_runs"

    if args.send:
        reverify_stale_deliveries(results_table=RESULTS_TABLE, runs_table=RUNS_TABLE)

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
            sent += process_biz(biz, already_contacted, results, args, sent, RESULTS_TABLE)
    elif not args.send:
        # Preview mode doesn't send real mail, so "delivered" has no meaning —
        # keep the old accepted-count behavior.
        target = args.target
        print(f"\nPreview target: {target} emails")
        state = {"exhausted": {"yelp": False, "yp": False}, "yelp_offset": 0, "yp_done": False, "checked": 0}
        sent = _search_and_send(args.category, args.city, args, already_contacted, results, state, target, MAX_CHECKED, RESULTS_TABLE)
        checked = state["checked"]
    else:
        # ── Target mode: keep sending — across Resend/Brevo/SendGrid and new
        # businesses — until N emails are CONFIRMED DELIVERED, not just accepted
        # by a provider. A provider accepting a send doesn't mean it arrives:
        # bounces/delays/suppressions only resolve minutes later, after the
        # instant provider-cascade fallback has already moved on. So instead of
        # stopping at "accepted", we verify real delivery after each batch and,
        # if short of target, search for more businesses to make up the gap.
        target = args.target
        today_str = datetime.date.today().isoformat()
        print(f"\nDaily target: {target} CONFIRMED DELIVERED emails")
        print(f"Sources: Yelp → Yellow Pages")
        print(f"Category: {args.category} | City: {args.city}\n")

        state = {"exhausted": {"yelp": False, "yp": False}, "yelp_offset": 0, "yp_done": False, "checked": 0}
        delivered = 0
        MAX_ROUNDS = 5
        round_num = 0

        while delivered < target and state["checked"] < MAX_CHECKED and round_num < MAX_ROUNDS:
            round_num += 1
            shortfall = target - delivered
            print(f"\n=== Round {round_num}: need {shortfall} more delivered (confirmed so far: {delivered}/{target}) ===")
            got = _search_and_send(args.category, args.city, args, already_contacted, results, state, shortfall, MAX_CHECKED, RESULTS_TABLE)
            if got == 0:
                print("  No more businesses available — stopping.")
                break

            print(f"\n[Round {round_num}] Waiting to verify real delivery status...")
            time.sleep(20)
            verify_deliveries(today_str, RESULTS_TABLE, RUNS_TABLE)
            delivered = _count_delivered(today_str, RESULTS_TABLE)
            print(f"[Round {round_num}] Confirmed delivered so far: {delivered}/{target}")

        sent = sum(1 for r in results if r.get("status") == "sent")
        checked = state["checked"]

        if delivered >= target:
            print(f"\n✅ Real target reached: {delivered} confirmed delivered ({sent} accepted total, {round_num} round(s)).")
        elif checked >= MAX_CHECKED:
            print(f"\n⚠ Safety cap hit ({MAX_CHECKED} businesses checked). Delivered: {delivered}/{target}")
        elif round_num >= MAX_ROUNDS:
            print(f"\n⚠ Round cap hit ({MAX_ROUNDS} rounds). Delivered: {delivered}/{target} — some emails may still be verifying.")

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

    # (per-email results are already saved to Supabase inline in process_biz())

    # ── Save run summary to Supabase ──────────────────────────────────────────
    failed_count = sum(1 for r in results if r.get("status") == "failed")
    _sb_upsert(RUNS_TABLE, {
        "run_date": datetime.date.today().isoformat(),
        "category": args.category,
        "city": args.city,
        "processed": checked,
        "with_email": with_email,
        "sent": sent,
        "failed": failed_count,
    })

    # ── Verify real delivery status with each provider ──────────────────────
    time.sleep(15)  # give providers a moment to register delivery/bounce events
    verify_deliveries(datetime.date.today().isoformat(), RESULTS_TABLE, RUNS_TABLE)

    # ── Generate and upload dashboard to Supabase Storage ────────────────────
    # Business-audience only: this uploads to a FIXED path (outreach/latest.html)
    # that IS the live business outreach dashboard. Agency runs must never touch
    # it — overwriting it with agency-only data would corrupt the daily numbers
    # you actually check. Agency results live only in outreach_agency_* tables
    # for now (query directly; no dashboard tab built yet).
    if args.audience == "business" and SUPABASE_URL and SUPABASE_SERVICE_KEY:
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
