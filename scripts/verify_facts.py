#!/usr/bin/env python3
"""
RegPulse Build-Time & CI Anti-Hallucination Fact Verification Gate (HARD BLOCKING).
Exits non-zero on ANY failure so unverified citations, fabricated placeholders,
tampered data hashes, or non-existent FDA records can NEVER ship to production.
"""

import argparse
import hashlib
import html
import json
import os
import random
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "src" / "data"
SRC_DIR = ROOT / "src"
DIST_DIR = ROOT / "dist"
RULES_FILE = DATA_DIR / "complianceRules.ts"
MANIFEST_FILE = DATA_DIR / "sync_manifest.json"
CITATIONS_LOCK_FILE = DATA_DIR / "citations_lock.json"

API_KEY = os.environ.get("FDA_API_KEY", "").strip()
USER_AGENT = "RegPulse-Fact-Verifier/1.0 (+https://github.com/KouchaOguri/regpulse)"


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def http_json(url: str, timeout: int = 20) -> tuple[int, dict]:
    if API_KEY:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}api_key={API_KEY}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))


def check_manifest_and_schema(errors: list[str]) -> tuple[list[dict], list[dict]]:
    print("[1/4] Verifying sync_manifest.json SHA-256 hashes & required fields...")
    if not MANIFEST_FILE.exists():
        errors.append("Missing src/data/sync_manifest.json — run scripts/sync_fda_data.py first.")
        return [], []

    manifest = json.loads(MANIFEST_FILE.read_text(encoding="utf-8"))
    artifacts = manifest.get("artifacts", {})
    required_files = ["recalls.json", "cosmetic_trends.json", "clearances_510k.json", "rss_alerts.json", "metadata.json"]
    for fname in required_files:
        p = DATA_DIR / fname
        if not p.exists():
            errors.append(f"Missing data artifact: src/data/{fname}")
            continue
        expected_hash = artifacts.get(fname, {}).get("sha256")
        actual_hash = sha256_file(p)
        if not expected_hash or expected_hash != actual_hash:
            errors.append(f"SHA-256 mismatch for {fname}: manifest={expected_hash}, disk={actual_hash}")

    for ep in manifest.get("endpoints", []):
        if ep.get("httpStatus") != 200:
            errors.append(f"Upstream sync endpoint non-200: {ep.get('url')} -> HTTP {ep.get('httpStatus')}")

    recalls = json.loads((DATA_DIR / "recalls.json").read_text(encoding="utf-8"))
    clearances = json.loads((DATA_DIR / "clearances_510k.json").read_text(encoding="utf-8"))

    if len(recalls) < 100:
        errors.append(f"Too few recalls indexed ({len(recalls)} < 100)")
    if len(clearances) < 20:
        errors.append(f"Too few 510(k) clearances indexed ({len(clearances)} < 20)")

    req_recall_fields = ["id", "recallNumber", "sourceCategory", "recallingFirm", "classification", "reasonForRecall", "reportDate", "officialSourceUrl"]
    missing_recall_fields = 0
    for idx, r in enumerate(recalls):
        for f in req_recall_fields:
            if not str(r.get(f, "")).strip():
                missing_recall_fields += 1
                if missing_recall_fields <= 5:
                    errors.append(f"recalls.json[{idx}] missing required field '{f}'")
    if missing_recall_fields == 0:
        print(f"      PASS: {len(recalls)} recalls verified (0 missing required fields).")

    req_510k_fields = ["kNumber", "deviceName", "applicant", "decisionDate", "fdaUrl"]
    missing_510k_fields = 0
    for idx, c in enumerate(clearances):
        for f in req_510k_fields:
            if not str(c.get(f, "")).strip():
                missing_510k_fields += 1
                if missing_510k_fields <= 5:
                    errors.append(f"clearances_510k.json[{idx}] missing required field '{f}'")
    if missing_510k_fields == 0:
        print(f"      PASS: {len(clearances)} 510(k) records verified (0 missing required fields).")

    return recalls, clearances


def check_live_openfda_spotcheck(recalls: list[dict], clearances: list[dict], errors: list[str], seed: int) -> None:
    print("[2/4] Live round-trip verification against official api.fda.gov (5 recalls + 3 510(k)s)...")
    if not recalls or not clearances:
        return
    rng = random.Random(seed)
    sampled_recalls = rng.sample(recalls, min(5, len(recalls)))
    sampled_510ks = rng.sample(clearances, min(3, len(clearances)))

    for rec in sampled_recalls:
        cat = rec["sourceCategory"]
        rnum = rec["recallNumber"]
        url = f'https://api.fda.gov/{cat}/enforcement.json?search=recall_number:"{urllib.parse.quote(rnum)}"&limit=1'
        try:
            status, body = http_json(url)
            res = body.get("results", [])
            if status != 200 or not res:
                errors.append(f"Live openFDA recall spot-check failed for {cat}/{rnum}: HTTP {status}, results=0")
                continue
            api_firm = html.unescape((res[0].get("recalling_firm") or "").strip())
            if api_firm.lower() != rec["recallingFirm"].lower():
                errors.append(f"Recall firm mismatch for {rnum}: local='{rec['recallingFirm']}' vs api='{api_firm}'")
            else:
                print(f"      PASS recall {cat}/{rnum} -> '{api_firm}' (HTTP 200 verified)")
        except Exception as e:
            errors.append(f"Live openFDA recall spot-check error for {cat}/{rnum}: {e}")

    for c in sampled_510ks:
        knum = c["kNumber"]
        url = f'https://api.fda.gov/device/510k.json?search=k_number:"{urllib.parse.quote(knum)}"&limit=1'
        try:
            status, body = http_json(url)
            res = body.get("results", [])
            if status != 200 or not res:
                errors.append(f"Live openFDA 510(k) spot-check failed for {knum}: HTTP {status}, results=0")
                continue
            api_app = re.sub(r"\s+", " ", html.unescape((res[0].get("applicant") or "").strip()))
            local_prefix = c["applicant"].rstrip("…").strip()
            if not api_app.lower().startswith(local_prefix.lower()):
                errors.append(f"510(k) applicant mismatch for {knum}: local='{c['applicant']}' vs api='{api_app[:140]}'")
            else:
                print(f"      PASS 510(k) {knum} -> '{api_app[:50]}' (HTTP 200 verified)")
        except Exception as e:
            errors.append(f"Live openFDA 510(k) spot-check error for {knum}: {e}")


