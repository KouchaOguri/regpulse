#!/usr/bin/env python3
"""
RegPulse Sidecar Apify Actor (MCP-Ready Pay-Per-Event Distribution Engine).
Zero-human distribution wedge: captures built-in Apify Store & AI-Agent MCP demand for
FDA drug-claim screening and openFDA recall lookup, funneling high-intent teams back to RegPulse.
"""

import asyncio
import json
import re
import urllib.parse
import urllib.request
from datetime import datetime, timezone

try:
    from apify import Actor
except ImportError:
    Actor = None

RULES = [
    ("FDA-TERM-001", "critical", 30, "Unauthorized FDA Approved / Certified Claim", "FD&C Act §301(l)", r"(?<!\bnot\s)\bfda[-\s]+(approved|certified)\b|\bfda\s+certificate\b"),
    ("COS-OTC-SPF", "critical", 30, "OTC Sunscreen Drug Trigger (SPF / Sunburn)", "21 CFR Part 352", r"\bspf\s*\d+\+?\b|\b(sun\s+protection|prevents?\s+sunburn)\b"),
    ("COS-OTC-NUMB", "critical", 30, "OTC Lidocaine / Numbing Cream Violation", "21 CFR Part 348", r"\b(lidocaine|benzocaine|tetracaine|numbing\s+cream)\b"),
    ("COS-OTC-EYE", "critical", 30, "Unapproved Ophthalmic Eye Drops Claim", "21 CFR Part 349", r"\b(eye\s+drops?|pink\s+eye|conjunctivitis|cataracts?)\b"),
    ("COS-DRUG-001", "critical", 28, "Skin Disease Claim (Acne/Eczema/Psoriasis/Rosacea)", "21 CFR 333 Subpart D", r"\b(treats?|cures?|heals?|clears?|eliminates?|reduces?)\s+(\w+\s+){0,2}(acne|eczema|psoriasis|rosacea)\b"),
    ("COS-DRUG-005", "critical", 26, "Illegal OTC Hydroquinone / Melasma Claim", "21 U.S.C. §355h", r"\bhydroquinone\b|\b(treats?|cures?)\s+melasma\b"),
    ("COS-BIO-STEM", "critical", 28, "Unapproved Biologic (Exosomes / Human Stem Cells)", "PHS Act §351", r"\b(exosomes?|human\s+stem\s+cells?|hyaluron\s+pen)\b"),
    ("SUP-DIS-001", "critical", 30, "Cardiometabolic Disease Claim (Diabetes/Blood Pressure/Cholesterol)", "21 CFR 101.93(g)", r"\b(lowers?|reduces?|treats?|cures?|prevents?)\s+(\w+\s+){0,2}(blood\s+sugar|blood\s+pressure|cholesterol|diabetes|heart\s+attack)\b"),
    ("SUP-DIS-002", "critical", 35, "Zero-Tolerance Cancer / Tumor Claim", "FD&C Act §505(a)", r"\b(fights?|prevents?|cures?|treats?)\s+(\w+\s+){0,3}(cancer|tumors?|melanoma)\b|\banti[-\s]?cancer\b"),
    ("SUP-DIS-006", "critical", 28, "Ozempic / GLP-1 Dupe / Obesity Claim", "21 CFR 101.93(g)", r"\b(nature['’]?s\s+ozempic|ozempic\s+alternative|glp[-\s]?1\s+alternative|treats?\s+obesity)\b"),
    ("SUP-ING-CBD", "critical", 35, "Prohibited CBD / Delta-8 Cannabinoid", "FD&C Act §201(ff)", r"\b(cbd|cannabidiol|delta[-\s]?8|full[-\s]?spectrum\s+hemp\s+extract)\b"),
    ("SUP-ING-NDI", "critical", 34, "Prohibited Research Compound (BPC-157 / SARMs / Colloidal Silver)", "21 CFR 310.545", r"\b(colloidal\s+silver|bpc[-\s]?157|tb[-\s]?500|ostarine|sarms|phenibut|tianeptine)\b"),
    ("ING-TAINT-001", "critical", 35, "Hidden Pharma Adulterant / High-Risk Stimulant", "FD&C Act §505(a)", r"\b(sildenafil|tadalafil|sibutramine|yohimbine|dmaa|dmha|kratom|phenolphthalein)\b"),
    ("EPA-PEST-001", "critical", 26, "Amazon / EPA FIFRA Pesticide Bot Trap", "7 U.S.C. §136", r"\b(antibacterial|antimicrobial|antifungal|kills?\s+(99\.?9%?\s+)?(of\s+)?(germs|bacteria|viruses))\b"),
    ("PET-DRUG-001", "critical", 28, "Unapproved Animal/Pet Drug or Flea/Tick Claim", "21 CFR Part 510", r"\b(canine\s+arthritis|hip\s+dysplasia|kennel\s+cough|kills?\s+(fleas?|ticks?))\b"),
    ("DEV-QSR-002", "critical", 30, "Uncleared Device (Non-Invasive Blood Glucose Watch / Plasma Pen / HIFU)", "21 CFR Part 820", r"\b(non[-\s]?invasive\s+(blood\s+)?glucose|plasma\s+pen|home\s+hifu|medical[-\s]?grade)\b"),
    ("FTC-SUB-001", "high", 18, "Unsubstantiated Clinical Proof / Guaranteed Cure", "15 U.S.C. §52", r"\b(clinically\s+proven|100%\s+guaranteed\s+(results|cure)|zero\s+side\s+effects)\b"),
]


