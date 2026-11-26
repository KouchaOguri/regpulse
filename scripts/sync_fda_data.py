#!/usr/bin/env python3
"""
RegPulse Official FDA Data Ingestion Pipeline (v1.2)
- Pulls targeted Dietary Supplements, Cosmetics, OTC/Unapproved Drugs, and Device recalls from openFDA
- Pulls BOTH raw & non-talc cosmetic adverse event trends from api.fda.gov/cosmetic/event.json
- Decodes HTML entities cleanly on FDA.gov Recalls RSS
- Emits src/data/sync_manifest.json with endpoint URLs, HTTP statuses, counts, and SHA-256 hashes
"""

import hashlib
import html
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "src" / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

API_KEY = os.environ.get("FDA_API_KEY", "").strip()
USER_AGENT = "RegPulse-Regulatory-Sync/1.2 (+https://github.com/KouchaOguri/regpulse)"

ENDPOINT_LOG: list[dict] = []


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def clean_truncate(text: str, max_len: int) -> str:
    t = html.unescape(re.sub(r"<[^>]+>", "", text or "")).strip()
    t = re.sub(r"\s+", " ", t)
    if len(t) <= max_len:
        return t
    cut = t[: max_len - 1].rsplit(" ", 1)[0]
    return (cut or t[: max_len - 1]).rstrip(".,;:- ") + "…"


