#!/usr/bin/env python3
"""
Genera un HTML report visual del outreach del día.
Lee el CSV generado por outreach.py y produce un dashboard interactivo.

Uso: python3 scripts/generate_report.py <outreach.csv> [--open]
"""

import sys, csv, os, json, argparse, re
from datetime import datetime
from pathlib import Path

def linkify(text: str) -> str:
    """Escapa HTML y convierte URLs en enlaces clicables."""
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return re.sub(
        r'(https?://[^\s]+)',
        r'<a href="\1" target="_blank" style="color:#60a5fa;text-decoration:underline">\1</a>',
        text
    )

def severity_color(issues: int) -> tuple[str, str]:
    if issues >= 10:
        return "#ef4444", "HOT"       # rojo — muchos issues, fácil venta
    if issues >= 4:
        return "#f97316", "WARM"      # naranja — varios issues
    if issues >= 1:
        return "#eab308", "MILD"      # amarillo — pocos issues
    return "#6b7280", "COLD"          # gris — sin issues detectados

def status_badge(status: str) -> tuple[str, str]:
    colors = {
        "sent":     ("#22c55e", "Enviado ✓"),
        "ready":    ("#3b82f6", "Listo para enviar"),
        "no_email": ("#9ca3af", "Sin email"),
        "failed":   ("#ef4444", "Error al enviar"),
        "":         ("#9ca3af", "Pendiente"),
    }
    return colors.get(status, ("#9ca3af", status))

