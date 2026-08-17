"""
Faithful Python port of SiteSafe's client-side accessibility scanner.

The real product scans HTML in the browser (src/scanner/engine.ts) by running
11 WCAG checks (src/scanner/checks/*.ts) against a DOMParser Document, then
computing a 0-100 score (src/scanner/scoring.ts). This module reimplements
the SAME detection logic and severities using BeautifulSoup instead of
DOMParser, so a server-side/CLI process (e.g. a monthly re-scan for
Compliance Shield monitoring) can compute the same score without a browser.

No network calls. Pure library module — import run_full_scan() and call it
with raw HTML.

Kept in sync with (as of this port):
  src/scanner/checks/alt-text.ts
  src/scanner/checks/aria-roles.ts
  src/scanner/checks/auto-play-media.ts
  src/scanner/checks/color-contrast.ts (+ src/scanner/color-utils.ts)
  src/scanner/checks/duplicate-ids.ts
  src/scanner/checks/empty-interactive.ts
  src/scanner/checks/form-labels.ts
  src/scanner/checks/heading-hierarchy.ts
  src/scanner/checks/lang-attribute.ts
  src/scanner/checks/link-text.ts
  src/scanner/checks/table-headers.ts
  src/scanner/scoring.ts
  src/scanner/engine.ts

If the TS checks change, this file must be updated to match — it does NOT
import or call the TS scanner in any way.
"""

from __future__ import annotations

import re
from typing import Optional

from bs4 import BeautifulSoup, Tag

Severity = str  # 'critical' | 'serious' | 'moderate' | 'minor'

# ── scoring.ts ────────────────────────────────────────────────────────────

SEVERITY_POINTS = {"critical": 10, "serious": 5, "moderate": 3, "minor": 1}
MAX_SCORE = 100
MAX_PENALTY = 100


def _calculate_score(severities: list[Severity], passed_checks: int) -> int:
    """Port of calculateScore() in scoring.ts. Must match exactly."""
    if len(severities) == 0:
        return MAX_SCORE

    total_penalty = sum(SEVERITY_POINTS.get(s, 1) for s in severities)
    normalized_penalty = min(total_penalty, MAX_PENALTY)
    score = MAX_SCORE - normalized_penalty

    # Bonus for passed checks
    passed_bonus = min(passed_checks * 2, 15)

    final = max(0, min(MAX_SCORE, round(score + passed_bonus)))
    # Never show 100 if there are issues — cap at 99
    return min(final, 99) if len(severities) > 0 else final


# ── color-utils.ts ────────────────────────────────────────────────────────

NAMED_COLORS: dict[str, tuple[int, int, int]] = {
    "white": (255, 255, 255),
    "black": (0, 0, 0),
    "red": (255, 0, 0),
    "green": (0, 128, 0),
    "blue": (0, 0, 255),
    "yellow": (255, 255, 0),
    "orange": (255, 165, 0),
    "purple": (128, 0, 128),
    "gray": (128, 128, 128),
    "grey": (128, 128, 128),
    "transparent": (0, 0, 0),
}

_HEX_COLOR_RE = re.compile(r"^#([0-9a-f]{3,8})$", re.IGNORECASE)
_RGB_COLOR_RE = re.compile(r"rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)")


def parse_color(color: Optional[str]) -> Optional[tuple[int, int, int]]:
    """Port of parseColor() in color-utils.ts."""
    if not color:
        return None
    color = color.strip().lower()

    if color in NAMED_COLORS:
        return NAMED_COLORS[color]

    hex_match = _HEX_COLOR_RE.match(color)
    if hex_match:
        hex_str = hex_match.group(1)
        if len(hex_str) == 3:
            hex_str = "".join(ch * 2 for ch in hex_str)
        # Mirrors the TS code exactly: it always slices [0:2] [2:4] [4:6]
        # regardless of the actual length (e.g. an 8-digit #rrggbbaa hex
        # just silently ignores the trailing alpha channel).
        try:
            return (
                int(hex_str[0:2], 16),
                int(hex_str[2:4], 16),
                int(hex_str[4:6], 16),
            )
        except ValueError:
            return None

    rgb_match = _RGB_COLOR_RE.search(color)
    if rgb_match:
        return (int(rgb_match.group(1)), int(rgb_match.group(2)), int(rgb_match.group(3)))

    return None


