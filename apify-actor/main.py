#!/usr/bin/env python3
"""
RegPulse Sidecar Apify Actor (MCP-Ready 40-Rule + Live Warning Letters + openFDA Recalls).
Zero-human distribution wedge: captures built-in Apify Store & AI-Agent MCP demand for
FDA drug-claim screening, live FDA.gov Warning Letters, and openFDA recall lookup.
"""

import asyncio
import json
import re
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

try:
    from apify import Actor
except ImportError:
    Actor = None

RULES_PATH = Path(__file__).resolve().parent / "rules.json"
RULES = json.loads(RULES_PATH.read_text(encoding="utf-8"))

WARNING_LETTERS_FEED_URL = "https://regpulsehq.com/feeds/warning-letters.json"

DSHEA_DISCLAIMER_RE = re.compile(
    r"these\s+statements\s+have\s+not\s+been\s+evaluated\s+by\s+the\s+(?:u\.?s\.?\s+)?food\s+and\s+drug\s+administration[^.\n]*\.?\s*(?:this\s+product\s+is\s+not\s+intended\s+to\s+diagnose[^.\n]*\.?)?",
    re.IGNORECASE,
)
NOT_INTENDED_RE = re.compile(
    r"not\s+intended\s+to\s+diagnose,?\s*treat,?\s*cure,?\s*(?:or\s+)?prevent\s+any\s+disease\.?",
    re.IGNORECASE,
)


def mask_dshea_disclaimer(text: str) -> tuple[str, bool]:
    has_dshea = bool(DSHEA_DISCLAIMER_RE.search(text) or NOT_INTENDED_RE.search(text))
    masked = DSHEA_DISCLAIMER_RE.sub(lambda m: " " * len(m.group(0)), text)
    masked = NOT_INTENDED_RE.sub(lambda m: " " * len(m.group(0)), masked)
    return masked, has_dshea


