from pathlib import Path

A = Path('buildsrc/NAR-Mix/app/src/main/assets')
css = A / 'app.css'
c = css.read_text()
marker = 'NAR BETA 5.0.1 — SAFE NAV ANCHOR FIX'
if marker in c:
    raise SystemExit('NAR Beta 5.0.1 safe nav fix already applied')

c += r'''

/* NAR BETA 5.0.1 — SAFE NAV ANCHOR FIX
   Keep the canonical six-item navigation inside the Android viewport and
   safely above the system navigation area at common phone widths. */
.betaNav{
  position:fixed !important;
  left:0 !important;
  right:0 !important;
  width:100vw !important;
  max-width:100vw !important;
  margin-left:0 !important;
  margin-right:0 !important;
  transform:none !important;
  box-sizing:border-box !important;
}
@supports (padding-bottom: env(safe-area-inset-bottom)){
  .betaNav{
    padding-bottom:max(8px, env(safe-area-inset-bottom)) !important;
  }
}
'''
css.write_text(c)
print('Applied NAR Beta 5.0.1 safe navigation anchor fix')