def check_citations_lock(errors: list[str]) -> None:
    print("[3/4] Verifying all statutory officialRefUrl links against src/data/citations_lock.json...")
    if not CITATIONS_LOCK_FILE.exists():
        errors.append("Missing src/data/citations_lock.json — run scripts/verify_citations_browser.py first.")
        return

    lock = json.loads(CITATIONS_LOCK_FILE.read_text(encoding="utf-8"))
    locked_urls = lock.get("urls", {})
    rules_text = RULES_FILE.read_text(encoding="utf-8")
    found_urls = list(dict.fromkeys(re.findall(r"officialRefUrl:\s*'([^']+)'", rules_text)))

    if not found_urls:
        errors.append("No officialRefUrl found in src/data/complianceRules.ts")
        return

    bad_title_tokens = ["page not found", "404", "406", "not acceptable", "access denied"]
    for url in found_urls:
        entry = locked_urls.get(url)
        if not entry:
            errors.append(f"UNVERIFIED CITATION URL (missing from citations_lock.json): {url}")
            continue
        if not entry.get("ok") or entry.get("httpStatus") != 200:
            errors.append(f"BROKEN CITATION URL in lock: {url} -> HTTP {entry.get('httpStatus')} ({entry.get('error')})")
            continue
        title = (entry.get("verifiedTitle") or "").strip()
        if not title or any(bt in title.lower() for bt in bad_title_tokens):
            errors.append(f"INVALID CITATION TITLE in lock: {url} -> title='{title}'")
    if not any("CITATION" in e for e in errors):
        print(f"      PASS: All {len(found_urls)} statutory citation URLs locked at HTTP 200 with verified titles.")


def check_placeholders_and_fabrications(errors: list[str], check_dist: bool) -> None:
    print("[4/4] Static anti-placeholder & anti-fabrication scan...")
    forbidden_patterns = [
        (r"\blorem\s+ipsum\b", "Placeholder Lorem Ipsum text"),
        (r"\b(jane\s+doe|john\s+doe|acme\s+corp)\b", "Fake persona/company placeholder"),
        (r"\bTODO\b|\bFIXME\b|\bTBD\b", "Unresolved TODO/TBD placeholder"),
        (r"\bCMS\s*#\s*\d{6}\b", "Hardcoded unverified FDA Warning Letter CMS number"),
        (r"trusted\s+by\s+\d[\d,]*\+?\s+(brands|sellers|companies)", "Fabricated customer count social proof"),
    ]

    scan_roots = [SRC_DIR]
    if check_dist and DIST_DIR.exists():
        scan_roots.append(DIST_DIR)

    files_scanned = 0
    for base in scan_roots:
        for p in base.rglob("*"):
            if not p.is_file():
                continue
            if p.suffix.lower() not in {".ts", ".tsx", ".astro", ".html", ".css"}:
                continue
            # Skip data json / lock files
            if "node_modules" in p.parts:
                continue
            text = p.read_text(encoding="utf-8", errors="ignore")
            files_scanned += 1
            for pat, desc in forbidden_patterns:
                m = re.search(pat, text, re.IGNORECASE)
                if m:
                    errors.append(f"Anti-fabrication violation ({desc}) in {p.relative_to(ROOT)}: matched '{m.group(0)}'")

    # Confirm SAMPLE_LISTINGS UI explicitly marks demo examples as illustrative
    scanner_tsx = (SRC_DIR / "components" / "ListingScanner.tsx").read_text(encoding="utf-8")
    if "Illustrative" not in scanner_tsx or "演示样本" not in scanner_tsx:
        errors.append("ListingScanner.tsx must explicitly label SAMPLE_LISTINGS as 'Illustrative Risk Example' / '高危演示样本'.")

    print(f"      Scanned {files_scanned} source/output files for placeholders & fabrications.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check-dist", action="store_true", help="Also scan built dist/ HTML files")
    parser.add_argument("--seed", type=int, default=20261126, help="Random seed for reproducible spot-check")
    args = parser.parse_args()

    errors: list[str] = []
    recalls, clearances = check_manifest_and_schema(errors)
    check_live_openfda_spotcheck(recalls, clearances, errors, seed=args.seed)
    check_citations_lock(errors)
    check_placeholders_and_fabrications(errors, check_dist=args.check_dist)

    if errors:
        print("\n================ VERIFY_FACTS FAILED ================")
        for idx, err in enumerate(errors, 1):
            print(f"  {idx}. {err}")
        print("=====================================================")
        sys.exit(1)

    print("\nALL ANTI-HALLUCINATION VERIFICATION GATES PASSED (EXIT 0).")


if __name__ == "__main__":
    main()