def audit_single_listing(item: dict, default_vertical: str = "general") -> dict:
    vertical = str(item.get("vertical") or default_vertical or "general").strip().lower()
    if vertical not in ("cosmetics", "supplements", "devices", "pets", "general"):
        vertical = "general"

    blob = "\n\n".join(
        p for p in [
            str(item.get("title", "")).strip(),
            str(item.get("bullets", "")).strip(),
            str(item.get("ingredients", "")).strip(),
        ]
        if p
    )
    masked_blob, has_dshea_disclaimer = mask_dshea_disclaimer(blob)

    findings = []
    score = 0
    for rule in RULES:
        rule_verts = rule.get("verticals", ["general"])
        if vertical != "general" and vertical not in rule_verts and "general" not in rule_verts:
            continue

        matched = []
        seen = set()
        for pat in rule.get("patterns", []):
            for m in re.finditer(pat, masked_blob, re.IGNORECASE):
                phrase = m.group(0).strip()
                norm = phrase.lower()
                if phrase and norm not in seen:
                    seen.add(norm)
                    matched.append(phrase)
        if matched:
            score += int(rule.get("weight", 20))
            findings.append({
                "ruleId": rule["id"],
                "severity": rule["severity"],
                "category": rule.get("category", ""),
                "title": rule["titleEn"],
                "statute": rule["statute"],
                "officialRefUrl": rule.get("officialRefUrl", ""),
                "safeRewriteGuidance": rule.get("safeRewriteEn", ""),
                "matchedPhrases": matched[:6],
            })

    score = min(100, score)
    grade = "CRITICAL" if score >= 65 else "HIGH" if score >= 35 else "ELEVATED" if score >= 15 else "LOW"
    return {
        "recordType": "listing_audit",
        "sku": item.get("sku", "UNKNOWN"),
        "vertical": vertical,
        "hasDsheaDisclaimer": has_dshea_disclaimer,
        "rulesEvaluated": len(RULES),
        "riskScore": score,
        "riskGrade": grade,
        "findingsCount": len(findings),
        "findings": findings,
        "full200SkuBulkScanner": "https://regpulsehq.com/bulk/",
        "auditedAtUtc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


def _vertical_matches_wl(vertical: str, wl_vertical: str) -> bool:
    if vertical == "general":
        return True
    if vertical == "cosmetics":
        return wl_vertical in ("Cosmetics & Skincare", "OTC & Pharma / Drugs")
    if vertical == "supplements":
        return wl_vertical in ("Dietary Supplements & Foods", "OTC & Pharma / Drugs")
    if vertical == "devices":
        return wl_vertical == "Medical & Beauty Devices"
    if vertical == "pets":
        return wl_vertical == "Animal & Pet Products"
    return True


def fetch_warning_letters(query: str, vertical: str = "general", limit: int = 20) -> list[dict]:
    limit = min(max(int(limit or 20), 1), 100)
    req = urllib.request.Request(
        WARNING_LETTERS_FEED_URL,
        headers={"User-Agent": "RegPulse-Apify-Actor/2.0 (+https://regpulsehq.com)", "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except Exception as exc:
        return [{
            "recordType": "warning_letter_notice",
            "error": f"Failed to fetch live Warning Letters feed: {exc}",
            "webArchiveUrl": "https://regpulsehq.com/warning-letters/",
        }]

    records = payload.get("records", [])
    q = (query or "").strip().lower()
    out = []
    for wl in records:
        if not _vertical_matches_wl(vertical, str(wl.get("vertical", ""))):
            continue
        if q:
            hay = " ".join([
                str(wl.get("companyName", "")),
                str(wl.get("subject", "")),
                str(wl.get("issuingOffice", "")),
                " ".join(wl.get("riskTags") or []),
            ]).lower()
            if q not in hay:
                continue
        out.append({
            "recordType": "fda_warning_letter",
            "id": wl.get("id", ""),
            "cmsId": wl.get("cmsId", ""),
            "postedDate": wl.get("postedDate", ""),
            "letterIssueDate": wl.get("letterIssueDate", ""),
            "companyName": wl.get("companyName", ""),
            "issuingOffice": wl.get("issuingOffice", ""),
            "vertical": wl.get("vertical", ""),
            "subject": wl.get("subject", ""),
            "riskTags": wl.get("riskTags", []),
            "officialFdaUrl": wl.get("letterUrl", ""),
            "regpulseProfileUrl": f"https://regpulsehq.com/warning-letters/{wl.get('id', '')}/",
            "liveMonitoringUrl": "https://regpulsehq.com/pricing/",
        })
        if len(out) >= limit:
            break
    return out


def fetch_openfda_recalls(query: str, vertical: str = "general", limit: int = 20) -> list[dict]:
    limit = min(max(int(limit or 20), 1), 100)
    vertical = (vertical or "general").strip().lower()
    if vertical == "devices":
        endpoints = ["device"]
    elif vertical == "cosmetics":
        endpoints = ["drug", "food"]
    elif vertical == "supplements":
        endpoints = ["food", "drug"]
    else:
        endpoints = ["food", "drug", "device"]

    q = (query or "").strip()
    per_ep = max(1, min(100, (limit + len(endpoints) - 1) // len(endpoints)))
    out = []
    seen_recalls = set()

    for ep in endpoints:
        url = f"https://api.fda.gov/{ep}/enforcement.json?sort=report_date:desc&limit={per_ep}"
        if q:
            encoded = urllib.parse.quote(f'"{q}"' if " " in q else q)
            url += f"&search=product_description:{encoded}+OR+reason_for_recall:{encoded}+OR+recalling_firm:{encoded}"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "RegPulse-Apify-Actor/2.0 (+https://regpulsehq.com)", "Accept": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 404:
                # openFDA returns HTTP 404 when 0 records match the search term
                continue
            continue
        except Exception:
            continue

        for r in data.get("results", []):
            rnum = r.get("recall_number", "")
            dedup = f"{ep}:{rnum}"
            if dedup in seen_recalls:
                continue
            seen_recalls.add(dedup)
            out.append({
                "recordType": "openfda_recall",
                "sourceCategory": ep,
                "recallNumber": rnum,
                "classification": r.get("classification", ""),
                "status": r.get("status", ""),
                "recallingFirm": r.get("recalling_firm", ""),
                "reportDate": r.get("report_date", ""),
                "productDescription": (r.get("product_description") or "")[:300],
                "reasonForRecall": (r.get("reason_for_recall") or "")[:400],
                "liveMonitoringUrl": "https://regpulsehq.com/pricing/",
            })
            if len(out) >= limit:
                return out

    return out[:limit]


async def main() -> None:
    if Actor is None:
        sample = {
            "sku": "LOCAL-TEST-001",
            "vertical": "cosmetics",
            "title": "FDA Approved Anti-Acne Retinol & Exosome Serum",
            "bullets": "Clinically proven to heal eczema and kill 99.9% bacteria.",
            "ingredients": "Water, Hydroquinone 2%",
        }
        audit_res = audit_single_listing(sample)
        empty_recall_res = fetch_openfda_recalls("zzzznonexistentkeyword999", "general", 5)
        print(json.dumps({
            "rulesLoaded": len(RULES),
            "sampleAudit": audit_res,
            "emptyQuery404SafeCount": len(empty_recall_res),
        }, indent=2))
        return

    async with Actor:
        inp = await Actor.get_input() or {}
        mode = str(inp.get("mode") or "all").strip().lower()
        vertical = str(inp.get("vertical") or "general").strip().lower()
        listings = inp.get("listings") or []
        recall_query = str(inp.get("recallQuery") or "")
        max_recalls = int(inp.get("maxRecalls", 20))
        wl_query = str(inp.get("warningLetterQuery") or recall_query or "")
        max_wl = int(inp.get("maxWarningLetters", 20))

        run_audit = mode in ("audit_listings", "both", "all")
        run_wl = mode in ("warning_letters", "both", "all")
        run_recalls = mode in ("recalls", "both", "all")

        if run_audit:
            for item in listings[:200]:
                await Actor.push_data(audit_single_listing(item, default_vertical=vertical))

        if run_wl:
            for wl in fetch_warning_letters(wl_query, vertical=vertical, limit=max_wl):
                await Actor.push_data(wl)

        if run_recalls:
            for rec in fetch_openfda_recalls(recall_query, vertical=vertical, limit=max_recalls):
                await Actor.push_data(rec)


if __name__ == "__main__":
    asyncio.run(main())
