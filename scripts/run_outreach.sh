#!/bin/bash
# SiteSafe — Daily Outreach Runner
# Corre automáticamente a las 9am L-V via LaunchAgent
# Output: ~/Desktop/SiteSafe-Outreach/YYYY-MM-DD.csv + .log

set -euo pipefail

# Cargar env vars (YELP_API_KEY, RESEND_API_KEY, FROM_EMAIL)
source /Users/ld/.zshenv 2>/dev/null || true

OUTREACH_DIR="/Users/ld/Desktop/SiteSafe-Outreach"
DATE=$(date +%Y-%m-%d)
CSV="$OUTREACH_DIR/$DATE.csv"
LOG="$OUTREACH_DIR/$DATE.log"

# 25 categorías × 30 ciudades = 750 combos únicos (~2 años sin repetir)
CATEGORIES=(
  "restaurant" "dental office" "hotel" "law firm" "physical therapy"
  "salon" "optometry" "chiropractor" "veterinary" "auto repair"
  "spa" "gym" "pharmacy" "real estate" "accounting"
  "insurance" "florist" "jewelry store" "clothing store" "bakery"
  "coffee shop" "urgent care" "pediatrician" "dermatologist" "wedding venue"
)
CITIES=(
  "Miami, FL" "Chicago, IL" "Dallas, TX" "Atlanta, GA" "Phoenix, AZ"
  "Philadelphia, PA" "San Antonio, TX" "Austin, TX" "Charlotte, NC" "Seattle, WA"
  "Los Angeles, CA" "Houston, TX" "San Diego, CA" "Denver, CO" "Nashville, TN"
  "Portland, OR" "Las Vegas, NV" "Boston, MA" "Orlando, FL" "Minneapolis, MN"
  "Detroit, MI" "Baltimore, MD" "Sacramento, CA" "Kansas City, MO" "Tampa, FL"
  "Indianapolis, IN" "Columbus, OH" "Raleigh, NC" "Salt Lake City, UT" "New Orleans, LA"
)

# Elegir categoría y ciudad según el día del año (rota automáticamente)
DAY_NUM=$(date +%j)
CAT_IDX=$((DAY_NUM % ${#CATEGORIES[@]}))
CITY_IDX=$(( (DAY_NUM * 7) % ${#CITIES[@]} ))  # primo 7 = ciudad diferente cada día

CATEGORY="${CATEGORIES[$CAT_IDX]}"
CITY="${CITIES[$CITY_IDX]}"

echo "========================================" | tee "$LOG"
echo "SiteSafe Outreach — $DATE" | tee -a "$LOG"
echo "Categoría: $CATEGORY" | tee -a "$LOG"
echo "Ciudad: $CITY" | tee -a "$LOG"
echo "========================================" | tee -a "$LOG"

cd /Users/ld/ada-accessibility-checker

# Meta diaria: 20 emails enviados (busca en Yelp + Yellow Pages hasta llegar)
if [[ -n "${RESEND_API_KEY:-}" && -n "${FROM_EMAIL:-}" ]]; then
    echo "Modo: ENVÍO AUTOMÁTICO — Meta: 20 emails" | tee -a "$LOG"
    python3 scripts/outreach.py \
        --category "$CATEGORY" \
        --city "$CITY" \
        --target 20 \
        --output "$CSV" \
        --send 2>&1 | tee -a "$LOG"
else
    echo "Modo: SOLO CSV (configura RESEND_API_KEY para auto-envío)" | tee -a "$LOG"
    python3 scripts/outreach.py \
        --category "$CATEGORY" \
        --city "$CITY" \
        --target 20 \
        --output "$CSV" 2>&1 | tee -a "$LOG"
fi

echo "" | tee -a "$LOG"
echo "✓ Listo. Revisa: $CSV" | tee -a "$LOG"

# Generar dashboard HTML y lanzar servidor interactivo
HTML="$OUTREACH_DIR/$DATE.html"
python3 /Users/ld/ada-accessibility-checker/scripts/generate_report.py "$CSV" 2>&1 | tee -a "$LOG"

# Servidor interactivo (en background) → abre http://localhost:8888
# Enter=Enviar · Esc=Omitir · E=Editar · C=Copiar email
source /Users/ld/.zshenv 2>/dev/null || true
python3 /Users/ld/ada-accessibility-checker/scripts/dashboard_server.py "$CSV" >> "$LOG" 2>&1 &
echo "Dashboard en http://localhost:8888" | tee -a "$LOG"

# Notificación en Mac
ROWS=$(( $(wc -l < "$CSV") - 1 ))
WITH_EMAIL=$(python3 -c "import csv; rows=list(csv.DictReader(open('$CSV'))); print(sum(1 for r in rows if r.get('email')))" 2>/dev/null || echo "?")
osascript -e "display notification \"$WITH_EMAIL emails encontrados · $CATEGORY · $CITY\" with title \"SiteSafe Outreach ✓\" sound name \"Glass\""
