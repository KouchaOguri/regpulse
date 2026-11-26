#!/usr/bin/env python3
"""
RegPulse Official FDA Data Ingestion Pipeline
Fetches real, live public regulatory data from openFDA APIs and FDA Recalls RSS.
Zero mock data. Respects openFDA rate limits and optional FDA_API_KEY.
"""

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
USER_AGENT = "RegPulse-Regulatory-Sync/1.0 (+https://github.com/KouchaOguri/regpulse)"


def http_get(url: str, timeout: int = 25) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json, application/xml, */*"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def openfda_fetch(path: str, params: dict) -> dict:
    q = dict(params)
    if API_KEY:
        q["api_key"] = API_KEY
    qs = urllib.parse.urlencode(q, safe=":+[]\"'")
    url = f"https://api.fda.gov/{path}?{qs}"
    for attempt in range(3):
        try:
            raw = http_get(url)
            return json.loads(raw.decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 2:
                time.sleep(2 * (attempt + 1))
                continue
            print(f"[WARN] HTTP {e.code} on {path}: {e}")
            return {}
        except Exception as e:
            if attempt < 2:
                time.sleep(1.5)
                continue
            print(f"[WARN] Error on {path}: {e}")
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
    if any(k in blob for k in ["cosmetic", "lotion", "serum", "cream", "shampoo", "mascara", "makeup", "sunscreen", "eyelash", "skin", "facial", "cleanser", "lip balm", "deodorant"]):
        return "Cosmetics & Skincare"
    if any(k in blob for k in ["supplement", "capsule", "tablet", "gummy", "gummies", "vitamin", "herbal", "botanical", "probiotic", "collagen", "extract", "sildenafil", "tadalafil", "sibutramine", "weight loss", "sexual enhancement", "energy", "dietary"]):
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
        ("Tainted / Hidden Drug API", ["sildenafil", "tadalafil", "sibutramine", "diclofenac", "dexamethasone", "phenolphthalein", "tainted", "hidden drug", "active pharmaceutical"]),
        ("Undeclared Allergen / Colorant", ["undeclared allergen", "undeclared milk", "undeclared soy", "undeclared wheat", "undeclared peanut", "undeclared tree nut", "undeclared egg", "undeclared sesame", "undeclared sulfite", "undeclared yellow", "undeclared red", "undeclared blue", "undeclared fd&c", "undeclared"]),
        ("Misbranding / Label Defect", ["misbranded", "mislabeled", "label", "packaging"]),
        ("CGMP / Contamination", ["cgmp", "good manufacturing", "insanitary", "sterility", "microbial", "contamination", "salmonella", "listeria", "mold", "bacteria", "foreign material"]),
        ("Heavy Metals / Chemical", ["lead", "mercury", "arsenic", "cadmium", "benzene", "ethylene oxide", "methanol"]),
        ("510(k) / Clearance Issue", ["510(k)", "without marketing clearance", "without clearance", "unapproved device"]),
    ]
    for label, kws in checks:
        if any(k in blob for k in kws):
            tags.append(label)
    if not tags:
        tags.append("Regulatory Enforcement")
    return tags[:3]


def fetch_enforcement(category: str, limit: int = 100) -> list[dict]:
    data = openfda_fetch(f"{category}/enforcement.json", {"sort": "report_date:desc", "limit": limit})
    results = data.get("results", [])
    records = []
    for r in results:
        recall_num = (r.get("recall_number") or r.get("event_id") or "").strip()
        if not recall_num:
            continue
        firm = (r.get("recalling_firm") or "Unknown Firm").strip()
        desc = (r.get("product_description") or "").strip()
        reason = (r.get("reason_for_recall") or "").strip()
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
            "productDescription": desc[:600],
            "reasonForRecall": reason[:700],
            "reportDate": report_date,
            "initiationDate": init_date,
            "voluntaryMandated": (r.get("voluntary_mandated") or "").strip(),
            "distributionPattern": (r.get("distribution_pattern") or "")[:300],
            "riskTags": extract_risk_tags(reason, desc),
            "officialSourceUrl": f"https://api.fda.gov/{category}/enforcement.json?search=recall_number:%22{urllib.parse.quote(recall_num)}%22",
        })
    return records


def fetch_cosmetic_trends() -> dict:
    total_meta = openfda_fetch("cosmetic/event.json", {"limit": 1})
    total_events = total_meta.get("meta", {}).get("results", {}).get("total", 0)
    top_categories = openfda_fetch("cosmetic/event.json", {"count": "outcomes.exact", "limit": 10}).get("results", [])
    top_reactions = openfda_fetch("cosmetic/event.json", {"count": "reactions.exact", "limit": 15}).get("results", [])
    recent_raw = openfda_fetch("cosmetic/event.json", {"sort": "initial_received_date:desc", "limit": 20}).get("results", [])
    recent = []
    for item in recent_raw:
        prods = item.get("products") or []
        prod_name = prods[0].get("product_name", "Unspecified Cosmetic") if prods else "Unspecified Cosmetic"
        industry = prods[0].get("industry_name", "Cosmetics") if prods else "Cosmetics"
        recent.append({
            "reportNumber": item.get("report_number", ""),
            "receivedDate": format_fda_date(item.get("initial_received_date", "")),
            "productName": prod_name[:140],
            "industryName": industry,
            "reactions": (item.get("reactions") or [])[:5],
            "outcomes": (item.get("outcomes") or [])[:3],
        })
    return {
        "totalEventsInOpenFDA": total_events,
        "topCategories": top_categories,
        "topReactions": top_reactions,
        "recentEvents": recent,
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
            "deviceName": (r.get("device_name") or "").strip()[:200],
            "applicant": (r.get("applicant") or "").strip()[:140],
            "countryCode": (r.get("country_code") or "").strip(),
            "productCode": (r.get("product_code") or "").strip(),
            "advisoryCommittee": (r.get("advisory_committee_description") or "").strip(),
            "decisionDate": format_fda_date(r.get("decision_date", "")),
            "decisionCode": (r.get("decision_code") or "").strip(),
            "statementOrSummary": (r.get("statement_or_summary") or "").strip(),
            "fdaUrl": f"https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID={urllib.parse.quote(knum)}",
        })
    return out


def fetch_fda_recalls_rss(limit: int = 25) -> list[dict]:
    url = "https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/recalls/rss.xml"
    try:
        raw = http_get(url)
        root = ET.fromstring(raw)
        items = []
        for item in root.findall(".//item")[:limit]:
            title = (item.findtext("title") or "").strip()
            link = (item.findtext("link") or "").strip()
            pub_date = (item.findtext("pubDate") or "").strip()
            desc = re.sub(r"<[^>]+>", "", (item.findtext("description") or "")).strip()
            if title and link:
                items.append({
                    "title": title[:220],
                    "link": link,
                    "pubDate": pub_date,
                    "summary": desc[:420],
                })
        return items
    except Exception as e:
        print(f"[WARN] RSS fetch failed: {e}")
        return []


def main() -> None:
    print("Syncing live FDA data from openFDA & FDA.gov RSS...")
    food_recalls = fetch_enforcement("food", limit=100)
    time.sleep(0.4)
    drug_recalls = fetch_enforcement("drug", limit=100)
    time.sleep(0.4)
    device_recalls = fetch_enforcement("device", limit=60)
    time.sleep(0.4)

    # Deduplicate by recallNumber + sourceCategory and sort newest first
    seen = set()
    all_recalls = []
    for rec in food_recalls + drug_recalls + device_recalls:
        key = (rec["sourceCategory"], rec["recallNumber"])
        if key not in seen:
            seen.add(key)
            all_recalls.append(rec)
    all_recalls.sort(key=lambda x: x.get("reportDate", ""), reverse=True)

    cosmetic_trends = fetch_cosmetic_trends()
    time.sleep(0.4)
    clearances_510k = fetch_510k_recent(limit=40)
    time.sleep(0.3)
    rss_alerts = fetch_fda_recalls_rss(limit=25)

    # Compute summary metrics
    by_vertical: dict[str, int] = {}
    by_class: dict[str, int] = {}
    for r in all_recalls:
        by_vertical[r["vertical"]] = by_vertical.get(r["vertical"], 0) + 1
        by_class[r["classification"]] = by_class.get(r["classification"], 0) + 1

    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    metadata = {
        "lastSyncedUtc": now_iso,
        "totalRecallsIndexed": len(all_recalls),
        "total510kIndexed": len(clearances_510k),
        "totalRssAlerts": len(rss_alerts),
        "cosmeticEventsInOpenFDA": cosmetic_trends.get("totalEventsInOpenFDA", 0),
        "countsByVertical": by_vertical,
        "countsByClassification": by_class,
        "sources": [
            "https://api.fda.gov/food/enforcement.json",
            "https://api.fda.gov/drug/enforcement.json",
            "https://api.fda.gov/device/enforcement.json",
            "https://api.fda.gov/device/510k.json",
            "https://api.fda.gov/cosmetic/event.json",
            "https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/recalls/rss.xml",
        ],
    }

    (DATA_DIR / "recalls.json").write_text(json.dumps(all_recalls, ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA_DIR / "cosmetic_trends.json").write_text(json.dumps(cosmetic_trends, ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA_DIR / "clearances_510k.json").write_text(json.dumps(clearances_510k, ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA_DIR / "rss_alerts.json").write_text(json.dumps(rss_alerts, ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA_DIR / "metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Sync complete: {len(all_recalls)} recalls, {len(clearances_510k)} 510(k) clearances, {len(rss_alerts)} RSS alerts, {cosmetic_trends.get('totalEventsInOpenFDA', 0)} total openFDA cosmetic events.")


if __name__ == "__main__":
    main()
