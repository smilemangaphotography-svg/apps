#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "app/src/main/assets/app08.js"
OUT = ROOT / "app/src/main/assets/app09.js"
s = SRC.read_text(encoding="utf-8")

def sub(pattern, repl, label):
    global s
    s2, n = re.subn(pattern, repl, s, flags=re.S)
    if n != 1:
        raise SystemExit(f"patch09: {label} expected 1 match, got {n}")
    s = s2

# Reset Rate dock immediately for each newly opened photo so scores can never leak.
s = s.replace("show('editor');render();openTool('smart');requestAnimationFrame(fitView);analyzeCurrent()", "show('editor');updateRateDock(null);render();openTool('smart');requestAnimationFrame(fitView);analyzeCurrent()")
if "updateRateDock(null)" not in s:
    raise SystemExit("patch09: openRecord hook not applied")

# Make tool entry deterministic: render first, then reset scroll and center the active dock item.
sub(
    r"function openTool\(tool,scroll=true\)\{.*?\}\nfunction smartPanel",
    '''function openTool(tool,scroll=true){
state.tool=tool;$('#maskToggle').classList.add('hidden');$('#cropOverlay').classList.add('hidden');
$$('.tool').forEach(b=>b.classList.toggle('active',b.dataset.tool===tool));
const active=$(`.tool[data-tool="${tool}"]`);
const title={smart:'Smart Edit',presets:'Presets',light:'Light',color:'Color',detail:'Detail',mask:'Masks',heal:'Heal / Remove',crop:'Crop & Straighten',rate:'Rate & Improve'}[tool];
$('#panelTitle').textContent=title;
$('#panelHint').textContent={smart:'Analyze · suggest · preview · apply',presets:'Scene-aware smart presets',light:'Tone and exposure',color:'Color and white balance',detail:'Clarity and atmosphere',mask:'Lightroom-style local adjustments',heal:'Review removals before apply',crop:'Precise geometry · professional output',rate:'Technical · Creative · Potential'}[tool];
({smart:smartPanel,presets:presetsPanel,light:lightPanel,color:colorPanel,detail:detailPanel,mask:maskPanel,heal:healPanel,crop:cropPanel,rate:ratePanel}[tool]||smartPanel)();
requestAnimationFrame(()=>{if(scroll)$('#panelBody').scrollTop=0;active?.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});if(state.fitMode)fitView()});
}
function smartPanel''',
    "openTool"
)

