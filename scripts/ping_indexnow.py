#!/usr/bin/env python3
"""
RegPulse Automated IndexNow Search Engine Ping (Zero-Human Programmatic SEO Distribution).
Pings Bing, Yandex, Naver & Seznam automatically after each CI deploy with all live English
statutory rule pages, FDA Warning Letter pages, and openFDA Recall pages.
Runs only when SITE_URL is a custom domain (non-github.io) and INDEXNOW_KEY is set.
"""

import json
import os
import re
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "src" / "data"


def main() -> None:
    site_url = os.environ.get("SITE_URL", "").strip().rstrip("/")
    key = os.environ.get("INDEXNOW_KEY", "").strip()
    if not site_url or "github.io" in site_url or not key:
        print("[SKIP] IndexNow ping requires custom SITE_URL + INDEXNOW_KEY secret (deferred until custom domain is live).")
        return

    host = urllib.parse.urlparse(site_url).netloc
    raw_urls = [
        f"{site_url}/",
        f"{site_url}/bulk/",
        f"{site_url}/warning-letters/",
        f"{site_url}/recalls/",
        f"{site_url}/rules/",
        f"{site_url}/mocra/",
        f"{site_url}/pricing/",
        f"{site_url}/alerts/",
        f"{site_url}/terms/",
        f"{site_url}/privacy/",
        f"{site_url}/refund/",
    ]

    rules_path = DATA_DIR / "complianceRules.ts"
    if rules_path.exists():
        rules_text = rules_path.read_text(encoding="utf-8")
        for slug in re.findall(r"slug:\s*'([a-z0-9-]+)'", rules_text):
            raw_urls.append(f"{site_url}/rules/{slug}/")

    wl_path = DATA_DIR / "warning_letters.json"
    if wl_path.exists():
        for wl in json.loads(wl_path.read_text(encoding="utf-8")):
            if wl.get("id"):
                raw_urls.append(f"{site_url}/warning-letters/{wl['id']}/")

    rec_path = DATA_DIR / "recalls.json"
    if rec_path.exists():
        for r in json.loads(rec_path.read_text(encoding="utf-8")):
            if r.get("id"):
                raw_urls.append(f"{site_url}/recalls/{r['id']}/")

    urls = list(dict.fromkeys(u for u in raw_urls if "/cn/" not in u))[:10000]
    assert all("/cn/" not in u for u in urls), "Isolation error: /cn/ URL leaked into IndexNow list"

    payload = json.dumps({
        "host": host,
        "key": key,
        "keyLocation": f"{site_url}/{key}.txt",
        "urlList": urls,
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.indexnow.org/indexnow",
        data=payload,
        method="POST",
        headers={"Content-Type": "application/json; charset=utf-8"},
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            print(f"[OK] IndexNow accepted {len(urls)} URLs (HTTP {resp.status}).")
    except Exception as e:
        print(f"[WARN] IndexNow ping returned error (non-blocking): {e}")


if __name__ == "__main__":
    main()
