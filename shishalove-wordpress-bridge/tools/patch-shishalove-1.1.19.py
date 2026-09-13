#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.19.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent

# OWNER LOCK: carry forward approved Customer and Merchant 1.1.18.
# This revision changes ONLY Merchant Products/Stock search-row spacing.
# No Customer code, Merchant logic, navigation, editor, logo, orders or data behaviour changes.
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.18.py'), str(root)])

css_path = root / 'assets' / 'bridge.css'
css = css_path.read_text(encoding='utf-8')

css += r'''

/* ShishaLove 1.1.19 Merchant Products/Stock search-row edge spacing only */
.slm-page .slm-search{
  width:100%!important;
  max-width:100%!important;
  min-width:0!important;
  grid-template-columns:minmax(0,1fr) 108px!important;
  gap:10px!important;
  box-sizing:border-box!important;
  overflow:visible!important;
}
.slm-page .slm-search input,
.slm-page .slm-search button{
  width:100%!important;
  max-width:100%!important;
  min-width:0!important;
  box-sizing:border-box!important;
}
.slm-page .slm-search button{
  justify-self:stretch!important;
}
'''

css_path.write_text(css, encoding='utf-8')
print('ShishaLove 1.1.19 Merchant search row constrained inside page padding; all other code untouched')
