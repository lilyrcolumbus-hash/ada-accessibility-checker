#!/bin/bash
# SiteSafe — Preview Runner (8:30am)
# Escanea negocios y genera dashboard HTML sin enviar nada.
# También te manda un email resumen a tu Outlook para verlo en el móvil.

set -euo pipefail
source /Users/ld/.zshenv 2>/dev/null || true

OUTREACH_DIR="/Users/ld/Desktop/SiteSafe-Outreach"
DATE=$(date +%Y-%m-%d)
CSV="$OUTREACH_DIR/${DATE}-preview.csv"
LOG="$OUTREACH_DIR/${DATE}-preview.log"

CATEGORIES=("restaurant" "dental office" "hotel" "law firm" "physical therapy" "salon" "optometry" "chiropractor" "veterinary" "auto repair")
CITIES=("Miami, FL" "Chicago, IL" "Dallas, TX" "Atlanta, GA" "Phoenix, AZ" "Philadelphia, PA" "San Antonio, TX" "Austin, TX" "Charlotte, NC" "Seattle, WA")

DAY_NUM=$(date +%j)
CAT_IDX=$((DAY_NUM % ${#CATEGORIES[@]}))
CITY_IDX=$(( (DAY_NUM / ${#CATEGORIES[@]}) % ${#CITIES[@]} ))

CATEGORY="${CATEGORIES[$CAT_IDX]}"
CITY="${CITIES[$CITY_IDX]}"

echo "=== PREVIEW 8:30am — $DATE ===" | tee "$LOG"
echo "Categoría: $CATEGORY | Ciudad: $CITY" | tee -a "$LOG"

cd /Users/ld/ada-accessibility-checker

# Escanear sin enviar
python3 scripts/outreach.py \
    --category "$CATEGORY" \
    --city "$CITY" \
    --limit 25 \
    --output "$CSV" 2>&1 | tee -a "$LOG"

# Generar dashboard HTML y abrir en browser
python3 scripts/generate_report.py "$CSV" --open 2>&1 | tee -a "$LOG"

# Email resumen a tu Outlook (para verlo en móvil)
python3 - <<PYEOF
import csv, os, requests
from pathlib import Path

csv_path = "$CSV"
rows = list(csv.DictReader(open(csv_path, encoding="utf-8")))
with_email = [r for r in rows if r.get("email")]
hot = [r for r in with_email if int(r.get("issues") or 0) >= 10]
warm = [r for r in with_email if 4 <= int(r.get("issues") or 0) < 10]

lines = [
    f"📊 Preview de hoy — {len(rows)} negocios escaneados",
    f"📧 Con email: {len(with_email)}",
    f"🔥 HOT leads (10+ issues): {len(hot)}",
    f"🟠 WARM leads (4-9 issues): {len(warm)}",
    "",
    "🔥 HOT LEADS:",
]
for r in hot:
    lines.append(f"  • {r['name']} — {r['issues']} issues — {r['email']}")
    lines.append(f"    {r['scan_url']}")

lines += ["", "🟠 WARM LEADS:"]
for r in warm:
    lines.append(f"  • {r['name']} — {r['issues']} issues — {r['email']}")

lines += ["", "Los emails se enviarán a las 9am.", "— SiteSafe Outreach System"]

api_key = os.environ.get("RESEND_API_KEY", "")
if api_key:
    resp = requests.post(
        "https://api.resend.com/emails",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "from": "Lily from SiteSafe <lily@adalawsuitcheck.com>",
            "to": "codebake.SaaS@outlook.com",
            "subject": f"📋 Preview outreach {len(with_email)} leads — $CATEGORY · $CITY",
            "text": "\n".join(lines),
        },
        timeout=10,
    )
    print(f"Email resumen enviado: {resp.status_code}")
PYEOF

# Notificación Mac
WITH_EMAIL=$(python3 -c "import csv; rows=list(csv.DictReader(open('$CSV'))); print(sum(1 for r in rows if r.get('email')))" 2>/dev/null || echo "?")
osascript -e "display notification \"Preview listo: $WITH_EMAIL leads · Los emails salen a las 9am\" with title \"SiteSafe Preview ☕\" sound name \"Glass\""