# Add visual scene evidence so obvious coast/travel/architecture images do not fall back to General.
sub(
    r"function applyAnalysis\(req,a\)\{.*?\}\nfunction scene\(\)\{.*?\}\nfunction recommendations",
    '''function visualSceneHints(){
if(!sourceData||!workingDims.w||!workingDims.h)return{tags:[],coastal:false,architecture:false,landscape:false,confidence:0};
const d=sourceData.data,w=workingDims.w,h=workingDims.h,step=Math.max(4,Math.floor(Math.max(w,h)/320));
let topBlue=0,lowBlue=0,green=0,warm=0,neutral=0,edges=0,topN=0,lowN=0,n=0;
for(let y=0;y<h;y+=step){for(let x=0;x<w;x+=step){const i=(y*w+x)*4,r=d[i]/255,g=d[i+1]/255,b=d[i+2]/255,l=.2126*r+.7152*g+.0722*b,max=Math.max(r,g,b),min=Math.min(r,g,b),sat=max-min;const blue=b>r*1.06&&b>g*.91&&b>.23;const isGreen=g>r*1.08&&g>b*.92&&g>.18;const isWarm=r>g*1.04&&r>b*1.12&&r>.28;const isNeutral=sat<.18&&l>.16&&l<.88;if(y<h*.62){topN++;if(blue)topBlue++}if(y>h*.34){lowN++;if(blue)lowBlue++}if(isGreen)green++;if(isWarm)warm++;if(isNeutral)neutral++;if(x+step<w&&y+step<h){const ix=(y*w+x+step)*4,iy=((y+step)*w+x)*4,lx=.2126*d[ix]/255+.7152*d[ix+1]/255+.0722*d[ix+2]/255,ly=.2126*d[iy]/255+.7152*d[iy+1]/255+.0722*d[iy+2]/255;if(Math.abs(l-lx)+Math.abs(l-ly)>.22)edges++}n++}}
const ub=topBlue/Math.max(1,topN),lb=lowBlue/Math.max(1,lowN),gf=green/Math.max(1,n),wf=warm/Math.max(1,n),nf=neutral/Math.max(1,n),ef=edges/Math.max(1,n);
const coastal=ub>.055&&lb>.045;const architecture=ef>.105&&(wf+nf>.20||coastal);const landscape=coastal||gf>.105;const tags=[];if(coastal){tags.push('travel','landscape')}if(architecture)tags.push('architecture');if(landscape&&!tags.includes('landscape'))tags.push('landscape');
return{tags:[...new Set(tags)],coastal,architecture,landscape,confidence:Math.round(clamp(.68+ub+lb+ef*.25,.68,.98)*100),metrics:{ub,lb,gf,wf,nf,ef}};
}
function applyAnalysis(req,a){if(req!==analysisReq||!current)return;a.tech=technical();const hints=visualSceneHints();a.tags=[...new Set([...classify(a),...hints.tags])];a.visualHints=hints;state.analysis=a;current.analysis09=a;current.analysis08=a;current.tags=[...new Set([...(current.tags||[]).filter(x=>!SCENE_FILTERS.includes(x)),...a.tags])];current.frameSceneIndexV8=true;dbPut(current).catch(()=>{});updateRateDock();if(['smart','presets','mask','rate'].includes(state.tool))openTool(state.tool,false)}
function scene(){const a=state.analysis||{},h=a.visualHints||visualSceneHints(),tags=[...new Set([...(a.tags||classify(a)),...h.tags])],t=a.tech||technical(),labels=labelMap(a);const has=x=>tags.includes(x),label=(re,min=.65)=>labels.some(x=>re.test(x.t)&&x.c>=min);if(has('wedding'))return{name:'Wedding',key:'wedding',preset:'Wedding Glow',confidence:94,tags};if(has('people'))return{name:'People / Portrait',key:'people',preset:'Portrait Clean',confidence:95,tags};if(h.coastal&&(has('architecture')||h.architecture))return{name:'Coastal · Travel · Architecture',key:'travel',preset:'Coastal Pro',confidence:Math.max(94,h.confidence||0),tags};if(h.coastal)return{name:'Coastal · Travel',key:'travel',preset:'Coastal Pro',confidence:Math.max(92,h.confidence||0),tags};if(has('architecture'))return{name:'Architecture',key:'architecture',preset:label(/church|cathedral|basilica/, .60)?'Cathedral Luminous':'Architecture Detail',confidence:92,tags};if(has('food'))return{name:'Food / Drink',key:'food',preset:'Food Natural',confidence:91,tags};if(has('night')||t.luminance<.24)return{name:'Night',key:'night',preset:'Night Mood',confidence:89,tags};if(has('landscape')||has('travel'))return{name:'Landscape / Travel',key:has('landscape')?'landscape':'travel',preset:has('travel')?'Mediterranean':'Landscape Clean',confidence:91,tags};return{name:'General',key:'general',preset:'Natural Clean',confidence:78,tags};}
function recommendations''',
    "analysis and scene"
)

# Improve scene explanation in Smart Edit.
s = s.replace("${s.name} detected. Balanced technical starting point for this photo.", "${s.name}. ${s.tags?.length?'Detected: '+s.tags.slice(0,3).join(' · ')+'. ':''}Balanced technical starting point for this photo.")

