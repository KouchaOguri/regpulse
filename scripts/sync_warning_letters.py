#!/usr/bin/env python3
"""
RegPulse Live FDA Warning Letters Ingestion Pipeline (v1.0)
Uses real Playwright Chromium to read official FDA.gov Warning Letters DataTable
(https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/compliance-actions-and-activities/warning-letters)
No CAPTCHA bypass. Extracts newest 200 live FDA Warning Letters with exact official fda.gov URLs.
"""

import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "src" / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

WL_URL = "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/compliance-actions-and-activities/warning-letters"


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def slugify(text: str, max_len: int = 68) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")
    return s[:max_len].strip("-") or "warning-letter"


def normalize_us_date(raw: str) -> str:
    m = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{4})$", (raw or "").strip())
    if m:
        return f"{m.group(3)}-{int(m.group(1)):02d}-{int(m.group(2)):02d}"
    return (raw or "").strip()


def infer_wl_vertical(office: str, subject: str, company: str) -> str:
    blob = f"{office} {subject} {company}".lower()
    if any(k in blob for k in ["cosmetic", "mocra", "skincare", "beauty", "skin lightening", "sunscreen", "hair"]):
        return "Cosmetics & Skincare"
    if any(k in blob for k in ["dietary supplement", "supplement", "unapproved new drug", "human foods", "cfsan", "hfp", "food", "nutrition", "honey", "botanical", "herb"]):
        if "tobacco" not in blob:
            return "Dietary Supplements & Foods"
    if any(k in blob for k in ["device", "cdrh", "radiological", "510(k)", "qsr", "21 cfr 820"]):
        return "Medical & Beauty Devices"
    if "tobacco" in blob or "vape" in blob or "e-liquid" in blob:
        return "Tobacco & Vaping"
    if "veterinary" in blob or "cvm" in blob or "animal" in blob or "pet" in blob:
        return "Animal & Pet Products"
    if "drug" in blob or "cder" in blob or "otc" in blob or "cgmp" in blob or "compounding" in blob:
        return "OTC & Pharma / Drugs"
    return "General FDA Enforcement"


def extract_wl_tags(subject: str, company: str) -> list[str]:
    blob = f"{subject} {company}".lower()
    tags = []
    checks = [
        ("Unapproved New Drugs", ["unapproved new drug", "unapproved drug", "new drug"]),
        ("Misbranded / Illegal Claims", ["misbranded", "false or misleading", "claim", "labeling"]),
        ("OTC Monograph Violation", ["otc", "over-the-counter", "monograph"]),
        ("CGMP / Adulterated", ["cgmp", "adulterated", "good manufacturing", "insanitary", "records"]),
        ("Dietary Supplements", ["dietary supplement", "dshea"]),
        ("Medical Device / 510(k)", ["510(k)", "device", "qsr", "unapproved device"]),
        ("Cosmetics / MoCRA", ["cosmetic", "mocra"]),
        ("China / Cross-Border Firm", ["shenzhen", "guangzhou", "shanghai", "beijing", "hangzhou", "suzhou", "china", "hong kong", "co., ltd", "biotech co"]),
    ]
    for label, kws in checks:
        if any(k in blob for k in kws):
            tags.append(label)
    if not tags:
        tags.append("FDA Enforcement Notice")
    return tags[:3]