def audit_single_listing(item: dict) -> dict:
    blob = " ".join([
        str(item.get("title", "")),
        str(item.get("bullets", "")),
        str(item.get("ingredients", "")),
    ])
    findings = []
    score = 0
    for rule_id, sev, weight, title, statute, pat in RULES:
        matches = list({m.group(0) for m in re.finditer(pat, blob, re.IGNORECASE)})
        if matches:
            score += weight
            findings.append({
                "ruleId": rule_id,
                "severity": sev,
                "title": title,
                "statute": statute,
                "matchedPhrases": matches[:5],
            })
    score = min(100, score)
    grade = "CRITICAL" if score >= 65 else "HIGH" if score >= 35 else "ELEVATED" if score >= 15 else "LOW"
    return {
        "recordType": "listing_audit",
        "sku": item.get("sku", "UNKNOWN"),
        "riskScore": score,
        "riskGrade": grade,
        "findingsCount": len(findings),
        "findings": findings,
        "full40RuleWebScanner": "https://regpulsehq.com/bulk/",
        "auditedAtUtc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


def fetch_openfda_recalls(query: str, limit: int) -> list[dict]:
    q = urllib.parse.quote(query.strip()) if query.strip() else ""
    url = f"https://api.fda.gov/food/enforcement.json?sort=report_date:desc&limit={min(max(limit, 1), 100)}"
    if q:
        url += f"&search=product_description:{q}+OR+reason_for_recall:{q}"
    req = urllib.request.Request(url, headers={"User-Agent": "RegPulse-Apify-Actor/1.0"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    out = []
    for r in data.get("results", []):
        out.append({
            "recordType": "openfda_recall",
            "recallNumber": r.get("recall_number", ""),
            "classification": r.get("classification", ""),
            "recallingFirm": r.get("recalling_firm", ""),
            "reportDate": r.get("report_date", ""),
            "productDescription": (r.get("product_description") or "")[:300],
            "reasonForRecall": (r.get("reason_for_recall") or "")[:400],
            "liveMonitoringUrl": "https://regpulsehq.com/pricing/",
        })
    return out


async def main() -> None:
    if Actor is None:
        # Standalone local smoke test mode
        sample = {
            "sku": "LOCAL-TEST-001",
            "title": "FDA Approved Anti-Acne Retinol & Exosome Serum",
            "bullets": "Clinically proven to heal eczema and kill 99.9% bacteria.",
            "ingredients": "Water, Hydroquinone 2%",
        }
        print(json.dumps(audit_single_listing(sample), indent=2))
        return

    async with Actor:
        inp = await Actor.get_input() or {}
        mode = inp.get("mode", "both")
        listings = inp.get("listings") or []
        recall_query = inp.get("recallQuery", "supplement")
        max_recalls = int(inp.get("maxRecalls", 20))

        if mode in ("audit_listings", "both"):
            for item in listings[:200]:
                await Actor.push_data(audit_single_listing(item))

        if mode in ("recalls", "both"):
            for rec in fetch_openfda_recalls(recall_query, max_recalls):
                await Actor.push_data(rec)


if __name__ == "__main__":
    asyncio.run(main())
