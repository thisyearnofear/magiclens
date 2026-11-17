#!/usr/bin/env python3
"""Export Iconic Moments as a DeWEB-ready static site.

Fetches minted/promoted moments from the live MagicLens backend and writes a
fully static folder (inline CSS, relative links, ASCII filenames, no external
resources loaded) that can be published to a TapeOut DeWEB container via the
HashPort console or direct SiteRegistry calls.

Usage:
    python3 scripts/export_deweb_archive.py [--api URL] [--out deweb]

DeWEB rules honoured: static files only, relative paths, precomputed SHA-256
manifest (deweb/sha256sums.txt) for the uploader to verify against.
External hyperlinks (FlowScan) are navigation, not loaded resources.
"""
import argparse
import hashlib
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone

CSS = (
    "body{background:#0b0620;color:#f3efff;font-family:system-ui,sans-serif;"
    "margin:0;padding:32px 16px}main{max-width:720px;margin:0 auto}"
    "h1{font-size:28px}h1 span{color:#facc15}"
    ".sub{color:#b7a8e0;font-size:14px;margin:4px 0 24px}"
    ".card{border:1px solid rgba(255,255,255,.14);border-radius:14px;"
    "padding:16px;margin:12px 0;background:rgba(255,255,255,.04)}"
    ".rank{color:#facc15;font-weight:700}.meta{color:#b7a8e0;font-size:12px}"
    "a{color:#facc15}.proof{font-size:12px;color:#7ee2a8}"
    "footer{margin-top:32px;font-size:12px;color:#8f83b8}"
)


def esc(s):
    return (
        str(s or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def fetch(api, path):
    url = api.rstrip("/") + path
    req = urllib.request.Request(url, headers={"User-Agent": "magiclens-deweb-export/1"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def moment_card(m):
    flow = m.get("flow_nft_id")
    tx = m.get("flow_tx_hash") or ""
    proof = (
        f'<p class="proof">Flow NFT #{flow} · '
        f'<a href="https://testnet.flowscan.io/transaction/{esc(tx)}">FlowScan</a></p>'
        if flow
        else '<p class="meta">Promotion pending — on-chain mint to follow.</p>'
    )
    media = (
        f'<p class="meta"><a href="{esc(m["media_url"])}">Premiere clip</a></p>'
        if m.get("media_url")
        else ""
    )
    return (
        f'<div class="card"><p class="rank">Rank #{m.get("rank")}</p>'
        f"<h2>{esc(m.get('title'))}</h2>"
        f"<p class=\"meta\">Creator {esc(m.get('xlayer_creator_address'))} · "
        f"Day {m.get('day')} · X Layer token #{m.get('xlayer_token_id')}</p>"
        f"{media}{proof}</div>"
    )


def page(title, sub, body):
    return (
        "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\">"
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        f"<title>{esc(title)}</title><style>{CSS}</style></head><body><main>"
        f"<h1>{esc(title)}</h1>"
        + (f'<p class="sub">{esc(sub)}</p>' if sub else "")
        + body
        + "<footer>MagicLens Iconic Moments Archive — mirrored on TapeOut DeWEB. "
        "Verify every moment on FlowScan.</footer></main></body></html>"
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--api", default="https://magiclens.thisyearnofear.com")
    ap.add_argument("--out", default="deweb")
    ap.add_argument("--data", default=None, help="JSON file with API response (offline mode)")
    args = ap.parse_args()

    if args.data:
        with open(args.data) as f:
            data = json.load(f)
    else:
        try:
            data = fetch(args.api, "/api/crossvm/iconic_moments")
        except Exception as e:
            print(f"fetch failed: {e}", file=sys.stderr)
            sys.exit(1)
    moments = data.get("iconic_moments", []) if data.get("success") else []
    by_day = {}
    for m in moments:
        by_day.setdefault(m.get("day", 0), []).append(m)
    for ms in by_day.values():
        ms.sort(key=lambda m: (m.get("rank") is None, m.get("rank")))

    os.makedirs(args.out, exist_ok=True)
    written = {}
    for day in sorted(by_day):
        fname = f"day-{day}.html"
        html = page(
            f"Iconic Moments — Day {day}",
            "Top-3 crowd-crowned remixes, promoted from X Layer to Flow.",
            "".join(moment_card(m) for m in by_day[day])
            + '<p><a href="index.html">← All days</a></p>',
        )
        written[fname] = html
    cards = "".join(
        f'<div class="card"><p class="rank">Day {d}</p>'
        f"<p>{len(by_day[d])} moment(s) crowned.</p>"
        f'<p><a href="day-{d}.html">View Day {d} →</a></p></div>'
        for d in sorted(by_day)
    ) or "<p>No moments crowned yet — check back after the next close-day.</p>"
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    written["index.html"] = page(
        "MagicLens <span>Iconic Moments</span> Archive",
        f"Daily Top-3 AR remix premieres, verifiable on Flow. Exported {stamp}.",
        cards,
    )

    manifest = []
    for fname, html in written.items():
        blob = html.encode("utf-8")
        with open(os.path.join(args.out, fname), "wb") as f:
            f.write(blob)
        manifest.append(f"{hashlib.sha256(blob).hexdigest()}  {fname}\n")
    with open(os.path.join(args.out, "sha256sums.txt"), "w") as f:
        f.writelines(manifest)
    print(f"wrote {len(written)} files to {args.out}/ ({len(moments)} moments)")


if __name__ == "__main__":
    main()
