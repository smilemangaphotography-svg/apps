#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parent
subprocess.run(["python3", str(ROOT / "patch09.py")], check=True)
SRC = ROOT / "app/src/main/assets/app09.js"
OUT = ROOT / "app/src/main/assets/app10.js"
s = SRC.read_text(encoding="utf-8")

def sub(pattern, repl, label):
    global s
    s2, n = re.subn(pattern, repl, s, flags=re.S)
    if n != 1:
        raise SystemExit(f"patch10: {label} expected 1 match, got {n}")
    s = s2

# 1) Make AI edits visibly meaningful while remaining scene-safe.
sub(
    r"function suggestedEdits\(\)\{.*?\}\nfunction fitView",
    '''function suggestedEdits(){
const s=scene(),t=state.analysis?.tech||technical(),p={...PRESETS[s.preset]};delete p.scene;
let out={...DEFAULTS,...p};
// Minimum useful correction strength by scene. These are deliberately stronger than Beta 0.9.
if(s.key==='travel'||s.key==='landscape')out={...out,exposure:Math.max(out.exposure,.18),contrast:Math.max(out.contrast,12),highlights:Math.min(out.highlights,-42),shadows:Math.max(out.shadows,34),whites:Math.max(out.whites,4),blacks:Math.min(out.blacks,-10),vibrance:Math.max(out.vibrance,18),clarity:Math.max(out.clarity,9),dehaze:Math.max(out.dehaze,8)};
if(s.key==='architecture')out={...out,exposure:Math.max(out.exposure,.14),contrast:Math.max(out.contrast,14),highlights:Math.min(out.highlights,-44),shadows:Math.max(out.shadows,30),whites:Math.max(out.whites,2),blacks:Math.min(out.blacks,-12),vibrance:Math.max(out.vibrance,12),clarity:Math.max(out.clarity,11),dehaze:Math.max(out.dehaze,10)};
if(s.key==='people'||s.key==='wedding')out={...out,exposure:Math.max(out.exposure,.16),contrast:Math.max(out.contrast,5),highlights:Math.min(out.highlights,-38),shadows:Math.max(out.shadows,26),whites:Math.min(out.whites,-2),blacks:Math.min(out.blacks,-5),vibrance:Math.max(out.vibrance,10),saturation:Math.min(out.saturation,0),clarity:Math.min(out.clarity,-2)};
if(s.key==='food')out={...out,exposure:Math.max(out.exposure,.18),contrast:Math.max(out.contrast,10),highlights:Math.min(out.highlights,-34),shadows:Math.max(out.shadows,24),whites:Math.max(out.whites,5),blacks:Math.min(out.blacks,-7),vibrance:Math.max(out.vibrance,15),clarity:Math.max(out.clarity,8),dehaze:Math.max(out.dehaze,3)};
if(s.key==='night')out={...out,exposure:Math.max(out.exposure,.28),contrast:Math.max(out.contrast,10),highlights:Math.min(out.highlights,-38),shadows:Math.max(out.shadows,34),blacks:Math.min(out.blacks,-12),vibrance:Math.max(out.vibrance,10),clarity:Math.max(out.clarity,5),dehaze:Math.max(out.dehaze,6)};
// Technical adaptation. Dark images get a real lift; bright images keep highlights protected.
if(t.luminance<.24)out.exposure=Math.max(out.exposure,.42);else if(t.luminance<.34)out.exposure=Math.max(out.exposure,.30);else if(t.luminance<.44)out.exposure=Math.max(out.exposure,.22);
if(t.dark>.16)out.shadows=Math.max(out.shadows,38);if(t.dark>.26)out.shadows=Math.max(out.shadows,46);
if(t.bright>.018)out.highlights=Math.min(out.highlights,-46);if(t.bright>.045)out.highlights=Math.min(out.highlights,-55);
if(t.dynamic<.30)out.contrast=Math.max(out.contrast,13);
return out;
}
function activeDisplayCrop(){if(state.tool==='crop')return{x:0,y:0,w:1,h:1};return state.crop?.rect||{x:0,y:0,w:1,h:1}}
function syncCommittedCropVisual(){const r=activeDisplayCrop(),clip=state.tool==='crop'?'none':`inset(${r.y*100}% ${(1-r.x-r.w)*100}% ${(1-r.y-r.h)*100}% ${r.x*100}%)`;[editCanvas,maskCanvas,healCanvas].forEach(c=>c.style.clipPath=clip)}
function fitView(){if(!sourceCanvas.width)return;syncCommittedCropVisual();const v=$('#viewport'),st=$('#stage'),vw=v.clientWidth,vh=v.clientHeight;if(!vw||!vh)return;const r=activeDisplayCrop(),cw=Math.max(1,workingDims.w*r.w),ch=Math.max(1,workingDims.h*r.h),scale=Math.min(vw/cw,vh/ch);st.style.width=(workingDims.w*scale)+'px';st.style.height=(workingDims.h*scale)+'px';st.style.left='50%';st.style.top='50%';state.zoom=1;const cssW=workingDims.w*scale,cssH=workingDims.h*scale;state.panX=-(r.x+r.w/2-.5)*cssW;state.panY=-(r.y+r.h/2-.5)*cssH;state.fitMode=true;applyView()}
function applyView''',
    "strong edits and committed crop display"
)

