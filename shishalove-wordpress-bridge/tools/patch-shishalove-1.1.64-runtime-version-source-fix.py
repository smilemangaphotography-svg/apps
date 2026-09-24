#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 2:
    raise SystemExit("usage: patch-shishalove-1.1.64-runtime-version-source-fix.py <plugin-dir>")

root=Path(sys.argv[1])
php=root/"shishalove-app-bridge.php"
js=root/"assets"/"merchant.js"
customer=root/"assets"/"customer.js"
css=root/"assets"/"bridge.css"
for p in (php,js,customer,css):
    if not p.exists():
        raise SystemExit(f"missing {p}")

s=php.read_text(encoding="utf-8")
t=js.read_text(encoding="utf-8")
customer_before=customer.read_bytes()
css_before=css.read_bytes()

def once(text,old,new,label):
    n=text.count(old)
    if n != 1:
        raise SystemExit(f"{label}: expected 1 occurrence, found {n}")
    return text.replace(old,new,1)

if s.count("Version: 1.1.63") != 1 or s.count("define('SLB_VERSION', '1.1.63');") != 1:
    raise SystemExit("expected exact Bridge 1.1.63 baseline")

s=once(s,"Version: 1.1.63","Version: 1.1.64","plugin version")
s=once(s,"define('SLB_VERSION', '1.1.63');","define('SLB_VERSION', '1.1.64');","constant version")
s=once(s,"function slb_visual_backend_version_161() { return '1.1.62'; }","function slb_visual_backend_version_161() { return SLB_VERSION; }","visual backend version")
s=once(s,"'version'=>'1.1.62'","'version'=>SLB_VERSION","index initial version")
s=once(s,"$state['version']='1.1.62';","$state['version']=SLB_VERSION;","index resume version")
s=once(s,"window.__SLM_AUTHORITATIVE_MERCHANT_UI='bridge-1.1.62';","window.__SLM_AUTHORITATIVE_MERCHANT_UI=<?php echo wp_json_encode('bridge-' . SLB_VERSION); ?>;","shell runtime marker")
s=s.replace("/** ShishaLove Merchant 1.1.62 — secure administrator fallback for Visual Search credentials. */","/** Secure administrator fallback for Visual Search credentials. */")
s=s.replace("/** ShishaLove App Bridge 1.1.62 — WordPress-admin-only Visual Search configuration. */","/** WordPress-admin-only Visual Search configuration. */")

t=once(t,"CFG.version='1.1.62';","CFG.version=String(CFG.version||'');","merchant version override")
t=once(t,"window.__SLM_AUTHORITATIVE_MERCHANT_UI='bridge-1.1.62';","window.__SLM_AUTHORITATIVE_MERCHANT_UI='bridge-'+CFG.version;","merchant runtime marker")

php.write_text(s,encoding="utf-8")
js.write_text(t,encoding="utf-8")

if customer.read_bytes()!=customer_before:
    raise SystemExit("customer.js unexpectedly changed")
if css.read_bytes()!=css_before:
    raise SystemExit("bridge.css unexpectedly changed")
if "1.1.62" in php.read_text(encoding="utf-8") or "1.1.62" in js.read_text(encoding="utf-8"):
    raise SystemExit("stale 1.1.62 runtime value remains")

print("Bridge 1.1.64 authoritative runtime-version fix applied")
