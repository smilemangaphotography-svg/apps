from pathlib import Path

A=Path('buildsrc/NAR-Mix/app/src/main/assets')
js=A/'app.js'; css=A/'app.css'
s=js.read_text(); c=css.read_text()
MARK='NAR BETA 5.1.0 — RETIRE LEGACY HOME PINS'
if MARK in s:
    raise SystemExit('NAR 5.1 legacy pin retirement already applied')
needle="""    applyHomePins();
    hidePublicEdit();"""
if needle not in s:
    raise SystemExit('5.0.7 applyHomePins refresh hook not found')
s=s.replace(needle,"""    /* NAR 5.1: Owner Studio storeActiveLines is now the sole Home-line authority. */
    hidePublicEdit();""",1)
s += "\n/* NAR BETA 5.1.0 — RETIRE LEGACY HOME PINS */\n"
c += "\n/* NAR BETA 5.1.0 — RETIRE LEGACY HOME PINS */\n.nar507AllBrands{display:none!important}\n"
js.write_text(s);css.write_text(c)
print('Retired 5.0.7 Home pin refresh; Owner Studio active lines are authoritative in NAR 5.1')
