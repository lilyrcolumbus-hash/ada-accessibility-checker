#!/usr/bin/env python3
"""
Monthly automated re-scan for Compliance Shield subscribers
=============================================================
For every profile on the compliance-shield plan, re-scans their up to 5
most recently scanned domains using the FULL 11-check scanner
(scanner_full.py — a faithful port of the real product's scoring, not the
lighter 6-check teaser used in outreach.py), stores a fresh `scans` row,
and emails an alert if the score dropped or critical issues increased.

Env vars requeridas:
  SUPABASE_URL, SUPABASE_SERVICE_KEY
  RESEND_API_KEY / BREVO_API_KEY / SENDGRID_API_KEY (email cascade, reused from outreach.py)

Uso:
  python3 scripts/monthly_rescan.py --dry-run   # query + scan + compare only, no writes/emails
  python3 scripts/monthly_rescan.py             # real run
"""

import os, sys, time, argparse
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).parent))
from scanner_full import run_full_scan
from outreach import send_email, BROWSER_HEADERS, SITESAFE_URL  # reuse proven cascade + headers

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

MAX_MONITORED_DOMAINS = 5


def _sb_headers() -> dict:
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }


def _sb_get(table: str, params: str = "") -> list:
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{table}?{params}", headers=_sb_headers(), timeout=15)
    r.raise_for_status()
    return r.json()


def _sb_insert(table: str, data: dict) -> bool:
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers={**_sb_headers(), "Prefer": "return=minimal"},
        json=data, timeout=15,
    )
    return r.ok


def get_compliance_shield_users() -> list:
    return _sb_get("profiles", "select=id,email&plan=eq.compliance-shield")


def get_monitored_domains(user_id: str) -> list:
    """Up to MAX_MONITORED_DOMAINS most-recently-scanned distinct domains for a user,
    each with its latest stored score/critical_count to compare against."""
    rows = _sb_get(
        "scans",
        f"select=url,domain,score,critical_count,created_at"
        f"&user_id=eq.{user_id}&order=created_at.desc&limit=200",
    )
    seen: dict[str, dict] = {}
    for row in rows:
        domain = row["domain"]
        if domain not in seen:
            seen[domain] = row
        if len(seen) >= MAX_MONITORED_DOMAINS:
            break
    return list(seen.values())


def fetch_html(url: str) -> str:
    resp = requests.get(url, headers=BROWSER_HEADERS, timeout=15, allow_redirects=True)
    resp.raise_for_status()
    return resp.text


def send_alert_email(user_email: str, domain: str, old_score: int, new_score: int, result: dict) -> None:
    subject = f"Your accessibility score for {domain} changed: {old_score} → {new_score}"
    body = f"""Hi,

Your monthly Compliance Shield re-scan of {domain} found a change worth a look:

  Previous score: {old_score}
  New score: {new_score}
  Critical issues: {result['critical_count']}
  Total issues: {result['total_issues']}

Full details and fixes: {SITESAFE_URL}/dashboard

Lily
SiteSafe · adalawsuitcheck.com"""
    send_email(user_email, subject, body)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true",
                        help="Query + scan + compare only — no DB writes, no emails")
    args = parser.parse_args()

    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("ERROR: SUPABASE_URL / SUPABASE_SERVICE_KEY not configured")
        sys.exit(1)

    users = get_compliance_shield_users()
    print(f"Found {len(users)} Compliance Shield subscriber(s)")
    if args.dry_run:
        print("[DRY RUN — no writes, no emails]")

    scanned = 0
    alerted = 0

    for user in users:
        domains = get_monitored_domains(user["id"])
        print(f"\n[{user.get('email', user['id'])}] monitoring {len(domains)} domain(s)")

        for prev in domains:
            url, domain = prev["url"], prev["domain"]
            old_score = prev.get("score")
            old_critical = prev.get("critical_count") or 0

            try:
                html = fetch_html(url)
                result = run_full_scan(html)
            except Exception as e:
                print(f"  ✗ {domain}: scan failed ({e})")
                continue

            scanned += 1
            new_score = result["score"]
            delta = new_score - (old_score if old_score is not None else new_score)
            print(f"  {domain}: {old_score} → {new_score} ({'+' if delta >= 0 else ''}{delta}), "
                  f"{result['critical_count']} critical")

            if args.dry_run:
                continue

            _sb_insert("scans", {
                "user_id": user["id"], "url": url, "domain": domain,
                "score": new_score,
                "total_issues": result["total_issues"],
                "critical_count": result["critical_count"],
                "serious_count": result["serious_count"],
                "moderate_count": result["moderate_count"],
                "minor_count": result["minor_count"],
            })

            score_dropped = old_score is not None and new_score < old_score
            critical_increased = result["critical_count"] > old_critical
            if (score_dropped or critical_increased) and user.get("email"):
                send_alert_email(user["email"], domain, old_score, new_score, result)
                alerted += 1
                print(f"  → alert sent (score {'dropped' if score_dropped else 'unchanged'}, "
                      f"critical {'up' if critical_increased else 'same'})")

            time.sleep(1)  # be a good citizen when fetching other people's sites

    print(f"\n{'─'*50}")
    print(f"✓ {scanned} domain(s) re-scanned")
    if not args.dry_run:
        print(f"✓ {alerted} alert(s) sent")


if __name__ == "__main__":
    main()