# Keep clip state in sync when switching tools and after any render.
s = s.replace("({smart:smartPanel,presets:presetsPanel,light:lightPanel,color:colorPanel,detail:detailPanel,mask:maskPanel,heal:healPanel,crop:cropPanel,rate:ratePanel}[tool]||smartPanel)();", "syncCommittedCropVisual();({smart:smartPanel,presets:presetsPanel,light:lightPanel,color:colorPanel,detail:detailPanel,mask:maskPanel,heal:healPanel,crop:cropPanel,rate:ratePanel}[tool]||smartPanel)();")

# 2) Mask creation should not hijack whichever panel the user is currently using.
s = s.replace("state.maskData=m;render();maskPanel();toast(`${state.maskType} mask ready`)", "state.maskData=m;render();if(state.tool==='mask')maskPanel();toast(`${state.maskType} mask ready`)")
s = s.replace("state.maskType=type;state.maskData=m;render();maskPanel();toast(type+' mask ready')", "state.maskType=type;state.maskData=m;render();if(state.tool==='mask')maskPanel();toast(type+' mask ready')")

# 3) Rating reflects the current edited state, not only the untouched source.
sub(
    r"function computeRateScores\(\)\{.*?\}\nfunction updateRateDock\(score\)\{.*?\}\nfunction ratePanel\(\)\{.*?\}\nfunction applyMasterRecipe",
    '''function editProgress(){const target=suggestedEdits(),keys=['exposure','contrast','highlights','shadows','whites','blacks','temp','tint','vibrance','saturation','clarity','dehaze'],ranges={exposure:1.2,contrast:45,highlights:75,shadows:75,whites:45,blacks:45,temp:18,tint:35,vibrance:45,saturation:35,clarity:45,dehaze:35};let sum=0;for(const k of keys){const d=Math.abs((Number(state.edits[k])||0)-(Number(target[k])||0))/ranges[k];sum+=clamp(1-d,0,1)}return sum/keys.length}
function cropProgress(){const sc=smartCrop();if(sc.crop.ratio==='free')return 1;const same=state.crop.ratio===sc.crop.ratio,rot=Math.abs((state.crop.rotate||0)-(sc.crop.rotate||0))<.35;return same&&rot?1:0}
function computeRateScores(){const t=state.analysis?.tech||technical(),s=scene(),p=editProgress(),cp=cropProgress(),baseTech=clamp(8.15-(t.bright*5.0+t.dark*1.8)+(t.dynamic>.45?.12:0),6.2,9.15),baseCreative=clamp(7.75+(s.confidence-78)/72+(s.key==='general'?-0.12:.10),6.3,9.0),technicalScore=clamp(baseTech+p*.72+cp*.10,6,9.9),creative=clamp(baseCreative+p*.62+cp*.18,6,9.8),potential=clamp(Math.max(baseTech,baseCreative)+1.05,7.2,10),overall=(technicalScore+creative)/2;return{technicalScore,creative,potential,overall,progress:p}}
function updateRateDock(score){const v=score??(state.analysis?computeRateScores().overall:null);document.querySelectorAll('.tool[data-tool="rate"] b').forEach(b=>b.textContent=v==null?'—':Number(v).toFixed(1))}
function ratePanel(){const s=scene(),sc=smartCrop(),scores=computeRateScores(),technicalScore=scores.technicalScore,creative=scores.creative,potential=scores.potential,tone=suggestedEdits(),locked=state.cropLock;updateRateDock(scores.overall);state.pendingCrop=sc.crop;$('#panelBody').innerHTML=`<div class="scoreWrap"><div class="score"><b>${technicalScore.toFixed(1)}</b><small>Technical now</small></div><div class="score"><b>${creative.toFixed(1)}</b><small>Creative now</small></div><div class="score"><b>${potential.toFixed(1)}</b><small>Potential</small></div></div><div class="masterCard"><div class="masterHead"><strong>✦ AI Master Recipe</strong><div class="grow"></div><span>${Math.round(scores.progress*100)}% applied</span></div><div class="masterItem"><span>⌗</span><div class="grow"><b>Smart Crop</b><small>${sc.crop.ratio==='free'?'Original':sc.crop.ratio} · ${sc.reason}</small></div><span class="lockPill ${locked?'':'off'}">${locked?'ASK':'READY'}</span></div><div class="masterItem"><span>↔</span><div class="grow"><b>Straighten</b><small>${sc.crop.rotate.toFixed(1)}° · dominant line correction</small></div><span>✓</span></div><div class="masterItem"><span>☀</span><div class="grow"><b>Exposure & Tone</b><small>Exposure ${fmt('exposure',tone.exposure)} · Shadows ${tone.shadows} · Highlights ${tone.highlights}</small></div><span>✓</span></div><div class="masterItem"><span>◐</span><div class="grow"><b>Color & White Balance</b><small>Vibrance ${tone.vibrance} · scene-safe color</small></div><span>✓</span></div><div class="masterItem"><span>◎</span><div class="grow"><b>Smart Local Adjustment</b><small>${s.key==='people'?'Person +0.18 EV':s.key==='travel'||s.key==='landscape'?'Sky −0.10 EV':s.key==='architecture'?'Architecture +0.10 EV':'Subject-aware'}</small></div><span>✓</span></div><div class="masterItem"><span>⌁</span><div class="grow"><b>Remove Distractions</b><small>${state.healProposals.length||0} proposed · approval always required</small></div><span>›</span></div></div><button class="primary wide" id="applyMaster">Apply Full AI Edit</button><div class="rowBtns" style="margin-top:10px"><button class="secondary" id="previewMaster">Preview Full Result</button><button class="secondary" id="reviewMaster">Review Individually</button></div>`;$('#applyMaster').onclick=applyMasterRecipe;$('#previewMaster').onclick=previewMasterRecipe;$('#reviewMaster').onclick=()=>toast(`Review: Tone ✓ · Color ✓ · Local mask ✓ · Crop ${state.cropLock?'asks before applying':'ready'} · Removals require approval`);requestAnimationFrame(()=>$('#panelBody').scrollTop=0)}
function applyMasterRecipe''',
    "live rating"
)