# Exact-ratio helpers and ratio selection. Ratios use integer pixel multiples, not approximate floats.
sub(
    r"function ratioVal\(name\)\{.*?\}\nfunction setRatio\(name\)\{.*?\}\nfunction smartCrop",
    '''function ratioParts(name){return name==='1:1'?[1,1]:name==='4:5'?[4,5]:name==='3:4'?[3,4]:name==='9:16'?[9,16]:name==='16:9'?[16,9]:name==='3:2'?[3,2]:null}
function ratioVal(name){const p=ratioParts(name);return p?p[0]/p[1]:null}
function exactRatioRect(name,cx=.5,cy=.5,coverage=.92){const p=ratioParts(name);if(!p)return{x:0,y:0,w:1,h:1};const [rw,rh]=p,maxW=Math.max(rw,Math.floor(originalDims.w*coverage)),maxH=Math.max(rh,Math.floor(originalDims.h*coverage)),k=Math.max(1,Math.floor(Math.min(maxW/rw,maxH/rh))),wPx=rw*k,hPx=rh*k,w=wPx/originalDims.w,h=hPx/originalDims.h;return{x:clamp(cx-w/2,0,1-w),y:clamp(cy-h/2,0,1-h),w,h}}
function setRatio(name){if(state.cropLock)return toast('Crop is locked · unlock to change composition');state.cropDraft=state.cropDraft||JSON.parse(JSON.stringify(state.crop));const d=state.cropDraft;d.ratio=name;if(name==='free')d.rect={...state.crop.rect};else{let cx=.5,cy=.5;const f=state.analysis?.faces?.[0];if(f){cx=clamp((f.left+f.right)/2,.2,.8);cy=clamp((f.top+f.bottom)/2+.10,.25,.75)}d.rect=exactRatioRect(name,cx,cy,.92)}positionCropOverlay();cropPanel()}
function smartCrop''',
    "exact ratio helpers"
)

# More conservative AI composition choices: 9:16 only when the source/composition is genuinely very vertical.
sub(
    r"function smartCrop\(\)\{.*?\}\nfunction estimateStraighten",
    '''function smartCrop(){const s=scene(),ar=originalDims.w/originalDims.h,h=state.analysis?.visualHints||visualSceneHints();let ratio='free',reason='Original composition already preserves the strongest visual balance';if(s.key==='people'||s.key==='wedding'){ratio=ar<.58?'9:16':'4:5';reason=ratio==='9:16'?'Strong vertical subject · 9:16 framing':'Portrait balance · eye line near upper third'}else if(s.key==='architecture'){ratio=ar>1.55?'3:2':ar<.72?'4:5':'4:5';reason='Architecture balance · verticals and rule-of-thirds structure'}else if(s.key==='travel'||s.key==='landscape'){if(ar>1.58){ratio='16:9';reason='Wide landscape flow · horizon and leading lines'}else if(ar<.58){ratio='9:16';reason='Strong vertical flow · foreground-to-background leading line'}else if(ar<.90){ratio='4:5';reason='Vertical travel composition · stronger rule-of-thirds balance'}else{ratio='free';reason=h.coastal?'Original ratio preserves coast, horizon and architectural context':'Original composition preserves the strongest guiding lines'}}else if(s.key==='food'){ratio=ar<.62?'9:16':'4:5';reason='Subject emphasis · controlled negative space'};const c={rect:ratio==='free'?{x:0,y:0,w:1,h:1}:exactRatioRect(ratio,.5,.5,.92),ratio,rotate:estimateStraighten(),flipH:false,flipV:false};return{crop:c,reason}}
function estimateStraighten''',
    "smartCrop"
)

