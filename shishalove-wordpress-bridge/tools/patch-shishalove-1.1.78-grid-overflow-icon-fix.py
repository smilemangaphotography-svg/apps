#!/usr/bin/env python3
from pathlib import Path
import sys, hashlib

if len(sys.argv) != 2:
    raise SystemExit("usage: patch-shishalove-1.1.78-grid-overflow-icon-fix.py <plugin-dir>")

root = Path(sys.argv[1])
js = root / "assets/merchant.js"
css = root / "assets/bridge.css"

expected = {
    js: "61d2f8cd9a9063dcadee2cc1020f59ecf1f4cf960c9cbca1c4a21874da850a9e",
    css: "33f82b30c1df2eb6a7ce037adf7baaab28e9b7b83383eda14ec84ef770679b81",
}
for p, sha in expected.items():
    actual = hashlib.sha256(p.read_bytes()).hexdigest()
    if actual != sha:
        raise SystemExit(f"unexpected Products recent/grid candidate baseline: {p.name}: {actual}")

s = js.read_text(encoding="utf-8")
old = '<button class="slm-more slm-grid-more" data-quick-edit="'+"'+p.id+'"+'" aria-label="Quick Edit">⋮</button>'
new = '<button class="slm-more slm-grid-more" data-quick-edit="'+"'+p.id+'"+'" aria-label="Quick Edit"><svg class="slm-overflow-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="5" r="1.8"></circle><circle cx="12" cy="12" r="1.8"></circle><circle cx="12" cy="19" r="1.8"></circle></svg></button>'
if s.count(old) != 1:
    raise SystemExit(f"expected exactly one grid overflow glyph marker, found {s.count(old)}")
s = s.replace(old, new, 1)
js.write_text(s, encoding="utf-8")

c = css.read_text(encoding="utf-8")
old_css = 'body.slb-merchant .slm-grid-more{position:absolute;right:2px;top:2px;width:30px;height:30px;min-width:30px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.72)!important;color:#111!important;font-size:21px!important;line-height:1;z-index:2;box-shadow:none}body.slb-merchant .slm-grid-more:active{background:#fff!important}'
new_css = 'body.slb-merchant .slm-grid-more{position:absolute;right:2px;top:2px;width:30px;height:30px;min-width:30px;padding:0!important;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.72)!important;color:#111!important;font-size:0!important;line-height:1;z-index:2;box-shadow:none;-webkit-appearance:none;appearance:none}body.slb-merchant .slm-grid-more .slm-overflow-icon{display:block;width:18px;height:18px;fill:currentColor;pointer-events:none}body.slb-merchant .slm-grid-more:active{background:#fff!important}'
if c.count(old_css) != 1:
    raise SystemExit(f"expected exactly one grid overflow CSS marker, found {c.count(old_css)}")
c = c.replace(old_css, new_css, 1)
css.write_text(c, encoding="utf-8")

s2 = js.read_text(encoding="utf-8")
c2 = css.read_text(encoding="utf-8")
if '>⋮</button>' in s2[s2.find('function productGridCard'):s2.find('function productRows')]:
    raise SystemExit("grid Unicode overflow glyph still present")
if s2.count('class="slm-more slm-grid-more"') != 1:
    raise SystemExit("grid overflow control duplicated in source")
if s2.count('<circle cx="12" cy="5" r="1.8"></circle><circle cx="12" cy="12" r="1.8"></circle><circle cx="12" cy="19" r="1.8"></circle>') != 1:
    raise SystemExit("deterministic three-circle icon missing")
if '.slm-grid-more::before' in c2 or '.slm-grid-more:before' in c2 or '.slm-grid-more::after' in c2 or '.slm-grid-more:after' in c2:
    raise SystemExit("duplicate pseudo-element detected")
if 'data-quick-edit="'+"'+p.id+'"+'"' not in s2[s2.find('function productGridCard'):s2.find('function productRows')]:
    raise SystemExit("Quick Edit binding missing")

print("PASS: one grid Quick Edit button; one SVG; exactly three circles; no grid pseudo-element")