# 4) Apply All really applies the full recipe. Crop Lock becomes a one-time approval gate instead of silently blocking crop.
sub(
    r"function applyMasterRecipe\(\)\{.*?\}\nfunction previewMasterRecipe",
    '''function applyMasterRecipe(){const sug=suggestedEdits(),sc=smartCrop(),s=scene();pushHistory(true);state.edits={...state.edits,...sug};let cropApplied=false,cropDeclined=false;if(sc.crop.ratio!=='free'||Math.abs(sc.crop.rotate||0)>.05){if(state.cropLock){const ok=confirm(`FRAME recommends ${sc.crop.ratio==='free'?'the original ratio':sc.crop.ratio} with ${Number(sc.crop.rotate||0).toFixed(1)}° straighten. Apply this composition change once?`);if(ok){state.crop=JSON.parse(JSON.stringify(sc.crop));state.pendingCrop=null;cropApplied=true}else{state.pendingCrop=JSON.parse(JSON.stringify(sc.crop));cropDeclined=true}}else{state.crop=JSON.parse(JSON.stringify(sc.crop));state.pendingCrop=null;cropApplied=true}}else if(!state.cropLock){state.crop=JSON.parse(JSON.stringify(sc.crop));cropApplied=true}
if(s.key==='travel'||s.key==='landscape'){state.edits.maskExposure=-.10;heuristicMask('sky')}else if(s.key==='architecture'){state.edits.maskExposure=.10;heuristicMask('architecture')}else if(s.key==='people'||s.key==='wedding'){state.edits.maskExposure=.18;nativeSubject('person')}
render();updateMeta();requestAnimationFrame(()=>fitView());setTimeout(()=>{updateRateDock();if(state.tool==='rate')ratePanel()},120);saveSoon();toast(cropApplied?'Full AI edit applied · crop included · Undo available':cropDeclined?'AI tone/color/detail applied · crop saved for later review':'Full AI edit applied · Undo available')}
function previewMasterRecipe''',
    "full master recipe"
)

