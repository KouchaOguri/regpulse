#!/usr/bin/env python3
"""
Verify every officialRefUrl in src/data/complianceRules.ts using a REAL Chromium browser (Playwright)
to avoid WAF false-404s on fda.gov/ftc.gov while catching real broken links (404/406/Page Not Found).
Generates src/data/citations_lock.json as the build-time & CI citation truth lock.
"""

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
RULES_FILE = ROOT / "src" / "data" / "complianceRules.ts"
LOCK_FILE = ROOT / "src" / "data" / "citations_lock.json"

BAD_TITLE_PATTERNS = [
    "page not found",
    "404",
    "406",
    "not acceptable",
    "access denied",
    "error 404",
    "cannot be found",
]


def extract_rules_urls() -> list[dict]:
    text = RULES_FILE.read_text(encoding="utf-8")
    # Extract rule blocks with id, statute, officialRefUrl, officialRefLabel
    blocks = re.split(r"\n\s*\{\s*\n\s*id:\s*'", text)[1:]
    items = []
    for b in blocks:
        rid = b.split("'", 1)[0]
        url_m = re.search(r"officialRefUrl:\s*'([^']+)'", b)
        statute_m = re.search(r"statute:\s*'([^']+)'", b)
        label_m = re.search(r"officialRefLabel:\s*'([^']+)'", b)
        if url_m:
            items.append({
                "ruleId": rid,
                "statute": statute_m.group(1) if statute_m else "",
                "officialRefUrl": url_m.group(1),
                "officialRefLabel": label_m.group(1) if label_m else "",
            })
    return items


def main() -> None:
    items = extract_rules_urls()
    unique_urls = list(dict.fromkeys([i["officialRefUrl"] for i in items]))
    extra_urls = ["https://open.fda.gov/license", "https://open.fda.gov/apis/"]
    for eu in extra_urls:
        if eu not in unique_urls:
            unique_urls.append(eu)

    print(f"Verifying {len(unique_urls)} unique official citation URLs via Playwright Chromium...")
    url_results: dict[str, dict] = {}
    failures: list[str] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800},
        )
        page = context.new_page()

        for url in unique_urls:
            status = 0
            final_url = url
            title = ""
            h1 = ""
            err_msg = ""
            try:
                resp = page.goto(url, wait_until="domcontentloaded", timeout=25000)
                page.wait_for_timeout(1200)
                status = resp.status if resp else 0
                final_url = page.url
                title = (page.title() or "").strip()
                h1_loc = page.locator("h1").first
                if h1_loc.count() > 0:
                    h1 = (h1_loc.inner_text(timeout=3000) or "").strip()[:180]
            except Exception as e:
                err_msg = str(e)[:240]

            title_low = f"{title} {h1}".lower()
            bad_title = any(pat in title_low for pat in BAD_TITLE_PATTERNS)
            ok = (status == 200) and bool(title) and (not bad_title) and (not err_msg)

            record = {
                "url": url,
                "finalUrl": final_url,
                "httpStatus": status,
                "verifiedTitle": title,
                "verifiedH1": h1,
                "ok": ok,
                "error": err_msg if err_msg else ("Bad title/404 indicator" if bad_title else ""),
                "verifiedAtUtc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "verifier": "playwright-chromium",
            }
            url_results[url] = record
            flag = "OK" if ok else "FAIL"
            print(f"  [{flag}] HTTP {status} | {title[:70]} | {url}")
            if not ok:
                failures.append(f"{url} -> HTTP {status}, title='{title}', err='{record['error']}'")

        browser.close()

    lock_payload = {
        "generatedAtUtc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "totalUrlsVerified": len(unique_urls),
        "allPassed": len(failures) == 0,
        "rulesMapping": [
            {
                "ruleId": i["ruleId"],
                "statute": i["statute"],
                "officialRefUrl": i["officialRefUrl"],
                "httpStatus": url_results[i["officialRefUrl"]]["httpStatus"],
                "verifiedTitle": url_results[i["officialRefUrl"]]["verifiedTitle"],
                "finalUrl": url_results[i["officialRefUrl"]]["finalUrl"],
                "ok": url_results[i["officialRefUrl"]]["ok"],
            }
            for i in items
        ],
        "urls": url_results,
    }

    LOCK_FILE.write_text(json.dumps(lock_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {LOCK_FILE} (passed={len(unique_urls) - len(failures)}/{len(unique_urls)})")

    if failures:
        print("\nFAILED CITATION URLS:")
        for f in failures:
            print("  -", f)
        sys.exit(1)


if __name__ == "__main__":
    main()