def generate_html(rows: list[dict], date_str: str, csv_path: str, log_path: str,
                  server_mode: bool = False) -> str:
    total     = len(rows)
    with_email = sum(1 for r in rows if r.get("email"))
    sent      = sum(1 for r in rows if r.get("status") == "sent")
    hot       = sum(1 for r in rows if int(r.get("issues") or 0) >= 10)
    ready     = sum(1 for r in rows if r.get("status") == "ready")

    cards_data = [
        ("Negocios procesados", total,      "#3b82f6", "all",   ""),
        ("Con email",           with_email, "#8b5cf6", "email", ""),
        ("Leads calientes 🔥",  hot,        "#ef4444", "heat",  "hot"),
        ("Listos para enviar",  ready,      "#f97316", "status","ready"),
        ("Enviados ✓",          sent,       "#22c55e", "status","sent"),
    ]

    stat_keys = ["total", "email", "hot", "status", "sent"]
    cards_html = "".join(f"""
        <div class="card" onclick="filterByCard('{ft}','{fv}')" title="Click para filtrar">
            <div class="card-num" style="color:{c}" data-stat="{sk}">{v}</div>
            <div class="card-label">{l}</div>
        </div>""" for (l, v, c, ft, fv), sk in zip(cards_data, stat_keys))

    rows_html = ""
    mobile_html = ""
    for i, r in enumerate(rows):
        issues   = int(r.get("issues") or 0)
        critical = int(r.get("critical") or 0)
        sev_color, sev_label = severity_color(issues)
        st_color, st_label   = status_badge(r.get("status", ""))
        email_val  = r.get("email", "")
        subject    = r.get("subject", "").replace("`", "'")
        body       = r.get("body", "").replace("`", "'").replace("\n", "\\n")
        scan_url   = r.get("scan_url", "")
        scan_error = r.get("scan_error", "")
        website    = r.get("website", "")
        domain     = website.replace("https://", "").replace("http://", "").split("/")[0]
        name       = r.get("name", "")
        city       = r.get("city", "")
        # Mostrar "Ver scan" solo si el scan no falló
        show_scan  = bool(scan_url and not scan_error)

        heat_label = "hot" if issues >= 10 else ("warm" if issues >= 4 else ("mild" if issues >= 1 else "cold"))

        # Desktop table row
        rows_html += f"""
        <tr class="data-row" data-rowid="{i}" data-email="{email_val}" data-status="{r.get('status','')}" data-issues="{issues}" data-name="{name.lower()}" data-heat="{heat_label}">
            <td class="biz-name">
                <strong>{name}</strong>
                <div class="biz-city">{city}</div>
            </td>
            <td>
                {"<a href='" + website + "' target='_blank'>" + domain + "</a>" if website else "—"}
            </td>
            <td>
                {"<span style='display:flex;align-items:center;gap:6px'><a href='mailto:" + email_val + "'>" + email_val + "</a><button class='btn-copy' style='padding:2px 7px;font-size:11px' onclick='copyEmailAddr(\"" + email_val + "\");event.stopPropagation()' title='Copiar dirección'>⎘</button></span>" if email_val else "<span class='no-email'>—</span>"}
            </td>
            <td>
                <span class="badge" style="background:{sev_color}20;color:{sev_color};border:1px solid {sev_color}40">
                    {sev_label} · {issues} issues · {critical} críticos
                </span>
            </td>
            <td>
                <span class="badge status-badge" style="background:{st_color}20;color:{st_color};border:1px solid {st_color}40">
                    {st_label}
                </span>
            </td>
            <td class="actions" onclick="event.stopPropagation()">
                {"<button class='btn-preview' onclick='togglePreview(" + str(i) + ")'>Ver email</button>" if email_val else ""}
                {"<button class='btn-copy' onclick='openEdit(\"" + str(i) + "\")' title='Editar'>✏</button>" if email_val else ""}
                {"<a class='btn-scan' href='" + scan_url + "' target='_blank'>Ver scan</a>" if show_scan else ""}
                {"<button class='btn-copy' onclick='copyEmail(" + str(i) + ")'>Copiar</button>" if email_val else ""}
                {"<span style='color:#ef444480;font-size:11px'>⚠ " + scan_error + "</span>" if scan_error and not email_val else ""}
            </td>
        </tr>
        <tr id="preview-{i}" class="preview-row" style="display:none">
            <td colspan="6">
                <div class="email-preview">
                    <div class="email-subject">📧 Asunto: {subject}</div>
                    <div class="email-body" id="body-{i}">{linkify(r.get("body",""))}</div>
                </div>
            </td>
        </tr>"""

        # Mobile card
        preview_id = f"mpreview-{i}"
        mobile_html += f"""
        <div class="biz-card" data-issues="{issues}" data-status="{r.get('status','')}" data-email="{email_val}" data-name="{name.lower()}" data-city="{city.lower()}">
            <div class="biz-card-header">
                <div>
                    <div class="biz-card-name">{name}</div>
                    <div class="biz-card-city">{city}</div>
                </div>
                <span class="badge" style="background:{sev_color}20;color:{sev_color};border:1px solid {sev_color}40">{sev_label}</span>
            </div>
            <div class="biz-card-row">
                <span class="badge" style="background:{st_color}20;color:{st_color};border:1px solid {st_color}40">{st_label}</span>
                <span style="color:#94a3b8;font-size:12px">{issues} issues · {critical} críticos</span>
            </div>
            {"<div class='biz-card-row' style='color:#64748b;font-size:12px'>📧 " + email_val + "</div>" if email_val else "<div class='biz-card-row' style='color:#475569;font-size:12px'>Sin email</div>"}
            <div class="biz-card-actions">
                {"<button class='btn-preview' onclick='toggleMobilePreview(\"" + preview_id + "\")'>Ver email</button>" if email_val else ""}
                {"<a class='btn-scan' href='" + scan_url + "' target='_blank'>Ver scan</a>" if show_scan else ""}
                {"<button class='btn-copy' onclick='copyEmail(" + str(i) + ")'>Copiar</button>" if email_val else ""}
            </div>
            {"<div class='email-preview-mobile' id='" + preview_id + "' style='display:none'><div class='email-subject'>📧 " + subject + "</div><div class='email-body'>" + linkify(r.get('body','')) + "</div></div>" if email_val else ""}
        </div>"""

    emails_json = json.dumps({
        str(i): {"subject": r.get("subject",""), "body": r.get("body","")}
        for i, r in enumerate(rows) if r.get("email")
    })

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SiteSafe Outreach — {date_str}</title>
<style>
  * {{ box-sizing:border-box; margin:0; padding:0 }}
  body {{ font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background:#0f172a; color:#e2e8f0; min-height:100vh }}

  /* HEADER */
  .header {{ background:#1e293b; border-bottom:1px solid #334155; padding:16px 20px; display:flex; align-items:center; justify-content:space-between; gap:12px }}
  .logo {{ font-size:18px; font-weight:700; color:#3b82f6 }}
  .date {{ color:#94a3b8; font-size:13px }}

  /* STAT CARDS */
  .stats {{ display:grid; grid-template-columns:repeat(5,1fr); gap:12px; padding:16px 20px }}
  .card {{ background:#1e293b; border:1px solid #334155; border-radius:12px; padding:16px; cursor:pointer; transition:border-color .2s,transform .1s; text-align:center }}
  .card:hover {{ border-color:#3b82f6; transform:translateY(-2px) }}
  .card.active {{ border-color:#3b82f6; background:#1e3a5f }}
  .card-num {{ font-size:28px; font-weight:800; line-height:1 }}
  .card-label {{ color:#94a3b8; font-size:11px; margin-top:5px }}

  /* FILTERS */
  .filter-bar {{ padding:0 20px 14px; display:flex; gap:10px; flex-wrap:wrap }}
  .filter-bar input {{ background:#1e293b; border:1px solid #334155; color:#e2e8f0; padding:9px 14px; border-radius:8px; font-size:14px; flex:1; min-width:160px }}
  .filter-bar select {{ background:#1e293b; border:1px solid #334155; color:#e2e8f0; padding:9px 12px; border-radius:8px; font-size:14px }}
  .filter-bar input:focus,.filter-bar select:focus {{ outline:none; border-color:#3b82f6 }}

  /* DESKTOP TABLE */
  .table-wrap {{ padding:0 20px 20px; overflow-x:auto }}
  table {{ width:100%; border-collapse:collapse; background:#1e293b; border-radius:12px; overflow:hidden; border:1px solid #334155 }}
  th {{ background:#0f172a; color:#94a3b8; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; padding:12px 16px; text-align:left }}
  td {{ padding:13px 16px; border-bottom:1px solid #0f172a; vertical-align:middle; font-size:14px }}
  tr:last-child td {{ border-bottom:none }}
  tr.data-row {{ cursor:pointer }}
  tr.data-row:hover td {{ background:#1a2d47 }}
  tr.data-row.selected td {{ background:#1e3a5f !important; box-shadow:inset 3px 0 0 #3b82f6 }}
  .biz-name strong {{ color:#f1f5f9 }}
  .biz-city {{ color:#64748b; font-size:11px; margin-top:2px }}
  a {{ color:#60a5fa; text-decoration:none }}
  a:hover {{ text-decoration:underline }}
  .no-email {{ color:#475569 }}
  .badge {{ display:inline-block; padding:3px 10px; border-radius:999px; font-size:11px; font-weight:600; white-space:nowrap }}
  .actions {{ display:flex; gap:6px; flex-wrap:wrap }}
  .btn-preview,.btn-copy,.btn-scan {{
    padding:6px 12px; border-radius:6px; font-size:12px; font-weight:600;
    cursor:pointer; border:none; text-decoration:none; display:inline-block; white-space:nowrap
  }}
  .btn-preview {{ background:#3b82f620; color:#60a5fa; border:1px solid #3b82f640 }}
  .btn-copy    {{ background:#8b5cf620; color:#a78bfa; border:1px solid #8b5cf640 }}
  .btn-scan    {{ background:#22c55e20; color:#4ade80; border:1px solid #22c55e40 }}
  .preview-row td {{ padding:0 16px 16px }}
  .email-preview {{ background:#0f172a; border:1px solid #334155; border-radius:8px; overflow:hidden }}
  .email-subject {{ padding:12px 16px; background:#1e293b; color:#94a3b8; font-size:13px; border-bottom:1px solid #334155 }}
  .email-body {{ padding:16px; font-size:13px; line-height:1.7; color:#cbd5e1; white-space:pre-wrap; font-family:inherit }}

  /* MOBILE CARDS — reemplaza la tabla en pantallas pequeñas */
  .mobile-list {{ display:none; padding:0 16px 24px; flex-direction:column; gap:12px }}
  .biz-card {{ background:#1e293b; border:1px solid #334155; border-radius:14px; padding:16px; display:flex; flex-direction:column; gap:10px }}
  .biz-card-header {{ display:flex; justify-content:space-between; align-items:flex-start; gap:8px }}
  .biz-card-name {{ font-weight:700; color:#f1f5f9; font-size:15px }}
  .biz-card-city {{ color:#64748b; font-size:12px }}
  .biz-card-row {{ display:flex; align-items:center; gap:8px; font-size:13px; flex-wrap:wrap }}
  .biz-card-actions {{ display:flex; gap:8px; flex-wrap:wrap }}
  .biz-card-actions .btn-preview,
  .biz-card-actions .btn-copy,
  .biz-card-actions .btn-scan {{ padding:10px 16px; font-size:13px; border-radius:8px; flex:1; text-align:center }}
  .email-preview-mobile {{ background:#0f172a; border:1px solid #334155; border-radius:8px; overflow:hidden; margin-top:4px }}

  /* FOOTER */
  .footer {{ padding:12px 20px 32px; color:#475569; font-size:12px; display:flex; gap:20px; flex-wrap:wrap }}
  .footer a {{ color:#475569 }}
  .toast {{ position:fixed; bottom:24px; right:16px; left:16px; background:#22c55e; color:#fff; padding:12px 20px; border-radius:10px; font-size:14px; font-weight:600; opacity:0; transition:opacity .3s; pointer-events:none; text-align:center }}
  .toast.show {{ opacity:1 }}

  /* RESPONSIVE */
  @media (max-width:768px) {{
    .stats {{ grid-template-columns:repeat(3,1fr) }}
    .card-num {{ font-size:22px }}
    .card-label {{ font-size:10px }}
    .table-wrap {{ display:none }}
    .mobile-list {{ display:flex }}
  }}
  @media (max-width:480px) {{
    .stats {{ grid-template-columns:repeat(2,1fr) }}
    .header {{ flex-direction:column; align-items:flex-start; gap:4px }}
  }}
</style>
</head>
<body>
<div class="header">
  <div class="logo">🛡 SiteSafe Outreach</div>
  <div class="date">Reporte del {date_str}</div>
</div>

<div class="stats">{cards_html}</div>

<div class="filter-bar">
  <input type="text" id="search" placeholder="Buscar negocio, email, ciudad…" oninput="filterTable()">
  <select id="filterStatus" onchange="filterTable()">
    <option value="">Todos los estados</option>
    <option value="sent">Enviados</option>
    <option value="ready">Listos para enviar</option>
    <option value="no_email">Sin email</option>
  </select>
  <select id="filterHeat" onchange="filterTable()">
    <option value="">Todos los leads</option>
    <option value="hot">HOT (10+ issues)</option>
    <option value="warm">WARM (4–9 issues)</option>
    <option value="mild">MILD (1–3 issues)</option>
  </select>
</div>

<div class="table-wrap">
  <table id="mainTable">
    <thead>
      <tr>
        <th>Negocio</th>
        <th>Website</th>
        <th>Email</th>
        <th>Issues ADA</th>
        <th>Estado</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>{rows_html}</tbody>
  </table>
</div>

<div class="mobile-list" id="mobileList">{mobile_html}</div>

<div class="footer">
  <a href="file://{csv_path}">📄 Abrir CSV</a>
  <a href="file://{log_path}">📋 Ver log</a>
  <span>Generado {datetime.now().strftime("%H:%M:%S")}</span>
</div>

<div class="toast" id="toast">¡Copiado!</div>

<script>
const EMAIL_DATA = {emails_json};
const SERVER     = 'http://localhost:8888';
const SERVER_MODE_FORCED = {'true' if server_mode else 'false'};
let   serverMode = SERVER_MODE_FORCED;
let   selectedIdx = -1;

// ── Detectar servidor ────────────────────────────────────────────────────────
if (!serverMode) {{
  fetch(SERVER + '/api/stats', {{mode:'cors'}})
    .then(r => {{ if (r.ok) {{ serverMode = true; startStatsRefresh(); }} }})
    .catch(() => {{}});
}}
if (serverMode) startStatsRefresh();

function startStatsRefresh() {{
  refreshStats();
  setInterval(refreshStats, 3000);
  showServerBadge();
}}

function refreshStats() {{
  fetch(SERVER + '/api/stats', {{mode:'cors'}})
    .then(r => r.json())
    .then(s => {{
      const el = id => document.querySelector('[data-stat="' + id + '"]');
      if (el('sent'))   el('sent').textContent   = s.sent;
      if (el('ready'))  el('ready').textContent  = s.ready;
      if (el('total'))  el('total').textContent  = s.total;
      if (el('email'))  el('email').textContent  = s.with_email;
      if (el('hot'))    el('hot').textContent    = document.querySelectorAll('[data-heat="hot"]').length;
    }})
    .catch(() => {{}});
}}

function showServerBadge() {{
  const badge = document.createElement('div');
  badge.innerHTML = '🟢 Servidor activo — Enter envía, Esc omite';
  badge.style.cssText = 'position:fixed;top:0;left:50%;transform:translateX(-50%);background:#22c55e;color:#fff;padding:4px 16px;font-size:12px;font-weight:600;border-radius:0 0 8px 8px;z-index:999';
  document.body.appendChild(badge);
}}

// ── Selección de filas ────────────────────────────────────────────────────────
function getDataRows() {{
  return [...document.querySelectorAll('#mainTable tbody tr.data-row')].filter(r => r.style.display !== 'none');
}}

function selectRow(idx) {{
  const rows = getDataRows();
  if (idx < 0 || idx >= rows.length) return;
  document.querySelectorAll('#mainTable tbody tr.data-row').forEach(r => r.classList.remove('selected'));
  rows[idx].classList.add('selected');
  selectedIdx = idx;
  rows[idx].scrollIntoView({{block:'nearest', behavior:'smooth'}});
  // Abrir preview automáticamente
  const rowId = rows[idx].dataset.rowid;
  const prev = document.getElementById('preview-' + rowId);
  if (prev) prev.style.display = 'table-row';
}}

// ── Keyboard ──────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {{
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  const rows = getDataRows();

  if (e.key === 'ArrowDown') {{ e.preventDefault(); selectRow(selectedIdx + 1); }}
  if (e.key === 'ArrowUp')   {{ e.preventDefault(); selectRow(selectedIdx - 1); return; }}

  if (e.key === 'Enter' && selectedIdx >= 0) {{
    e.preventDefault();
    const rowId = rows[selectedIdx]?.dataset.rowid;
    if (rowId !== undefined) serverMode ? apiSend(rowId) : togglePreview(rowId);
  }}
  if (e.key === 'Escape') {{
    e.preventDefault();
    if (selectedIdx >= 0) {{
      const rowId = rows[selectedIdx]?.dataset.rowid;
      if (rowId !== undefined) serverMode ? apiSkip(rowId) : collapsePreview(rowId);
    }}
    document.getElementById('editModal')?.remove();
  }}
  if ((e.key === 'c' || e.key === 'C') && selectedIdx >= 0) {{
    const emailAddr = rows[selectedIdx]?.dataset.email;
    if (emailAddr) navigator.clipboard.writeText(emailAddr).then(() => showToast('Email copiado: ' + emailAddr));
  }}
  if ((e.key === 'e' || e.key === 'E') && selectedIdx >= 0) {{
    const rowId = rows[selectedIdx]?.dataset.rowid;
    if (rowId !== undefined) openEdit(rowId);
  }}
}});

// ── API calls (server mode) ───────────────────────────────────────────────────
function apiSend(rowId) {{
  const d = EMAIL_DATA[String(rowId)];
  if (!d) {{ showToast('Sin email — omitido'); return; }}
  showToast('Enviando…');
  fetch(SERVER + '/api/send', {{
    method: 'POST', mode: 'cors',
    headers: {{'Content-Type': 'application/json'}},
    body: JSON.stringify({{id: rowId, subject: d.subject, body: d.body}})
  }})
  .then(r => r.json())
  .then(res => {{
    showToast(res.ok ? '✅ Enviado a ' + (d.email || '') : '❌ Error al enviar');
    updateRowStatus(rowId, res.status);
    if (res.ok) selectRow(selectedIdx + 1);
  }})
  .catch(() => showToast('❌ Servidor no disponible'));
}}

function apiSkip(rowId) {{
  fetch(SERVER + '/api/skip', {{
    method: 'POST', mode: 'cors',
    headers: {{'Content-Type': 'application/json'}},
    body: JSON.stringify({{id: rowId}})
  }})
  .then(() => {{ showToast('Omitido'); updateRowStatus(rowId, 'skipped'); selectRow(selectedIdx); }})
  .catch(() => showToast('❌ Servidor no disponible'));
}}

function apiEdit(rowId, subject, body) {{
  EMAIL_DATA[String(rowId)].subject = subject;
  EMAIL_DATA[String(rowId)].body    = body;
  fetch(SERVER + '/api/edit', {{
    method: 'POST', mode: 'cors',
    headers: {{'Content-Type': 'application/json'}},
    body: JSON.stringify({{id: rowId, subject, body}})
  }}).catch(() => {{}});
}}

function updateRowStatus(rowId, status) {{
  const labels = {{sent:'Enviado ✓', skipped:'Omitido', failed:'Error', ready:'Listo para enviar'}};
  const colors = {{sent:'#22c55e', skipped:'#6b7280', failed:'#ef4444', ready:'#3b82f6'}};
  const badge = document.querySelector(`tr[data-rowid="${{rowId}}"] .status-badge`);
  if (badge) {{
    badge.textContent = labels[status] || status;
    badge.style.background = (colors[status] || '#6b7280') + '20';
    badge.style.color = colors[status] || '#6b7280';
    badge.style.border = '1px solid ' + (colors[status] || '#6b7280') + '40';
  }}
}}

// ── Edit modal ────────────────────────────────────────────────────────────────
function openEdit(rowId) {{
  const d = EMAIL_DATA[String(rowId)];
  if (!d) return;
  document.getElementById('editModal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'editModal';
  modal.style.cssText = 'position:fixed;inset:0;background:#000a;z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px';
  modal.innerHTML = `
    <div style="background:#1e293b;border:1px solid #334155;border-radius:16px;width:100%;max-width:640px;padding:24px;display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-weight:700;color:#f1f5f9">✏ Editar email</span>
        <button onclick="document.getElementById('editModal').remove()" style="background:none;border:none;color:#64748b;font-size:20px;cursor:pointer">✕</button>
      </div>
      <input id="editSubject" value="${{d.subject.replace(/"/g,'&quot;')}}"
        style="background:#0f172a;border:1px solid #334155;color:#e2e8f0;padding:10px 14px;border-radius:8px;font-size:14px;width:100%">
      <textarea id="editBody" rows="12"
        style="background:#0f172a;border:1px solid #334155;color:#e2e8f0;padding:10px 14px;border-radius:8px;font-size:13px;width:100%;resize:vertical;line-height:1.6;font-family:inherit">${{d.body}}</textarea>
      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button onclick="document.getElementById('editModal').remove()"
          style="padding:9px 20px;border-radius:8px;border:1px solid #334155;background:none;color:#94a3b8;cursor:pointer">Cancelar</button>
        <button onclick="saveEdit('${{rowId}}')"
          style="padding:9px 20px;border-radius:8px;border:none;background:#3b82f6;color:#fff;font-weight:600;cursor:pointer">✅ Guardar</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  document.getElementById('editSubject').focus();
}}

function saveEdit(rowId) {{
  const subject = document.getElementById('editSubject').value;
  const body    = document.getElementById('editBody').value;
  // Update preview in table
  const prevEl = document.querySelector('#preview-' + rowId + ' .email-body');
  if (prevEl) prevEl.innerHTML = linkify(body);
  const subEl = document.querySelector('#preview-' + rowId + ' .email-subject');
  if (subEl) subEl.textContent = '📧 Asunto: ' + subject;
  apiEdit(rowId, subject, body);
  document.getElementById('editModal').remove();
  showToast('✅ Email actualizado');
}}

function linkify(text) {{
  const esc = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const urlRe = new RegExp('https?://[^\\s]+','g'); return esc.replace(urlRe, m => '<a href="'+m+'" target="_blank" style="color:#60a5fa;text-decoration:underline">'+m+'</a>');
}}

// ── Helpers existentes ────────────────────────────────────────────────────────
function togglePreview(i) {{
  const row = document.getElementById('preview-' + i);
  if (row) row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
}}
function collapsePreview(i) {{
  const row = document.getElementById('preview-' + i);
  if (row) row.style.display = 'none';
}}
function toggleMobilePreview(id) {{
  const el = document.getElementById(id);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}}
function copyEmail(i) {{
  const d = EMAIL_DATA[String(i)];
  if (!d) return;
  const text = 'Asunto: ' + d.subject + '\\n\\n' + d.body;
  navigator.clipboard.writeText(text).then(() => showToast('¡Texto copiado!'));
}}
function copyEmailAddr(addr) {{
  navigator.clipboard.writeText(addr).then(() => showToast('Email copiado: ' + addr));
}}
function showToast(msg) {{
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}}

// ── Filtros ───────────────────────────────────────────────────────────────────
function filterByCard(type, value) {{
  document.getElementById('search').value = '';
  document.getElementById('filterStatus').value = '';
  document.getElementById('filterHeat').value = '';
  document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
  event.currentTarget.classList.add('active');
  selectedIdx = -1;
  if (type === 'all')    {{ filterTable(); return; }}
  if (type === 'status') {{ document.getElementById('filterStatus').value = value; }}
  if (type === 'heat')   {{ document.getElementById('filterHeat').value = value; }}
  if (type === 'email')  {{
    document.querySelectorAll('#mainTable tbody tr.data-row').forEach(r => {{
      r.style.display = r.dataset.email ? '' : 'none';
    }});
    document.querySelectorAll('#mobileList .biz-card').forEach(c => {{
      c.style.display = c.dataset.email ? '' : 'none';
    }});
    return;
  }}
  filterTable();
}}

function filterTable() {{
  const search = document.getElementById('search').value.toLowerCase();
  const status = document.getElementById('filterStatus').value;
  const heat   = document.getElementById('filterHeat').value;
  selectedIdx  = -1;

  document.querySelectorAll('#mainTable tbody tr.data-row').forEach(row => {{
    const issues = parseInt(row.dataset.issues || '0');
    const st     = row.dataset.status || '';
    const name   = (row.dataset.name  || '').toLowerCase();
    const email  = (row.dataset.email || '').toLowerCase();
    const ms = !search || name.includes(search) || email.includes(search);
    const mst = !status || st === status;
    const mh  = !heat ||
      (heat === 'hot'  && issues >= 10) ||
      (heat === 'warm' && issues >= 4 && issues < 10) ||
      (heat === 'mild' && issues >= 1 && issues < 4);
    row.style.display = (ms && mst && mh) ? '' : 'none';
  }});

  document.querySelectorAll('#mobileList .biz-card').forEach(card => {{
    const issues = parseInt(card.dataset.issues || '0');
    const st     = card.dataset.status || '';
    const ms = !search || (card.dataset.name||'').includes(search) || (card.dataset.email||'').includes(search);
    const mst = !status || st === status;
    const mh  = !heat ||
      (heat === 'hot'  && issues >= 10) ||
      (heat === 'warm' && issues >= 4 && issues < 10) ||
      (heat === 'mild' && issues >= 1 && issues < 4);
    card.style.display = (ms && mst && mh) ? '' : 'none';
  }});
}}

// Click en fila = seleccionar
document.addEventListener('DOMContentLoaded', () => {{
  document.querySelectorAll('#mainTable tbody tr.data-row').forEach((row, i) => {{
    row.addEventListener('click', () => {{ selectRow(i); togglePreview(row.dataset.rowid); }});
  }});
}});
</script>
</body>
</html>"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("csv_file")
    parser.add_argument("--open", action="store_true")
    args = parser.parse_args()

    csv_path = Path(args.csv_file).resolve()
    date_str = csv_path.stem  # nombre del archivo = fecha
    log_path = csv_path.with_suffix(".log")
    html_path = csv_path.with_suffix(".html")

    if not csv_path.exists():
        print(f"ERROR: no existe {csv_path}")
        sys.exit(1)

    with open(csv_path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    html = generate_html(rows, date_str, str(csv_path), str(log_path))
    html_path.write_text(html, encoding="utf-8")
    print(f"✓ Report generado: {html_path}")

    if args.open:
        os.system(f'open "{html_path}"')


if __name__ == "__main__":
    main()
