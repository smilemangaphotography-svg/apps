#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 2:
    raise SystemExit("usage: patch-shishalove-1.1.78-visual-roi-shortlist12-guard.py <plugin-dir>")

p = Path(sys.argv[1]) / "shishalove-app-bridge.php"
s = p.read_text(encoding="utf-8")

old = "$best=array_slice($best,0,16);slb_visual_perf_search_173('exact_shortlist_used',count($best));$best=slb_visual_exact_rerank_178($best,$image);"
new = "$best=array_slice($best,0,12);slb_visual_perf_search_173('exact_shortlist_used',count($best));$best=slb_visual_exact_rerank_178($best,$image);"

if old in s:
    s = s.replace(old, new, 1)
elif new not in s:
    raise SystemExit("ROI exact-product candidate shortlist marker not found")

if "Version: 1.1.79" in s:
    raise SystemExit("version bump forbidden")

p.write_text(s, encoding="utf-8")
print("ROI exact-product candidate shortlist held at 12 pending live 8/12/16/24 retention benchmark")