# Keep crop handles inside the source and mathematically preserve the selected aspect ratio while dragging.
sub(
    r"function moveCropDrag\(e\)\{.*?\}\nfunction endCropDrag",
    '''function moveCropDrag(e){if(!cropDrag)return;const d=state.cropDraft||state.crop,rr={...cropDrag.rect},stage=cropDrag.stage,min=.06,p=ratioParts(d.ratio),px=clamp((e.clientX-stage.left)/stage.width,0,1),py=clamp((e.clientY-stage.top)/stage.height,0,1);if(!p){const dx=(e.clientX-cropDrag.startX)/stage.width,dy=(e.clientY-cropDrag.startY)/stage.height;if(cropDrag.h.includes('l')){const nx=clamp(rr.x+dx,0,rr.x+rr.w-min);d.rect.x=nx;d.rect.w=rr.w+(rr.x-nx)}if(cropDrag.h.includes('r'))d.rect.w=clamp(rr.w+dx,min,1-rr.x);if(cropDrag.h.includes('t')){const ny=clamp(rr.y+dy,0,rr.y+rr.h-min);d.rect.y=ny;d.rect.h=rr.h+(rr.y-ny)}if(cropDrag.h.includes('b'))d.rect.h=clamp(rr.h+dy,min,1-rr.y)}else{const [rw,rh]=p,opposite={tl:[rr.x+rr.w,rr.y+rr.h],tr:[rr.x,rr.y+rr.h],bl:[rr.x+rr.w,rr.y],br:[rr.x,rr.y]}[cropDrag.h],ax=opposite[0],ay=opposite[1],wantW=Math.abs(px-ax)*originalDims.w,wantH=Math.abs(py-ay)*originalDims.h,k=Math.max(1,Math.floor(Math.min(wantW/rw,wantH/rh))),minK=Math.max(1,Math.ceil(Math.max(min*originalDims.w/rw,min*originalDims.h/rh))),kk=Math.max(k,minK),w=Math.min(1,rw*kk/originalDims.w),h=Math.min(1,rh*kk/originalDims.h);if(cropDrag.h==='tl'){d.rect={x:clamp(ax-w,0,ax-min),y:clamp(ay-h,0,ay-min),w,h}}if(cropDrag.h==='tr'){d.rect={x:ax,y:clamp(ay-h,0,ay-min),w:Math.min(w,1-ax),h}}if(cropDrag.h==='bl'){d.rect={x:clamp(ax-w,0,ax-min),y:ay,w,h:Math.min(h,1-ay)}}if(cropDrag.h==='br'){d.rect={x:ax,y:ay,w:Math.min(w,1-ax),h:Math.min(h,1-ay)}}const q=ratioParts(d.ratio);if(q){const [a,b]=q,k2=Math.max(1,Math.floor(Math.min(d.rect.w*originalDims.w/a,d.rect.h*originalDims.h/b)));d.rect.w=a*k2/originalDims.w;d.rect.h=b*k2/originalDims.h;if(cropDrag.h.includes('l'))d.rect.x=ax-d.rect.w;if(cropDrag.h.includes('t'))d.rect.y=ay-d.rect.h}}positionCropOverlay();const out=$('.cropMeta b');if(out){const dm=draftDims(d);out.textContent=`${dm.w} × ${dm.h}`}}
function endCropDrag''',
    "ratio-preserving crop drag"
)

# Snap displayed/export crop dimensions to exact integer ratio multiples.
sub(
    r"function draftDims\(d\)\{.*?\}\nfunction startCropDrag",
    '''function draftDims(d){const r=d.rect||{x:0,y:0,w:1,h:1},p=ratioParts(d.ratio);let w=Math.max(1,Math.round(originalDims.w*r.w)),h=Math.max(1,Math.round(originalDims.h*r.h));if(p){const [rw,rh]=p,k=Math.max(1,Math.floor(Math.min(w/rw,h/rh)));w=rw*k;h=rh*k}const q=((Math.abs(d.rotate||0)%180)+180)%180;if(q>45&&q<135)[w,h]=[h,w];return{w,h}}
function startCropDrag''',
    "draftDims"
)