def _srgb_to_linear(channel: float) -> float:
    c = channel / 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def relative_luminance(r: float, g: float, b: float) -> float:
    return 0.2126 * _srgb_to_linear(r) + 0.7152 * _srgb_to_linear(g) + 0.0722 * _srgb_to_linear(b)


def contrast_ratio(color1: tuple[int, int, int], color2: tuple[int, int, int]) -> float:
    l1 = relative_luminance(*color1)
    l2 = relative_luminance(*color2)
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


def calculate_contrast_ratio(c1: str, c2: str) -> float:
    color1 = parse_color(c1)
    color2 = parse_color(c2)
    if not color1 or not color2:
        return 0
    return contrast_ratio(color1, color2)


# ── checks/alt-text.ts ───────────────────────────────────────────────────

# Same order/patterns as TRACKING_PATTERNS in alt-text.ts. Note the last
# pattern (t\.co/i) is exactly what the TS source has — it literally
# matches the substring "t.co/i", not "t.co" followed by anything.
_TRACKING_PATTERNS = [re.compile(p, re.IGNORECASE) for p in [
    r"facebook\.com/tr",
    r"google-analytics\.com",
    r"googletagmanager\.com",
    r"doubleclick\.net",
    r"pixel\.",
    r"tracking\.",
    r"analytics\.",
    r"beacon\.",
    r"\.gif\?",
    r"pagead",
    r"adservice",
    r"hotjar\.com",
    r"clarity\.ms",
    r"hubspot\.com.*/tracking",
    r"bat\.bing\.com",
    r"linkedin\.com/px",
    r"snap\.licdn\.com",
    r"ads\.linkedin",
    r"t\.co/i",
]]


def _is_tracking_pixel(img: Tag) -> bool:
    src = img.get("src") or ""
    if any(p.search(src) for p in _TRACKING_PATTERNS):
        return True
    w = img.get("width")
    h = img.get("height")
    if w in ("1", "0") and h in ("1", "0"):
        return True
    return False


def check_alt_text(soup: BeautifulSoup) -> list[Severity]:
    severities: list[Severity] = []

    # <img> — alt="" is valid (decorative). Only missing (alt attribute
    # absent entirely) is flagged, and tracking pixels are excluded.
    for img in soup.find_all("img"):
        alt = img.get("alt")
        if alt is None and not _is_tracking_pixel(img):
            severities.append("critical")

    # <input type="image">
    for inp in soup.find_all("input", attrs={"type": "image"}):
        alt = inp.get("alt")
        if alt is None or alt.strip() == "":
            severities.append("critical")

    # <area>
    for area in soup.find_all("area"):
        alt = area.get("alt")
        if alt is None or alt.strip() == "":
            severities.append("critical")

    return severities


# ── checks/aria-roles.ts ─────────────────────────────────────────────────

VALID_ARIA_ROLES = {
    "alert", "alertdialog", "application", "article", "banner", "button", "cell",
    "checkbox", "columnheader", "combobox", "complementary", "contentinfo",
    "definition", "dialog", "directory", "document", "feed", "figure", "form",
    "grid", "gridcell", "group", "heading", "img", "link", "list", "listbox",
    "listitem", "log", "main", "marquee", "math", "menu", "menubar", "menuitem",
    "menuitemcheckbox", "menuitemradio", "navigation", "none", "note", "option",
    "presentation", "progressbar", "radio", "radiogroup", "region", "row",
    "rowgroup", "rowheader", "scrollbar", "search", "searchbox", "separator",
    "slider", "spinbutton", "status", "switch", "tab", "table", "tablist",
    "tabpanel", "term", "textbox", "timer", "toolbar", "tooltip", "tree",
    "treegrid", "treeitem",
}