# Preview may demonstrate the AI crop even while the permanent Crop Lock is on; nothing is committed.
sub(
    r"function previewMasterRecipe\(\)\{.*?\}\nfunction saveSoon",
    '''function previewMasterRecipe(){const cmp=$('#compare');if(previewBackup){const old=previewBackup;previewBackup=null;cmp.classList.remove('active');restore(old);requestAnimationFrame(fitView);toast('Preview closed');return}previewBackup=cloneState(true);const sug=suggestedEdits(),sc=smartCrop(),s=scene();state.edits={...state.edits,...sug};state.crop=JSON.parse(JSON.stringify(sc.crop));if(s.key==='travel'||s.key==='landscape'){state.edits.maskExposure=-.10;heuristicMask('sky')}else if(s.key==='architecture'){state.edits.maskExposure=.10;heuristicMask('architecture')};render();updateMeta();requestAnimationFrame(()=>{fitView();drawCompareCropped();cmp.classList.add('active')});toast('Preview Full Result · crop is preview-only until approved')}
function drawCompareCropped(){const r=state.crop.rect||{x:0,y:0,w:1,h:1},sx=Math.round(r.x*editCanvas.width),sy=Math.round(r.y*editCanvas.height),sw=Math.max(1,Math.round(r.w*editCanvas.width)),sh=Math.max(1,Math.round(r.h*editCanvas.height));const a=$('#beforeCanvas'),b=$('#afterCanvas'),max=1200,k=Math.min(1,max/Math.max(sw,sh)),ow=Math.max(1,Math.round(sw*k)),oh=Math.max(1,Math.round(sh*k));a.width=b.width=ow;a.height=b.height=oh;a.getContext('2d').drawImage(sourceCanvas,sx,sy,sw,sh,0,0,ow,oh);b.getContext('2d').drawImage(editCanvas,sx,sy,sw,sh,0,0,ow,oh)}
function saveSoon''',
    "full preview"
)

# Standard before/after button also uses the committed crop.
s = s.replace("a.getContext('2d').drawImage(sourceCanvas,0,0,a.width,a.height);b.getContext('2d').drawImage(editCanvas,0,0)", "drawCompareCropped()")

# Crop Apply must immediately show the real cropped result instead of leaving the full source on screen.
old = "$('#cropApply').onclick=()=>{pushHistory();state.crop=JSON.parse(JSON.stringify(state.cropDraft));state.pendingCrop=null;state.cropDraft=null;updateMeta();saveSoon();toast('Crop applied · Undo available');openTool('crop')}"
new = "$('#cropApply').onclick=()=>{pushHistory();state.crop=JSON.parse(JSON.stringify(state.cropDraft));state.pendingCrop=null;state.cropDraft=null;updateMeta();saveSoon();toast('Crop applied · showing final composition');openTool('smart');requestAnimationFrame(fitView)}"
if old not in s:
    raise SystemExit('patch10: crop apply hook not found')
s = s.replace(old, new)

# Update dock after manual/preset changes as well.
s = s.replace("function render(){if(!sourceData)return;", "function render(){if(!sourceData)return;")
s = s.replace("editCtx.putImageData(new ImageData(out,workingDims.w,workingDims.h),0,0);applyHeal(editCtx);renderMask();renderHeal();saveSoon()}", "editCtx.putImageData(new ImageData(out,workingDims.w,workingDims.h),0,0);applyHeal(editCtx);renderMask();renderHeal();syncCommittedCropVisual();if(typeof updateRateDock==='function'&&state.analysis)updateRateDock();saveSoon()}")

OUT.write_text(s, encoding='utf-8')

# Create 0.10 entry point from generated 0.9 entry point.
idx09 = ROOT / 'app/src/main/assets/index09.html'
idx10 = ROOT / 'app/src/main/assets/index10.html'
idx = idx09.read_text(encoding='utf-8').replace('FRAME Beta 0.9','FRAME Beta 0.10').replace('app09.js','app10.js').replace('<b>8.5</b>Rate','<b>—</b>Rate')
idx10.write_text(idx, encoding='utf-8')

# Point Android to the new runtime and bump beta identity.
main = ROOT / 'app/src/main/java/com/ilia/frame/redesignbeta/MainActivity.java'
m = main.read_text(encoding='utf-8').replace('index09.html','index10.html')
main.write_text(m, encoding='utf-8')

gradle = ROOT / 'app/build.gradle'
g = gradle.read_text(encoding='utf-8').replace('versionCode 9','versionCode 10').replace("versionName '0.9.0-beta9'","versionName '0.10.0-beta10'")
gradle.write_text(g, encoding='utf-8')

print('Generated FRAME Beta 0.10 precision-edit runtime')