def scrape_warning_letters(target_pages: int = 2) -> tuple[list[dict], int, str]:
    records: list[dict] = []
    seen_urls: set[str] = set()
    http_status = 0
    dt_info = ""

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 900},
        )
        page = ctx.new_page()
        resp = page.goto(WL_URL, wait_until="domcontentloaded", timeout=35000)
        http_status = resp.status if resp else 0
        page.wait_for_selector("table tbody tr", timeout=30000)
        page.wait_for_timeout(1200)

        # Switch table page length to 100 entries per page if available
        length_sel = page.locator("select[name$='_length']").first
        if length_sel.count() > 0:
            try:
                length_sel.select_option("100")
                page.wait_for_timeout(2800)
            except Exception as e:
                print(f"[WARN] Could not select 100 rows: {e}")

        for pg_idx in range(target_pages):
            page.wait_for_selector("table tbody tr", timeout=15000)
            rows = page.evaluate("""() => {
                return Array.from(document.querySelectorAll('table tbody tr')).map(tr => {
                    const tds = Array.from(tr.querySelectorAll('td'));
                    const a = tr.querySelector('a[href*="/warning-letters/"]');
                    return {
                        postedRaw: (tds[0]?.innerText || '').trim(),
                        issueRaw: (tds[1]?.innerText || '').trim(),
                        company: (tds[2]?.innerText || '').trim(),
                        office: (tds[3]?.innerText || '').trim(),
                        subject: (tds[4]?.innerText || '').trim(),
                        href: a ? a.getAttribute('href') : ''
                    };
                });
            }""")

            for r in rows:
                company = r.get("company", "").strip()
                href = r.get("href", "").strip()
                if not company or not href:
                    continue
                full_url = href if href.startswith("http") else f"https://www.fda.gov{href}"
                if full_url in seen_urls:
                    continue
                seen_urls.add(full_url)

                # Extract official FDA CMS / MARCS ID from slug if present
                cms_match = re.search(r"-(\d{5,7})-\d{8}$", full_url)
                cms_id = cms_match.group(1) if cms_match else ""
                posted = normalize_us_date(r.get("postedRaw", ""))
                issued = normalize_us_date(r.get("issueRaw", ""))
                office = r.get("office", "").strip()
                subject = r.get("subject", "").strip()
                vertical = infer_wl_vertical(office, subject, company)
                tags = extract_wl_tags(subject, company)
                slug_base = slugify(f"{company}-{cms_id or issued}", 68)

                records.append({
                    "id": slug_base,
                    "cmsId": cms_id,
                    "postedDate": posted,
                    "letterIssueDate": issued,
                    "companyName": company,
                    "issuingOffice": office,
                    "subject": subject,
                    "vertical": vertical,
                    "riskTags": tags,
                    "isCrossBorderRelevant": vertical in {
                        "Cosmetics & Skincare",
                        "Dietary Supplements & Foods",
                        "Medical & Beauty Devices",
                        "OTC & Pharma / Drugs",
                        "Animal & Pet Products",
                    },
                    "letterUrl": full_url,
                })

            info_loc = page.locator(".dataTables_info").first
            if info_loc.count() > 0:
                dt_info = info_loc.inner_text().strip()

            if pg_idx + 1 < target_pages:
                next_btn = page.locator("li.next:not(.disabled) a, a.paginate_button.next:not(.disabled)").first
                if next_btn.count() > 0:
                    next_btn.click()
                    page.wait_for_timeout(2800)
                else:
                    break

        browser.close()

    return records, http_status, dt_info


def main() -> None:
    print("Syncing live FDA Warning Letters from official FDA.gov DataTable...")
    records: list[dict] = []
    status = 0
    dt_info = ""
    last_err = ""
    for attempt in range(2):
        try:
            records, status, dt_info = scrape_warning_letters(target_pages=2)
            if status == 200 and len(records) >= 20:
                break
        except Exception as e:
            last_err = str(e)
            print(f"[WARN] Attempt {attempt + 1} failed: {last_err[:180]}")

    out_file = DATA_DIR / "warning_letters.json"
    if status != 200 or len(records) < 20:
        if out_file.exists():
            cached = json.loads(out_file.read_text(encoding="utf-8"))
            if len(cached) >= 100:
                print(
                    f"[WARN] Live FDA.gov DataTable timed out/throttled ({last_err[:120]}); "
                    f"preserving {len(cached)} previously verified FDA Warning Letters."
                )
                return
        print(f"[ERROR] FDA Warning Letters sync failed with no valid cache: HTTP {status}, records={len(records)}, err={last_err}")
        sys.exit(1)

    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    out_file.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")

    # Update sync_manifest.json with warning_letters provenance
    manifest_file = DATA_DIR / "sync_manifest.json"
    if manifest_file.exists():
        manifest = json.loads(manifest_file.read_text(encoding="utf-8"))
    else:
        manifest = {"schemaVersion": "1.2", "endpoints": [], "artifacts": {}}

    # Replace any previous warning-letters endpoint entry
    manifest["endpoints"] = [
        ep for ep in manifest.get("endpoints", []) if "warning-letters" not in ep.get("url", "")
    ]
    manifest["endpoints"].append({
        "url": WL_URL,
        "httpStatus": status,
        "recordsReturned": len(records),
        "tableInfo": dt_info,
        "fetchedAtUtc": now_iso,
        "fetcher": "playwright-chromium",
    })
    manifest.setdefault("artifacts", {})["warning_letters.json"] = {
        "sha256": sha256_file(out_file),
        "bytes": out_file.stat().st_size,
        "recordCount": len(records),
    }
    manifest["warningLettersSyncedAtUtc"] = now_iso
    manifest_file.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    # Update metadata.json with warning letters count
    meta_file = DATA_DIR / "metadata.json"
    if meta_file.exists():
        meta = json.loads(meta_file.read_text(encoding="utf-8"))
        meta["totalWarningLettersIndexed"] = len(records)
        meta["warningLettersLastSyncedUtc"] = now_iso
        meta_file.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
        # Refresh metadata.json hash inside sync_manifest.json!
        manifest["artifacts"]["metadata.json"] = {
            "sha256": sha256_file(meta_file),
            "bytes": meta_file.stat().st_size,
            "recordCount": 1,
        }
        manifest_file.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    by_v: dict[str, int] = {}
    for r in records:
        by_v[r["vertical"]] = by_v.get(r["vertical"], 0) + 1
    print(f"Synced {len(records)} live FDA Warning Letters ({dt_info}). By vertical: {by_v}")


if __name__ == "__main__":
    main()
