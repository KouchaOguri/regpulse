#!/usr/bin/env python3
"""
RegPulse Post-Sync Automated Watchlist Alert Dispatcher.
Invoked automatically by GitHub Actions after every 12-hour FDA Warning Letters + openFDA Recalls sync.
Posts freshly synced records to the Cloudflare Worker `/api/internal/dispatch-alerts` endpoint.
No-ops cleanly if FULFILLMENT_API_URL or INTERNAL_CRON_SECRET are not yet configured.
"""

import json
import os
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "src" / "data"


def main() -> None:
    api_base = os.environ.get("FULFILLMENT_API_URL", "").strip().rstrip("/")
    cron_secret = os.environ.get("INTERNAL_CRON_SECRET", "").strip()
    if not api_base or not cron_secret:
        print("[SKIP] FULFILLMENT_API_URL or INTERNAL_CRON_SECRET not configured yet; skipping live subscriber dispatch.")
        return

    wl_path = DATA_DIR / "warning_letters.json"
    rec_path = DATA_DIR / "recalls.json"
    warning_letters = json.loads(wl_path.read_text(encoding="utf-8")) if wl_path.exists() else []
    recalls = json.loads(rec_path.read_text(encoding="utf-8")) if rec_path.exists() else []

    payload = json.dumps({
        "warningLetters": warning_letters[:80],
        "recalls": recalls[:120],
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{api_base}/api/internal/dispatch-alerts",
        data=payload,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "X-Internal-Secret": cron_secret,
            "User-Agent": "RegPulse-CI-Dispatcher/2.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
            print(f"[OK] Alert dispatch HTTP {resp.status}: {body}")
    except Exception as e:
        print(f"[ERROR] Alert dispatch failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
