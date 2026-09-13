#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.18.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent

# OWNER LOCK: carry forward approved Customer 1.1.14 and Merchant 1.1.17.
# This revision changes ONLY Merchant product-editor layout:
# - Cancel/Update footer fixed to the bottom safe area
# - editor content gets clearance so nothing sits underneath the footer
# - Categories/Quick Picks remain within the panel width
# No Customer or Merchant logic changes.
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.17.py'), str(root)])

css_path = root / 'assets' / 'bridge.css'
css = css_path.read_text(encoding='utf-8')

css += r'''

/* ShishaLove 1.1.18 Merchant product-editor action footer fix only */
.slm-panel.open{
  overflow-y:auto!important;
  overflow-x:hidden!important;
  padding-bottom:calc(var(--safe-bottom) + 18px)!important;
}
.slm-panel.open .slm-form{
  min-width:0!important;
  width:100%!important;
  max-width:100%!important;
  padding-bottom:calc(96px + var(--safe-bottom))!important;
}
.slm-panel.open .slm-form-actions{
  position:fixed!important;
  z-index:146!important;
  left:18px!important;
  right:18px!important;
  bottom:calc(var(--safe-bottom) + 10px)!important;
  margin:0!important;
  padding:10px 0 0!important;
  background:#fff!important;
  border-top:1px solid #ececef!important;
  box-shadow:0 -10px 24px rgba(255,255,255,.96)!important;
  display:grid!important;
  grid-template-columns:1fr 1.3fr!important;
  gap:10px!important;
}
.slm-panel.open .slm-form-actions .slm-cancel,
.slm-panel.open .slm-form-actions .slm-save{
  width:100%!important;
  min-width:0!important;
}
.slm-panel.open .slm-categories{
  width:100%!important;
  max-width:100%!important;
  min-width:0!important;
  overflow:hidden!important;
}
.slm-panel.open .slm-quick-scroll{
  width:100%!important;
  max-width:100%!important;
  min-width:0!important;
  overflow-x:auto!important;
  overflow-y:hidden!important;
  -webkit-overflow-scrolling:touch!important;
  scrollbar-width:none!important;
}
.slm-panel.open .slm-quick-scroll::-webkit-scrollbar{display:none!important}
.slm-panel.open .slm-cat-list{width:100%!important;max-width:100%!important;min-width:0!important}

@media(min-width:800px){
  .slm-panel.open .slm-form-actions{
    left:50%!important;
    right:auto!important;
    width:724px!important;
    max-width:calc(100vw - 76px)!important;
    transform:translateX(-50%)!important;
  }
}
'''

css_path.write_text(css, encoding='utf-8')
print('ShishaLove 1.1.18 Merchant editor footer anchored to safe bottom; all other code untouched')