# Dynamic rating; dock never shows a fake fixed 8.5.
sub(
    r"function ratePanel\(\)\{.*?\}\nfunction applyMasterRecipe",
    '''function computeRateScores(){const t=state.analysis?.tech||technical(),s=scene(),technicalScore=clamp(9.1-(t.bright*6+t.dark*2.2)+(t.dynamic>.45?.15:0),6,9.8),creative=clamp(8.15+(s.confidence-78)/65+(s.key==='general'?-0.15:.12),6,9.6),potential=clamp(Math.max(technicalScore,creative)+.45,7,10);return{technicalScore,creative,potential}}
function updateRateDock(score){const b=$('.tool[data-tool="rate"] b');if(!b)return;const v=score??(state.analysis?computeRateScores().potential:null);b.textContent=v==null?'—':Number(v).toFixed(1)}
function ratePanel(){const s=scene(),sc=smartCrop(),scores=computeRateScores(),technicalScore=scores.technicalScore,creative=scores.creative,potential=scores.potential,tone=suggestedEdits(),locked=state.cropLock;updateRateDock(potential);state.pendingCrop=sc.crop;$('#panelBody').innerHTML=`<div class="scoreWrap"><div class="score"><b>${technicalScore.toFixed(1)}</b><small>Technical</small></div><div class="score"><b>${creative.toFixed(1)}</b><small>Creative</small></div><div class="score"><b>${potential.toFixed(1)}</b><small>Potential</small></div></div><div class="masterCard"><div class="masterHead"><strong>✦ AI Master Recipe</strong><div class="grow"></div><span>${s.confidence}%</span></div><div class="masterItem"><span>⌗</span><div class="grow"><b>Smart Crop</b><small>${sc.crop.ratio==='free'?'Original':sc.crop.ratio} · ${sc.reason}</small></div><span class="lockPill ${locked?'':'off'}">${locked?'LOCKED':'READY'}</span></div><div class="masterItem"><span>↔</span><div class="grow"><b>Straighten</b><small>${sc.crop.rotate.toFixed(1)}° · dominant horizontal/vertical alignment</small></div><span>✓</span></div><div class="masterItem"><span>☀</span><div class="grow"><b>Exposure & Tone</b><small>Exposure ${fmt('exposure',tone.exposure)} · Highlights ${tone.highlights}</small></div><span>✓</span></div><div class="masterItem"><span>◐</span><div class="grow"><b>Color & White Balance</b><small>Scene-safe color, temperature and vibrance</small></div><span>✓</span></div><div class="masterItem"><span>◎</span><div class="grow"><b>Smart Masks</b><small>${s.key==='people'?'People / Subject':s.key==='travel'||s.key==='landscape'?'Sky / Landscape / Architecture':'Subject / Background'}</small></div><span>✓</span></div><div class="masterItem"><span>⌁</span><div class="grow"><b>Remove Distractions</b><small>${state.healProposals.length||0} proposed · approval required</small></div><span>›</span></div></div><button class="primary wide" id="applyMaster">Apply All Suggested Fixes</button><div class="rowBtns" style="margin-top:10px"><button class="secondary" id="previewMaster">Preview Result</button><button class="secondary" id="reviewMaster">Review Individually</button></div>`;$('#applyMaster').onclick=applyMasterRecipe;$('#previewMaster').onclick=previewMasterRecipe;$('#reviewMaster').onclick=()=>toast(`Review: Tone ✓ · Color ✓ · Masks ✓ · Crop ${state.cropLock?'locked':'ready'} · Removals require approval`);requestAnimationFrame(()=>$('#panelBody').scrollTop=0)}
function applyMasterRecipe''',
    "dynamic rating"
)

# Preview Result explicitly uses side-by-side Before / After; it remains off otherwise.
sub(
    r"function previewMasterRecipe\(\)\{.*?\}\nfunction saveSoon",
    '''function previewMasterRecipe(){const cmp=$('#compare');if(previewBackup){const old=previewBackup;previewBackup=null;cmp.classList.remove('active');restore(old);toast('Preview closed');return}previewBackup=cloneState(true);const sug=suggestedEdits(),sc=smartCrop();state.edits={...state.edits,...sug};if(!state.cropLock)state.crop=JSON.parse(JSON.stringify(sc.crop));render();updateMeta();requestAnimationFrame(()=>{const a=$('#beforeCanvas'),b=$('#afterCanvas');a.width=b.width=editCanvas.width;a.height=b.height=editCanvas.height;a.getContext('2d').drawImage(sourceCanvas,0,0,a.width,a.height);b.getContext('2d').drawImage(editCanvas,0,0,b.width,b.height);cmp.classList.add('active')});toast('Preview Result · Before / After')}
function saveSoon''',
    "master preview"
)

# Stronger Apply All message and leave crop pending when locked.
s = s.replace("toast(state.cropLock?'AI recipe applied · Smart Crop saved as recommendation (locked)':'AI Master Recipe applied including crop')", "updateRateDock();toast(state.cropLock?'AI Master Recipe applied · Smart Crop remains locked for your approval':'AI Master Recipe applied · tone, color, masks, straighten and crop included')")

# Export uses the snapped crop dimensions for exact aspect ratios.
s = s.replace("dims=actualCropDims(),limit=6000", "dims=draftDims(state.crop),limit=6000")

OUT.write_text(s, encoding="utf-8")
print(f"patch09: wrote {OUT} ({len(s)} bytes)")