def http_get_with_status(url: str, timeout: int = 25) -> tuple[int, bytes]:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/json, application/xml, */*",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.status, resp.read()


def openfda_fetch(path: str, params: dict) -> dict:
    q = dict(params)
    if API_KEY:
        q["api_key"] = API_KEY
    qs = urllib.parse.urlencode(q, safe=":+[]\"'()")
    url = f"https://api.fda.gov/{path}?{qs}"
    redacted_url = re.sub(r"api_key=[^&]+", "api_key=REDACTED", url)
    for attempt in range(3):
        try:
            status, raw = http_get_with_status(url)
            parsed = json.loads(raw.decode("utf-8"))
            ENDPOINT_LOG.append({
                "url": redacted_url,
                "httpStatus": status,
                "recordsReturned": len(parsed.get("results", [])),
                "totalReportedByApi": parsed.get("meta", {}).get("results", {}).get("total"),
                "fetchedAtUtc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            })
            return parsed
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 2:
                time.sleep(2 * (attempt + 1))
                continue
            print(f"[WARN] HTTP {e.code} on {path}: {e}")
            ENDPOINT_LOG.append({
                "url": redacted_url,
                "httpStatus": e.code,
                "recordsReturned": 0,
                "error": str(e),
                "fetchedAtUtc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            })
            return {}
        except Exception as e:
            if attempt < 2:
                time.sleep(1.5)
                continue
            print(f"[WARN] Error on {path}: {e}")
            ENDPOINT_LOG.append({
                "url": redacted_url,
                "httpStatus": 0,
                "recordsReturned": 0,
                "error": str(e),
                "fetchedAtUtc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            })
            return {}
    return {}


def format_fda_date(raw: str) -> str:
    if not raw or len(raw) < 8:
        return raw or ""
    d = re.sub(r"[^0-9]", "", raw)
    if len(d) >= 8:
        return f"{d[:4]}-{d[4:6]}-{d[6:8]}"
    return raw


def slugify(text: str, max_len: int = 64) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")
    return s[:max_len].strip("-") or "record"


def infer_vertical(category: str, desc: str, reason: str) -> str:
    blob = f"{desc} {reason}".lower()
    food_dairy_guard = any(k in blob for k in [
        "ice cream", "creamery", "yogurt", "butter", "cheese", "sandwich", "bakery",
        "cookie", "cake", "chocolate", "sour cream", "whipped cream", "salad", "sauce",
        "tortilla", "snack", "bread", "pasta", "noodle", "candy", "cereal", "beverage",
    ])
    if not food_dairy_guard and category != "food" and any(k in blob for k in [
        "cosmetic", "lotion", "serum", "cream", "shampoo", "conditioner", "mascara",
        "makeup", "sunscreen", "eyelash", "facial", "cleanser", "lip balm", "deodorant",
        "moisturizer", "skin lightening", "skincare", "body wash", "toner", "ointment"
    ]) and "pericare" not in blob and "hospital" not in blob:
        return "Cosmetics & Skincare"
    if any(k in blob for k in [
        "dietary supplement", "supplement", "capsule", "gummy", "gummies", "vitamin",
        "herbal", "botanical", "probiotic", "collagen", "sildenafil", "tadalafil",
        "sibutramine", "weight loss", "sexual enhancement", "male enhancement",
        "yohimbine", "berberine", "ashwagandha", "turmeric", "melatonin", "magnesium"
    ]):
        return "Dietary Supplements"
    if category == "device":
        return "Medical & Beauty Devices"
    if category == "drug":
        return "OTC & Unapproved Drugs"
    return "Food & Consumables"


def extract_risk_tags(reason: str, desc: str) -> list[str]:
    blob = f"{reason} {desc}".lower()
    tags = []
    checks = [
        ("Unapproved New Drug", ["unapproved new drug", "unapproved drug", "new drug without"]),
        ("Tainted / Hidden Drug API", ["sildenafil", "tadalafil", "sibutramine", "diclofenac", "dexamethasone", "phenolphthalein", "tainted", "hidden drug", "active pharmaceutical", "undeclared drug"]),
        ("Undeclared Allergen / Colorant", ["undeclared allergen", "undeclared milk", "undeclared soy", "undeclared wheat", "undeclared peanut", "undeclared tree nut", "undeclared egg", "undeclared sesame", "undeclared sulfite", "undeclared yellow", "undeclared red", "undeclared blue", "undeclared fd&c", "undeclared"]),
        ("Misbranding / Label Defect", ["misbranded", "mislabeled", "label", "packaging"]),
        ("CGMP / Contamination", ["cgmp", "good manufacturing", "insanitary", "sterility", "microbial", "contamination", "salmonella", "listeria", "mold", "bacteria", "foreign material"]),
        ("Heavy Metals / Chemical", ["lead", "mercury", "arsenic", "cadmium", "benzene", "ethylene oxide", "methanol", "thallium"]),
        ("510(k) / Clearance Issue", ["510(k)", "without marketing clearance", "without clearance", "unapproved device"]),
    ]
    for label, kws in checks:
        if any(k in blob for k in kws):
            tags.append(label)
    if not tags:
        tags.append("Regulatory Enforcement")
    return tags[:3]


def parse_enforcement_results(category: str, results: list[dict]) -> list[dict]:
    records = []
    for r in results:
        recall_num = (r.get("recall_number") or r.get("event_id") or "").strip()
        if not recall_num:
            continue
        firm = html.unescape((r.get("recalling_firm") or "Unknown Firm").strip())
        desc = html.unescape((r.get("product_description") or "").strip())
        reason = html.unescape((r.get("reason_for_recall") or "").strip())
        report_date = format_fda_date(r.get("report_date", ""))
        init_date = format_fda_date(r.get("recall_initiation_date", ""))
        vertical = infer_vertical(category, desc, reason)
        rec_id = slugify(f"{category}-{recall_num}-{firm[:28]}", 72)
        records.append({
            "id": rec_id,
            "recallNumber": recall_num,
            "eventId": str(r.get("event_id") or ""),
            "sourceCategory": category,
            "vertical": vertical,
            "classification": (r.get("classification") or "Unclassified").strip(),
            "status": (r.get("status") or "").strip(),
            "recallingFirm": firm,
            "city": (r.get("city") or "").strip(),
            "state": (r.get("state") or "").strip(),
            "country": (r.get("country") or "").strip(),
            "productShort": clean_truncate(desc, 110),
            "productDescription": clean_truncate(desc, 600),
            "reasonForRecall": clean_truncate(reason, 700),
            "reportDate": report_date,
            "initiationDate": init_date,
            "voluntaryMandated": (r.get("voluntary_mandated") or "").strip(),
            "distributionPattern": clean_truncate(r.get("distribution_pattern") or "", 300),
            "riskTags": extract_risk_tags(reason, desc),
            "officialSourceUrl": f"https://api.fda.gov/{category}/enforcement.json?search=recall_number:%22{urllib.parse.quote(recall_num)}%22",
        })
    return records


def fetch_enforcement(category: str, limit: int = 80, search: str | None = None) -> list[dict]:
    params: dict = {"sort": "report_date:desc", "limit": limit}
    if search:
        params["search"] = search
    data = openfda_fetch(f"{category}/enforcement.json", params)
    return parse_enforcement_results(category, data.get("results", []))


def fetch_cosmetic_trends() -> dict:
    total_meta = openfda_fetch("cosmetic/event.json", {"limit": 1})
    total_events = total_meta.get("meta", {}).get("results", {}).get("total", 0)
    top_reactions_raw = openfda_fetch("cosmetic/event.json", {"count": "reactions.exact", "limit": 15}).get("results", [])

    # Query non-talc skincare/hair/beauty reactions (excluding baby powder / talc mass-tort litigation noise)
    non_talc_meta = openfda_fetch(
        "cosmetic/event.json",
        {"search": "NOT+products.product_name:(powder+talc)", "limit": 1},
    )
    non_talc_total = non_talc_meta.get("meta", {}).get("results", {}).get("total", 0)
    non_talc_reactions = openfda_fetch(
        "cosmetic/event.json",
        {"search": "NOT+products.product_name:(powder+talc)", "count": "reactions.exact", "limit": 15},
    ).get("results", [])

    # Filter out obvious talc-litigation cancer terms if any remain from unnamed talc entries
    litigation_terms = {"ovarian cancer", "fallopian tube cancer", "mesothelioma", "death", "cervix carcinoma", "uterine cancer"}
    skincare_reactions = [
        r for r in non_talc_reactions
        if not any(lt in (r.get("term") or "").lower() for lt in litigation_terms)
    ][:10]

    return {
        "totalEventsInOpenFDA": total_events,
        "nonTalcEventsCount": non_talc_total,
        "topReactionsAll": top_reactions_raw[:10],
        "topReactions": skincare_reactions if skincare_reactions else non_talc_reactions[:10],
        "methodologyNote": (
            "Raw openFDA cosmetic adverse event totals include tens of thousands of historical talc/baby-powder "
            "litigation filings (Ovarian Cancer / Death). RegPulse queries openFDA excluding powder/talc entries "
            "so beauty brands see actionable skincare, haircare, and topical adverse-event signals."
        ),
    }


def fetch_510k_recent(limit: int = 40) -> list[dict]:
    data = openfda_fetch("device/510k.json", {"sort": "decision_date:desc", "limit": limit})
    out = []
    for r in data.get("results", []):
        knum = (r.get("k_number") or "").strip()
        if not knum:
            continue
        out.append({
            "kNumber": knum,
            "deviceName": clean_truncate(r.get("device_name") or "", 180),
            "applicant": clean_truncate(r.get("applicant") or "", 130),
            "countryCode": (r.get("country_code") or "").strip(),
            "productCode": (r.get("product_code") or "").strip(),
            "advisoryCommittee": (r.get("advisory_committee_description") or "").strip(),
            "decisionDate": format_fda_date(r.get("decision_date", "")),
            "decisionCode": (r.get("decision_code") or "").strip(),
            "statementOrSummary": (r.get("statement_or_summary") or "").strip(),
            "fdaUrl": f"https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID={urllib.parse.quote(knum)}",
        })
    return out


def fetch_fda_recalls_rss(limit: int = 20) -> list[dict]:
    url = "https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/recalls/rss.xml"
    try:
        status, raw = http_get_with_status(url)
        root = ET.fromstring(raw)
        items = []
        for item in root.findall(".//item")[:limit]:
            title = clean_truncate(item.findtext("title") or "", 200)
            link = (item.findtext("link") or "").strip()
            pub_date = (item.findtext("pubDate") or "").strip()
            desc = clean_truncate(item.findtext("description") or "", 360)
            if title and link:
                items.append({
                    "title": title,
                    "link": link,
                    "pubDate": pub_date,
                    "summary": desc,
                })
        ENDPOINT_LOG.append({
            "url": url,
            "httpStatus": status,
            "recordsReturned": len(items),
            "fetchedAtUtc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        })
        return items
    except Exception as e:
        print(f"[WARN] RSS fetch failed: {e}")
        ENDPOINT_LOG.append({
            "url": url,
            "httpStatus": 0,
            "recordsReturned": 0,
            "error": str(e),
            "fetchedAtUtc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        })
        return []


def main() -> None:
    print("Syncing live FDA data from openFDA (targeted e-commerce verticals + recent enforcement) & FDA.gov RSS...")
    # Targeted e-commerce relevant queries so Supplements & Cosmetics aren't buried under bulk food/hospital noise
    sup_food = fetch_enforcement(
        "food",
        limit=65,
        search='product_description:(supplement+OR+capsule+OR+gummy+OR+vitamin+OR+herbal+OR+probiotic+OR+collagen)',
    )
    time.sleep(0.3)
    cos_drug = fetch_enforcement(
        "drug",
        limit=65,
        search='product_description:(cream+OR+serum+OR+lotion+OR+shampoo+OR+sunscreen+OR+skin+OR+ointment+OR+cleanser)',
    )
    time.sleep(0.3)
    tainted_drug = fetch_enforcement(
        "drug",
        limit=50,
        search='reason_for_recall:(sildenafil+OR+tadalafil+OR+sibutramine+OR+unapproved+OR+undeclared)',
    )
    time.sleep(0.3)
    recent_food = fetch_enforcement("food", limit=45)
    time.sleep(0.3)
    recent_device = fetch_enforcement("device", limit=45)
    time.sleep(0.3)

    # Deduplicate by recallNumber AND collapse duplicate firm+reason clusters (keep max 2 per firm+reason)
    seen_num = set()
    firm_reason_counts: dict[tuple[str, str], int] = {}
    all_recalls = []
    for rec in sup_food + cos_drug + tainted_drug + recent_food + recent_device:
        key = (rec["sourceCategory"], rec["recallNumber"])
        if key in seen_num:
            continue
        fr_key = (rec["recallingFirm"].lower(), rec["reasonForRecall"][:70].lower())
        if firm_reason_counts.get(fr_key, 0) >= 2:
            continue
        seen_num.add(key)
        firm_reason_counts[fr_key] = firm_reason_counts.get(fr_key, 0) + 1
        all_recalls.append(rec)

    all_recalls.sort(key=lambda x: x.get("reportDate", ""), reverse=True)

    cosmetic_trends = fetch_cosmetic_trends()
    time.sleep(0.3)
    clearances_510k = fetch_510k_recent(limit=40)
    time.sleep(0.25)
    rss_alerts = fetch_fda_recalls_rss(limit=20)

    by_vertical: dict[str, int] = {}
    by_class: dict[str, int] = {}
    for r in all_recalls:
        by_vertical[r["vertical"]] = by_vertical.get(r["vertical"], 0) + 1
        by_class[r["classification"]] = by_class.get(r["classification"], 0) + 1

    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    # Preserve existing Warning Letters metadata & manifest provenance if already synced on disk
    existing_meta = {}
    meta_path = DATA_DIR / "metadata.json"
    if meta_path.exists():
        try:
            existing_meta = json.loads(meta_path.read_text(encoding="utf-8"))
        except Exception:
            existing_meta = {}
    existing_manifest = {}
    manifest_path = DATA_DIR / "sync_manifest.json"
    if manifest_path.exists():
        try:
            existing_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except Exception:
            existing_manifest = {}

    wl_path = DATA_DIR / "warning_letters.json"
    wl_count = 0
    if wl_path.exists():
        try:
            wl_count = len(json.loads(wl_path.read_text(encoding="utf-8")))
        except Exception:
            wl_count = 0

    metadata = {
        "lastSyncedUtc": now_iso,
        "lastSyncedDisplay": datetime.now(timezone.utc).strftime("%b %d, %Y · %H:%M UTC"),
        "totalRecallsIndexed": len(all_recalls),
        "total510kIndexed": len(clearances_510k),
        "totalRssAlerts": len(rss_alerts),
        "totalWarningLettersIndexed": wl_count or existing_meta.get("totalWarningLettersIndexed", 0),
        "warningLettersLastSyncedUtc": existing_meta.get("warningLettersLastSyncedUtc", now_iso),
        "cosmeticEventsInOpenFDA": cosmetic_trends.get("totalEventsInOpenFDA", 0),
        "nonTalcCosmeticEvents": cosmetic_trends.get("nonTalcEventsCount", 0),
        "countsByVertical": by_vertical,
        "countsByClassification": by_class,
        "sources": [
            "https://api.fda.gov/food/enforcement.json",
            "https://api.fda.gov/drug/enforcement.json",
            "https://api.fda.gov/device/enforcement.json",
            "https://api.fda.gov/device/510k.json",
            "https://api.fda.gov/cosmetic/event.json",
            "https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/recalls/rss.xml",
            "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/compliance-actions-and-activities/warning-letters",
        ],
    }

    written_files = {
        "recalls.json": all_recalls,
        "cosmetic_trends.json": cosmetic_trends,
        "clearances_510k.json": clearances_510k,
        "rss_alerts.json": rss_alerts,
        "metadata.json": metadata,
    }
    file_hashes = {}
    for fname, obj in written_files.items():
        p = DATA_DIR / fname
        p.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")
        file_hashes[fname] = {
            "sha256": sha256_file(p),
            "bytes": p.stat().st_size,
            "recordCount": len(obj) if isinstance(obj, list) else (obj.get("totalEventsInOpenFDA") if "totalEventsInOpenFDA" in obj else 1),
        }

    if wl_path.exists():
        file_hashes["warning_letters.json"] = {
            "sha256": sha256_file(wl_path),
            "bytes": wl_path.stat().st_size,
            "recordCount": wl_count,
        }

    preserved_wl_eps = [
        ep for ep in existing_manifest.get("endpoints", []) if "warning-letters" in ep.get("url", "")
    ]
    manifest = {
        "schemaVersion": "1.2",
        "syncedAtUtc": now_iso,
        "warningLettersSyncedAtUtc": existing_manifest.get("warningLettersSyncedAtUtc", now_iso),
        "apiKeyUsed": bool(API_KEY),
        "endpoints": ENDPOINT_LOG + preserved_wl_eps,
        "artifacts": file_hashes,
    }
    (DATA_DIR / "sync_manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    print(
        f"Sync complete: {len(all_recalls)} deduplicated recalls ({by_vertical}), "
        f"{len(clearances_510k)} 510(k) clearances, {len(rss_alerts)} RSS alerts, "
        f"{cosmetic_trends.get('totalEventsInOpenFDA', 0)} total / {cosmetic_trends.get('nonTalcEventsCount', 0)} non-talc cosmetic events."
    )


if __name__ == "__main__":
    main()
