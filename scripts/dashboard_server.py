#!/usr/bin/env python3
"""
SiteSafe Dashboard Server — modo interactivo
Uso: python3 scripts/dashboard_server.py [/ruta/al/archivo.csv]
Sin argumento: busca el CSV de hoy automáticamente.
Abre http://localhost:8888
"""
import json, csv, os, sys, webbrowser, threading, requests as req
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse
from datetime import date

# ── Config ────────────────────────────────────────────────────────────────────
PORT           = 8888
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_NAME    = "Lily from SiteSafe"
OUTREACH_DIR   = Path.home() / "Desktop" / "SiteSafe-Outreach"
CONTACTED_LOG  = OUTREACH_DIR / "contacted.csv"

sys.path.insert(0, str(Path(__file__).parent))

# ── Estado global ─────────────────────────────────────────────────────────────
csv_path: Path | None = None
rows: list[dict] = []

def load_csv(path: Path) -> list[dict]:
    with open(path, newline="", encoding="utf-8") as f:
        data = list(csv.DictReader(f))
    for i, r in enumerate(data):
        r["_id"] = str(i)
        if not r.get("status"):
            r["status"] = "ready" if r.get("email") else "no_email"
    return data

def save_csv(path: Path, data: list[dict]):
    if not data:
        return
    fields = [k for k in data[0] if not k.startswith("_")]
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(data)

def mark_contacted_log(email: str, name: str, website: str):
    write_header = not CONTACTED_LOG.exists()
    OUTREACH_DIR.mkdir(parents=True, exist_ok=True)
    with open(CONTACTED_LOG, "a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["date","email","name","website"])
        if write_header:
            w.writeheader()
        w.writerow({"date": date.today().isoformat(), "email": email.lower(),
                    "name": name, "website": website})

def get_stats() -> dict:
    return {
        "total":      len(rows),
        "with_email": sum(1 for r in rows if r.get("email")),
        "sent":       sum(1 for r in rows if r.get("status") == "sent"),
        "ready":      sum(1 for r in rows if r.get("status") == "ready"),
        "skipped":    sum(1 for r in rows if r.get("status") == "skipped"),
        "no_email":   sum(1 for r in rows if r.get("status") == "no_email"),
    }

# ── HTTP Handler ──────────────────────────────────────────────────────────────
CORS = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

class Handler(BaseHTTPRequestHandler):
    def _headers(self, code: int, ctype: str):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        for k, v in CORS.items():
            self.send_header(k, v)
        self.end_headers()

    def _json(self, data):
        body = json.dumps(data, ensure_ascii=False).encode()
        self._headers(200, "application/json; charset=utf-8")
        self.wfile.write(body)

    def _read_body(self) -> dict:
        n = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(n)) if n else {}

    def do_OPTIONS(self):
        self._headers(204, "text/plain")

    def do_GET(self):
        path = urlparse(self.path).path
        if path in ("/", "/dashboard"):
            from generate_report import generate_html
            date_str = csv_path.stem if csv_path else date.today().isoformat()
            log = str(csv_path.with_suffix(".log")) if csv_path else ""
            html = generate_html(rows, date_str, str(csv_path or ""), log,
                                 server_mode=True)
            body = html.encode()
            self._headers(200, "text/html; charset=utf-8")
            self.wfile.write(body)
        elif path == "/api/stats":
            self._json(get_stats())
        elif path == "/api/rows":
            self._json(rows)
        else:
            self._headers(404, "text/plain")

    def do_POST(self):
        path = urlparse(self.path).path
        data = self._read_body()
        row_id = str(data.get("id", ""))
        row = next((r for r in rows if r.get("_id") == row_id), None)

        if path == "/api/send" and row:
            ok = False
            if RESEND_API_KEY and row.get("email"):
                try:
                    resp = req.post(
                        "https://api.resend.com/emails",
                        headers={"Authorization": f"Bearer {RESEND_API_KEY}",
                                 "Content-Type": "application/json"},
                        json={
                            "from":     f"{SENDER_NAME} <lily@adalawsuitcheck.com>",
                            "reply_to": "codebake.SaaS@outlook.com",
                            "to":       row["email"],
                            "subject":  data.get("subject", row.get("subject", "")),
                            "text":     data.get("body",    row.get("body",    "")),
                        },
                        timeout=10,
                    )
                    ok = resp.status_code in (200, 201)
                except Exception:
                    ok = False
            row["status"] = "sent" if ok else "failed"
            if ok:
                mark_contacted_log(row["email"], row.get("name",""), row.get("website",""))
            if csv_path:
                save_csv(csv_path, rows)
            self._json({"ok": ok, "status": row["status"]})

        elif path == "/api/skip" and row:
            row["status"] = "skipped"
            if csv_path:
                save_csv(csv_path, rows)
            self._json({"ok": True})

        elif path == "/api/edit" and row:
            if "subject" in data: row["subject"] = data["subject"]
            if "body"    in data: row["body"]    = data["body"]
            if csv_path:
                save_csv(csv_path, rows)
            self._json({"ok": True})

        else:
            self._headers(404, "text/plain")

    def log_message(self, *_):
        pass  # silencio

# ── Entry point ───────────────────────────────────────────────────────────────
def main():
    global csv_path, rows

    # Buscar CSV: argumento o archivo de hoy
    if len(sys.argv) > 1:
        csv_path = Path(sys.argv[1]).expanduser().resolve()
    else:
        csv_path = OUTREACH_DIR / f"{date.today().isoformat()}.csv"

    if not csv_path.exists():
        print(f"No se encontró CSV: {csv_path}")
        print("Uso: python3 scripts/dashboard_server.py [ruta.csv]")
        sys.exit(1)

    rows = load_csv(csv_path)

    import socket as _s
    local_ip = _s.gethostbyname(_s.gethostname())
    url_local = f"http://localhost:{PORT}"
    url_phone  = f"http://{local_ip}:{PORT}"
    print(f"\n✓ Dashboard interactivo")
    print(f"  Mac   → {url_local}")
    print(f"  📱 Teléfono (misma WiFi) → {url_phone}")
    print(f"  CSV: {csv_path.name}")
    print(f"  ↑↓ navegar  ·  Enter enviar  ·  Esc omitir  ·  E editar  ·  C copiar email")
    print(f"  Ctrl+C para cerrar\n")

    threading.Timer(0.6, lambda: webbrowser.open(url)).start()

    # 0.0.0.0 = accesible desde Mac Y desde el teléfono en la misma WiFi
    server = HTTPServer(("0.0.0.0", PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n✓ Servidor cerrado")

if __name__ == "__main__":
    main()