ARIA_ID_ATTRIBUTES = ["aria-labelledby", "aria-describedby", "aria-controls", "aria-owns"]


def check_aria_roles(soup: BeautifulSoup) -> list[Severity]:
    severities: list[Severity] = []

    # All IDs in the document, for aria-* reference validation.
    element_ids: set[str] = set()
    for el in soup.find_all(attrs={"id": True}):
        eid = el.get("id")
        if eid:
            element_ids.add(eid)

    # Invalid role values.
    for el in soup.find_all(attrs={"role": True}):
        role = el.get("role")
        if role and role not in VALID_ARIA_ROLES:
            severities.append("serious")

    # aria-* attributes referencing non-existent IDs (space-separated lists).
    for el in soup.find_all(True):
        if not any(el.has_attr(attr) for attr in ARIA_ID_ATTRIBUTES):
            continue
        for attr_name in ARIA_ID_ATTRIBUTES:
            attr_value = el.get(attr_name)
            if attr_value:
                ids = [i for i in re.split(r"\s+", attr_value) if i]
                for _id in ids:
                    if _id not in element_ids:
                        severities.append("serious")

    return severities


# ── checks/auto-play-media.ts ────────────────────────────────────────────

def check_autoplay_media(soup: BeautifulSoup) -> list[Severity]:
    severities: list[Severity] = []
    for el in soup.find_all(["video", "audio"]):
        has_autoplay = el.has_attr("autoplay")
        has_controls = el.has_attr("controls")
        if has_autoplay and not has_controls:
            severities.append("serious")
        elif has_autoplay:
            severities.append("moderate")
    return severities


# ── checks/color-contrast.ts ─────────────────────────────────────────────

_CONTRAST_TEXT_TAGS = ["p", "span", "h1", "h2", "h3", "h4", "h5", "h6", "a", "li", "td", "th", "label", "button"]

_FONT_SIZE_RE = re.compile(r"font-size\s*:\s*(\d+(?:\.\d+)?)(px|pt|em|rem)?", re.IGNORECASE)
_FONT_WEIGHT_RE = re.compile(r"font-weight\s*:\s*(\d+|bold|bolder)", re.IGNORECASE)


def _get_font_size_px(style: Optional[str]) -> float:
    if style:
        m = _FONT_SIZE_RE.search(style)
        if m:
            size = float(m.group(1))
            unit = (m.group(2) or "px").lower()
            if unit in ("em", "rem"):
                return size * 16
            if unit == "pt":
                return size * (4 / 3)
            return size
    return 16


def _is_font_weight_bold(tag: Tag, style: Optional[str]) -> bool:
    if style:
        m = _FONT_WEIGHT_RE.search(style)
        if m:
            weight = m.group(1).lower()
            if weight in ("bold", "bolder"):
                return True
            try:
                return int(weight) >= 700
            except ValueError:
                return False
    return tag.name in ("strong", "b", "th")


def _is_large_text(tag: Tag) -> bool:
    style = tag.get("style")
    font_size = _get_font_size_px(style)
    is_bold = _is_font_weight_bold(tag, style)
    if font_size >= 24:
        return True
    if is_bold and font_size >= 18.67:
        return True
    return False


def _get_color_from_style(style: Optional[str], prop: str) -> Optional[str]:
    # NOTE: intentionally NOT case-insensitive and NOT word-boundary
    # anchored — this exactly mirrors getColorFromInlineStyle() in
    # color-contrast.ts, including its quirk where prop="color" can match
    # inside "background-color: ..." because the regex is unanchored.
    if not style:
        return None
    m = re.search(rf"{prop}\s*:\s*([^;]+)", style)
    return m.group(1).strip() if m else None


