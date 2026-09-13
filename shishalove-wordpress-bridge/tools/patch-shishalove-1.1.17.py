#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.17.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent

# OWNER LOCK: Customer 1.1.14 and Merchant 1.1.16 are approved.
# This revision changes ONLY the visible black rectangle behind the Merchant
# side-menu logo. Size, layout and all behaviour remain frozen.
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.16.py'), str(root)])

css_path = root / 'assets' / 'bridge.css'
css = css_path.read_text(encoding='utf-8')

css += r'''

/* ShishaLove 1.1.17 Merchant drawer logo background removal only */
.slm-menu-logo .slm-merchant-brand-lock,
.slm-menu-logo .slm-merchant-wordmark,
.slm-menu-logo .slm-merchant-wordmark img{
  background:transparent!important;
}
/* The approved artwork contains black pixels in its source image. Screen blend
   makes those black pixels disappear into the dark Merchant drawer while
   preserving the white wordmark and red heart. */
.slm-menu-logo .slm-merchant-wordmark img{
  mix-blend-mode:screen!important;
}
'''

css_path.write_text(css, encoding='utf-8')
print('ShishaLove 1.1.17 Merchant drawer logo black rectangle removed; all other code untouched')
