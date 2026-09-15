#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent
src = ROOT / "patch13.py"
out = ROOT / "patch13_runtime.py"
s = src.read_text(encoding="utf-8")
old = '''# Inject the output target selector after each supported panel renders.
needle = "requestAnimationFrame(()=>{if(state.fitMode)fitView()})}"
if needle not in s:
    raise SystemExit("patch13: openTool tail not found")
s = s.replace(needle, "injectOutputTargetStrip(tool);" + needle, 1)
'''
new = '''# Inject the output target selector immediately after the active panel renders.
dispatch = "({smart:smartPanel,presets:presetsPanel,light:lightPanel,color:colorPanel,detail:detailPanel,mask:maskPanel,heal:healPanel,crop:cropPanel,rate:ratePanel}[tool]||smartPanel)();"
if dispatch not in s:
    raise SystemExit("patch13: panel dispatch not found")
s = s.replace(dispatch, dispatch + "injectOutputTargetStrip(tool);", 1)
'''
if old not in s:
    raise SystemExit("patch13_runner: brittle injection block not found")
out.write_text(s.replace(old, new, 1), encoding="utf-8")
subprocess.run(["python3", str(out)], check=True)
print("Generated FRAME Beta 0.12 through robust patch13 runner")