def _get_element_colors(el: Tag) -> tuple[Optional[str], Optional[str]]:
    style = el.get("style")
    fg = _get_color_from_style(style, "color")
    bg = _get_color_from_style(style, "background-color")
    return fg, bg


def check_color_contrast(soup: BeautifulSoup) -> list[Severity]:
    severities: list[Severity] = []

    for el in soup.find_all(_CONTRAST_TEXT_TAGS):
        text = el.get_text()
        if not text or not text.strip():
            continue

        fg, bg = _get_element_colors(el)
        if fg and bg and parse_color(fg) and parse_color(bg):
            ratio = calculate_contrast_ratio(fg, bg)
            is_large = _is_large_text(el)
            required_ratio = 3 if is_large else 4.5

            if ratio < required_ratio:
                severities.append("moderate" if is_large else "serious")

    return severities


# ── checks/duplicate-ids.ts ──────────────────────────────────────────────

def check_duplicate_ids(soup: BeautifulSoup) -> list[Severity]:
    severities: list[Severity] = []
    id_map: dict[str, list[Tag]] = {}

    for el in soup.find_all(attrs={"id": True}):
        eid = el.get("id")
        if eid and eid.strip():
            id_map.setdefault(eid, []).append(el)

    for eid, elements in id_map.items():
        if len(elements) > 1:
            severities.append("serious")

    return severities


# ── checks/empty-interactive.ts ──────────────────────────────────────────

def _has_accessible_label(el: Tag) -> bool:
    aria_label = el.get("aria-label")
    if aria_label and aria_label.strip():
        return True

    aria_labelledby = el.get("aria-labelledby")
    if aria_labelledby and aria_labelledby.strip():
        return True

    title = el.get("title")
    if title and title.strip():
        return True

    text = el.get_text()
    if text and text.strip():
        return True

    for img in el.find_all("img"):
        alt = img.get("alt")
        if alt and alt.strip():
            return True

    return False


def check_empty_interactive(soup: BeautifulSoup) -> list[Severity]:
    severities: list[Severity] = []

    for button in soup.find_all("button"):
        if not _has_accessible_label(button):
            severities.append("critical")

    for link in soup.find_all("a"):
        if not _has_accessible_label(link):
            severities.append("serious")

    return severities


# ── checks/form-labels.ts ────────────────────────────────────────────────

_SKIP_INPUT_TYPES = {"hidden", "submit", "reset", "button", "image"}


def _has_label(soup: BeautifulSoup, el: Tag) -> bool:
    eid = el.get("id")
    aria_label = el.get("aria-label")
    aria_labelledby = el.get("aria-labelledby")
    title = el.get("title")

    if aria_label or aria_labelledby:
        return True

    if title:
        return True

    # Wrapping <label>
    parent = el.parent
    while parent is not None:
        if getattr(parent, "name", None) == "label":
            return True
        parent = parent.parent

    # <label for="id">
    if eid:
        label = soup.find("label", attrs={"for": eid})
        if label:
            return True

    return False


def check_form_labels(soup: BeautifulSoup) -> list[Severity]:
    severities: list[Severity] = []

    for el in soup.find_all(["input", "select", "textarea"]):
        el_type = (el.get("type") or "").lower()

        # Skip hidden inputs and buttons (radio and checkbox DO need labels).
        if el_type in _SKIP_INPUT_TYPES:
            continue

        if not _has_label(soup, el):
            severities.append("critical")

    return severities


# ── checks/heading-hierarchy.ts ──────────────────────────────────────────

def check_heading_hierarchy(soup: BeautifulSoup) -> list[Severity]:
    severities: list[Severity] = []

    headings = soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6"])
    levels = [int(h.name[1]) for h in headings]

    h1_count = levels.count(1)
    if h1_count == 0:
        severities.append("serious")
    elif h1_count > 1:
        severities.append("moderate")

    # Skipped heading levels (e.g. h1 -> h3). Only flags jumps > 1 level.
    for i in range(1, len(levels)):
        prev_level = levels[i - 1]
        current_level = levels[i]
        if current_level - prev_level > 1:
            severities.append("serious")

    return severities


# ── checks/lang-attribute.ts ─────────────────────────────────────────────

_LANG_CODE_RE = re.compile(r"^[a-z]{2,3}(-[a-z0-9]{2,8})*$", re.IGNORECASE)


def check_lang_attribute(soup: BeautifulSoup) -> list[Severity]:
    html_tag = soup.find("html")
    lang_attr = html_tag.get("lang") if html_tag else None

    if not lang_attr:
        return ["critical"]

    if lang_attr.strip() == "":
        return ["critical"]

    if not _LANG_CODE_RE.match(lang_attr):
        return ["serious"]

    return []


# ── checks/link-text.ts ──────────────────────────────────────────────────

_NON_DESCRIPTIVE_LINK_TEXTS = {"click here", "read more", "learn more", "here", "more", "link", "this"}


def _is_non_descriptive(text: str) -> bool:
    return text.strip().lower() in _NON_DESCRIPTIVE_LINK_TEXTS


def check_link_text(soup: BeautifulSoup) -> list[Severity]:
    severities: list[Severity] = []

    for link in soup.find_all("a"):
        href = link.get("href")

        # Skip links without href or anchor-only links.
        if not href or href in ("#", ""):
            continue

        link_text = (link.get_text() or "").strip()

        aria_label = link.get("aria-label")
        has_label = bool(aria_label and aria_label.strip()) or bool(link.get("aria-labelledby"))

        if link_text == "" and not has_label:
            severities.append("serious")
        elif _is_non_descriptive(link_text) and not has_label:
            severities.append("moderate")

    return severities


# ── checks/table-headers.ts ──────────────────────────────────────────────

def check_table_headers(soup: BeautifulSoup) -> list[Severity]:
    severities: list[Severity] = []

    for table in soup.find_all("table"):
        th_elements = table.find_all("th")

        if len(th_elements) == 0:
            severities.append("serious")
        else:
            th_without_scope = [th for th in th_elements if not th.get("scope")]
            if th_without_scope:
                severities.append("moderate")

        caption = table.find("caption")
        if not caption:
            severities.append("minor")

    return severities


# ── engine.ts ─────────────────────────────────────────────────────────────

_CHECK_FUNCTIONS = [
    check_alt_text,
    check_color_contrast,
    check_form_labels,
    check_heading_hierarchy,
    check_link_text,
    check_lang_attribute,
    check_empty_interactive,
    check_duplicate_ids,
    check_table_headers,
    check_aria_roles,
    check_autoplay_media,
]


def run_full_scan(html: str) -> dict:
    """Parses `html` once and runs all 11 WCAG checks (port of runScan() in
    engine.ts), returning counts + the same 0-100 score formula as the
    real product. Does not build full ScanIssue objects — counts only.
    """
    soup = BeautifulSoup(html, "html.parser")

    all_severities: list[Severity] = []
    passed_checks = 0

    for check_fn in _CHECK_FUNCTIONS:
        try:
            severities = check_fn(soup)
        except Exception:
            # Mirrors engine.ts's try/catch per check: a failing check is
            # skipped entirely — it counts neither as passed nor as issues.
            continue

        if len(severities) == 0:
            passed_checks += 1
        else:
            all_severities.extend(severities)

    score = _calculate_score(all_severities, passed_checks)

    return {
        "score": score,
        "total_issues": len(all_severities),
        "critical_count": all_severities.count("critical"),
        "serious_count": all_severities.count("serious"),
        "moderate_count": all_severities.count("moderate"),
        "minor_count": all_severities.count("minor"),
        "passed_checks": passed_checks,
    }
