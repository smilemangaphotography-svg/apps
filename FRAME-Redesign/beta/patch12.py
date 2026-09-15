#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parent
subprocess.run(["python3", str(ROOT / "patch11.py")], check=True)
SRC = ROOT / "app/src/main/assets/app10.js"
OUT = ROOT / "app/src/main/assets/app11.js"
s = SRC.read_text(encoding="utf-8")

def sub(pattern, repl, label):
    global s
    s2, n = re.subn(pattern, repl, s, flags=re.S)
    if n != 1:
        raise SystemExit(f"patch12: {label} expected 1 match, got {n}")
    s = s2

# 1) Mask overlay must only be visible while the Mask tool is open.
sub(
    r"function renderMask\(\)\{.*?\}\nfunction renderHeal",
    '''function renderMask(){maskCtx.clearRect(0,0,maskCanvas.width,maskCanvas.height);if(state.tool!=='mask'||!state.maskVisible||!state.maskData)return;const id=maskCtx.createImageData(maskCanvas.width,maskCanvas.height);for(let p=0,i=0;p<state.maskData.length;p++,i+=4){const a=state.maskData[p];if(a<8)continue;id.data[i]=244;id.data[i+1]=55;id.data[i+2]=66;id.data[i+3]=Math.round(a*state.maskOpacity)}maskCtx.putImageData(id,0,0)}
function renderHeal''',
    "mask overlay scope"
)

# 2) Keep the strong scene recipe as a raw proposal, then quality-gate it.
if "function rawSuggestedEdits(){" not in s:
    s = s.replace("function suggestedEdits(){", "function rawSuggestedEdits(){", 1)

QUALITY = r'''
function recipeScaled(base,strength,colorStrength=strength){const out={...DEFAULTS};for(const k of Object.keys(DEFAULTS)){const v=Number(base[k])||0;const isColor=['temp','tint','vibrance','saturation'].includes(k);out[k]=v*(isColor?colorStrength:strength)}out.temp=clamp(out.temp,-4,4);out.tint=clamp(out.tint,-3,3);out.vibrance=clamp(out.vibrance,-8,22);out.saturation=clamp(out.saturation,-8,4);out.highlights=clamp(out.highlights,-60,20);out.shadows=clamp(out.shadows,-20,52);out.clarity=clamp(out.clarity,-8,15);out.dehaze=clamp(out.dehaze,-4,14);return out}
function recipeMetrics(e){if(!sourceData)return{lum:.5,bright:0,dark:0,sat:.2,dynamic:.5,castShift:0,magenta:0};const d=sourceData.data,w=workingDims.w,h=workingDims.h,nPix=d.length/4,step=Math.max(1,Math.floor(nPix/18000)),vals=[];let lum=0,bright=0,dark=0,sat=0,magenta=0,n=0,sr=0,sg=0,sb=0,rr=0,rg=0,rb=0;const exp=Math.pow(2,Number(e.exposure)||0),contrast=(Number(e.contrast)+(Number(e.clarity)||0)*.28+(Number(e.dehaze)||0)*.18)/100,satAdj=(Number(e.saturation)+(Number(e.vibrance)||0)*.55)/100,temp=(Number(e.temp)||0)/100,tint=(Number(e.tint)||0)/100,hi=(Number(e.highlights)||0)/100,sh=(Number(e.shadows)||0)/100,wh=(Number(e.whites)||0)/100,bl=(Number(e.blacks)||0)/100;for(let p=0;p<nPix;p+=step){const i=p*4,y=Math.floor(p/w),r0=d[i]/255,g0=d[i+1]/255,b0=d[i+2]/255;let r=r0*exp,g=g0*exp,b=b0*exp;let l=.2126*r+.7152*g+.0722*b;if(l>.5){const q=hi*(l-.5)*.55;r+=q;g+=q;b+=q}if(l<.5){const q=sh*(.5-l)*.55;r+=q;g+=q;b+=q}if(l>.75){const q=wh*((l-.75)/.25)*.18;r+=q;g+=q;b+=q}if(l<.25){const q=bl*((.25-l)/.25)*.18;r+=q;g+=q;b+=q}r=(r-.5)*(1+contrast)+.5;g=(g-.5)*(1+contrast)+.5;b=(b-.5)*(1+contrast)+.5;r+=temp*.10;b-=temp*.10;g+=tint*.03;r+=tint*.012;b+=tint*.012;l=.2126*r+.7152*g+.0722*b;r=l+(r-l)*(1+satAdj);g=l+(g-l)*(1+satAdj);b=l+(b-l)*(1+satAdj);if(state.highlightGuard){const mx=Math.max(r,g,b);if(mx>1){const sc=1/mx;r*=sc;g*=sc;b*=sc}}r=clamp(r);g=clamp(g);b=clamp(b);const ll=.2126*r+.7152*g+.0722*b;lum+=ll;if(ll>.985)bright++;if(ll<.015)dark++;sat+=Math.max(r,g,b)-Math.min(r,g,b);if(y<h*.62&&r>.56&&b>.56&&g<Math.min(r,b)*.73)magenta++;vals.push(ll);sr+=r0;sg+=g0;sb+=b0;rr+=r;rg+=g;rb+=b;n++}vals.sort((a,b)=>a-b);const p10=vals[Math.floor(vals.length*.1)]||0,p90=vals[Math.floor(vals.length*.9)]||1,srcCast=((sr+sb)/2-sg)/Math.max(1,n),dstCast=((rr+rb)/2-rg)/Math.max(1,n);return{lum:lum/Math.max(1,n),bright:bright/Math.max(1,n),dark:dark/Math.max(1,n),sat:sat/Math.max(1,n),dynamic:p90-p10,castShift:Math.abs(dstCast-srcCast),magenta:magenta/Math.max(1,n)}}
function scoreRecipe(e){const m=recipeMetrics(e),sc=scene(),src=technical(),targetLum=sc.key==='night'?.34:(sc.key==='people'||sc.key==='wedding'?.49:.45),targetSat=clamp(src.sat*1.08,.12,.28);let score=9.55-Math.abs(m.lum-targetLum)*5.8-m.bright*24-m.dark*11-Math.abs(m.sat-targetSat)*3.8-m.castShift*15-m.magenta*28;if(m.dynamic>.35&&m.dynamic<.78)score+=.18;if(sc.key==='people'||sc.key==='wedding'){score-=Math.max(0,Math.abs(Number(e.temp)||0)-3)*.10;score-=Math.max(0,Math.abs(Number(e.tint)||0)-2)*.15}const flags=[];if(m.bright>.035)flags.push('highlight clipping');if(m.dark>.16)flags.push('crushed shadows');if(m.castShift>.075)flags.push('color cast');if(m.magenta>.035&&sc.key!=='night')flags.push('magenta cast');if(m.sat>.38)flags.push('oversaturation');return{score:clamp(score,5,9.9),metrics:m,flags}}
function qualityMasterRecipe(){const raw=rawSuggestedEdits(),candidates=[['Natural',recipeScaled(raw,.56,.50)],['Balanced',recipeScaled(raw,.76,.66)],['Scene',recipeScaled(raw,.94,.78)],['Creative',recipeScaled(raw,1.03,.84)]],original=scoreRecipe(DEFAULTS);let best={name:'Original',edits:{...DEFAULTS},...original};for(const [name,edits] of candidates){const q=scoreRecipe(edits);if(q.score>best.score&&q.flags.length<=1)best={name,edits,...q}}if(best.name==='Original'){const safe=recipeScaled(raw,.52,.42),q=scoreRecipe(safe);best={name:'Natural Safe',edits:safe,...q}}state.masterQuality={name:best.name,score:best.score,originalScore:original.score,flags:best.flags||[]};return{...best,original}}
function suggestedEdits(){return qualityMasterRecipe().edits}
function cropIsApplied(sc){if(!sc)return false;if(sc.crop.ratio==='free')return state.crop.ratio==='free'&&Math.abs((state.crop.rotate||0)-(sc.crop.rotate||0))<.35;return state.crop.ratio===sc.crop.ratio&&Math.abs((state.crop.rotate||0)-(sc.crop.rotate||0))<.35}
function masterCompletion(sc){const p=editProgress(),cropNeeded=sc.crop.ratio!=='free'||Math.abs(sc.crop.rotate||0)>.05,cropDone=!cropNeeded||cropIsApplied(sc);const localNeeded=['travel','landscape','architecture','people','wedding'].includes(scene().key),localDone=!localNeeded||(state.maskData&&Math.abs(Number(state.edits.maskExposure)||0)>.01);const pct=Math.round((p*.72+(cropDone?.18:0)+(localDone?.10:0))*100);return{pct:clamp(pct,0,100),cropNeeded,cropDone,localDone}}
function showCompositionSheet(sc){return new Promise(resolve=>{document.getElementById('frameDecisionSheet')?.remove();const ratio=sc.crop.ratio==='free'?'Original':sc.crop.ratio,wrap=document.createElement('div');wrap.id='frameDecisionSheet';wrap.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.66);display:flex;align-items:flex-end;justify-content:center;padding:18px;box-sizing:border-box';wrap.innerHTML=`<div style="width:min(680px,100%);background:#111619;border:1px solid #343b40;border-radius:24px;padding:20px;color:#fff;box-shadow:0 18px 70px rgba(0,0,0,.55)"><div style="font-size:13px;color:#e9c36a;letter-spacing:.08em;margin-bottom:8px">FRAME SMART CROP</div><div style="font-size:24px;font-weight:750;margin-bottom:7px">Recommended composition: ${ratio}</div><div style="color:#aeb4b9;line-height:1.45;margin-bottom:16px">${sc.reason}. Straighten ${Number(sc.crop.rotate||0).toFixed(1)}°. Crop Lock stays ON; this approval applies only this recommendation.</div><button data-a="apply" style="width:100%;height:54px;border:0;border-radius:17px;background:#f0c562;color:#16130c;font-weight:800;font-size:18px;margin-bottom:9px">Apply Recommended Crop</button><div style="display:grid;grid-template-columns:1fr 1fr;gap:9px"><button data-a="review" style="height:50px;border:1px solid #3b444a;border-radius:15px;background:#171d20;color:#fff;font-size:16px">Review Crop</button><button data-a="keep" style="height:50px;border:1px solid #3b444a;border-radius:15px;background:#171d20;color:#fff;font-size:16px">Keep Original</button></div></div>`;document.body.appendChild(wrap);const done=v=>{wrap.remove();resolve(v)};wrap.querySelector('[data-a="apply"]').onclick=()=>done('apply');wrap.querySelector('[data-a="keep"]').onclick=()=>done('keep');wrap.querySelector('[data-a="review"]').onclick=()=>done('review')})}
'''
marker = "function activeDisplayCrop(){"
if marker not in s:
    raise SystemExit("patch12: activeDisplayCrop marker not found")
s = s.replace(marker, QUALITY + "\n" + marker, 1)

# 3) Smarter composition selection: evaluate several ratios and only crop when score improves.
sub(
    r"function smartCrop\(\)\{.*?\}\nfunction estimateStraighten",
    '''function saliencyPoint(){if(!sourceData)return{x:.5,y:.5};const d=sourceData.data,w=workingDims.w,h=workingDims.h,step=Math.max(5,Math.floor(Math.max(w,h)/300));let sx=0,sy=0,sum=0;for(let y=step;y<h-step;y+=step)for(let x=step;x<w-step;x+=step){const i=(y*w+x)*4,ix=(y*w+x+step)*4,iy=((y+step)*w+x)*4,l=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2],lx=.2126*d[ix]+.7152*d[ix+1]+.0722*d[ix+2],ly=.2126*d[iy]+.7152*d[iy+1]+.0722*d[iy+2],m=Math.abs(l-lx)+Math.abs(l-ly);if(m<18)continue;sx+=(x/w)*m;sy+=(y/h)*m;sum+=m}return sum?{x:sx/sum,y:sy/sum}:{x:.5,y:.5}}
function compositionScore(c){const r=c.rect||{x:0,y:0,w:1,h:1},p=saliencyPoint(),nx=clamp((p.x-r.x)/Math.max(.001,r.w)),ny=clamp((p.y-r.y)/Math.max(.001,r.h)),targets=[1/3,.382,.5,.618,2/3],near=v=>Math.min(...targets.map(t=>Math.abs(v-t))),guide=1-clamp((near(nx)+near(ny))*2.7),area=r.w*r.h,s=scene();let prior=0;if((s.key==='people'||s.key==='wedding')&&c.ratio==='4:5')prior=.20;if((s.key==='travel'||s.key==='landscape')&&originalDims.w<originalDims.h&&c.ratio==='4:5')prior=.18;if((s.key==='travel'||s.key==='landscape')&&originalDims.w>originalDims.h&&c.ratio==='16:9')prior=.16;if(s.key==='architecture'&&['4:5','3:2'].includes(c.ratio))prior=.14;if(s.key==='food'&&['1:1','4:5'].includes(c.ratio))prior=.16;const faces=state.analysis?.faces||[];let face=0;if(faces.length){face=.22;for(const f of faces){const cx=(f.left+f.right)/2,cy=(f.top+f.bottom)/2;if(cx<r.x||cx>r.x+r.w||cy<r.y||cy>r.y+r.h)face-=.35}}return guide*.62+area*.30+prior+face-Math.abs(c.rotate||0)*.006}
function smartCrop(){const s=scene(),p=saliencyPoint(),ratios=['free','1:1','4:5','3:4','3:2','16:9','9:16'],rot=estimateStraighten(),cands=[];for(const ratio of ratios){let rect={x:0,y:0,w:1,h:1};if(ratio!=='free'){let cx=clamp(p.x,.22,.78),cy=clamp(p.y,.22,.78);const f=state.analysis?.faces?.[0];if(f){cx=clamp((f.left+f.right)/2,.22,.78);cy=clamp((f.top+f.bottom)/2+.08,.24,.76)}rect=exactRatioRect(ratio,cx,cy,.94)}const crop={rect,ratio,rotate:rot,flipH:false,flipV:false};cands.push({crop,score:compositionScore(crop)})}const free=cands[0];cands.sort((a,b)=>b.score-a.score);let best=cands[0];if(best.crop.ratio!=='free'&&best.score<free.score+.10)best=free;const reason=best.crop.ratio==='free'?'Original composition already has the strongest balance':best.crop.ratio==='4:5'?'Stronger rule-of-thirds balance and subject emphasis':best.crop.ratio==='9:16'?'Vertical leading-line flow and subject emphasis':best.crop.ratio==='16:9'?'Wide horizon flow and stronger visual direction':best.crop.ratio==='1:1'?'Tighter subject emphasis with controlled negative space':'Improved guiding lines, balance and visual weight';return{crop:best.crop,reason,compositionScore:best.score}}
function estimateStraighten''',
    "quality smart crop"
)

# 4) Result-based rating and truthful component status.
sub(
    r"function computeRateScores\(\)\{.*?\}\nfunction updateRateDock\(score\)\{.*?\}\nfunction ratePanel\(\)\{.*?\}\nfunction applyMasterRecipe",
    '''function computeRateScores(){const currentQ=scoreRecipe(state.edits),best=qualityMasterRecipe(),sc=smartCrop(),comp=compositionScore(state.crop),bestComp=sc.compositionScore||comp,technicalScore=clamp(currentQ.score,5.5,9.9),creative=clamp(7.2+comp*1.25+(scene().key==='general'?0:.15),6,9.8),potential=clamp(Math.max(best.score,technicalScore)+(Math.max(0,bestComp-comp)*.55),7,10),overall=(technicalScore+creative)/2;return{technicalScore,creative,potential,overall,currentQ,best}}
function updateRateDock(score){const v=score??(state.analysis?computeRateScores().overall:null);document.querySelectorAll('.tool[data-tool="rate"] b').forEach(b=>b.textContent=v==null?'—':Number(v).toFixed(1))}
function ratePanel(){const s=scene(),sc=smartCrop(),scores=computeRateScores(),tone=scores.best.edits,done=masterCompletion(sc),cropStatus=done.cropDone?(sc.crop.ratio==='free'?'ORIGINAL':'APPLIED'):state.pendingCrop?'REVIEW':(state.cropLock?'ASK':'READY'),qualityName=state.masterQuality?.name||scores.best.name,qa=scores.currentQ.flags.length?scores.currentQ.flags.join(', '):'Quality checks passed';state.pendingCrop=done.cropDone?null:sc.crop;updateRateDock(scores.overall);$('#panelBody').innerHTML=`<div class="scoreWrap"><div class="score"><b>${scores.technicalScore.toFixed(1)}</b><small>Technical now</small></div><div class="score"><b>${scores.creative.toFixed(1)}</b><small>Creative now</small></div><div class="score"><b>${scores.potential.toFixed(1)}</b><small>Potential</small></div></div><div class="masterCard"><div class="masterHead"><strong>✦ AI Master Recipe</strong><div class="grow"></div><span>${done.pct}% committed</span></div><div class="masterItem"><span>◈</span><div class="grow"><b>Quality Gate</b><small>${qualityName} · ${qa}</small></div><span>✓</span></div><div class="masterItem"><span>⌗</span><div class="grow"><b>Smart Crop</b><small>${sc.crop.ratio==='free'?'Original':sc.crop.ratio} · ${sc.reason}</small></div><span class="lockPill ${done.cropDone?'off':''}">${cropStatus}</span></div><div class="masterItem"><span>↔</span><div class="grow"><b>Straighten</b><small>${sc.crop.rotate.toFixed(1)}° · dominant-line correction</small></div><span>${done.cropDone?'✓':'•'}</span></div><div class="masterItem"><span>☀</span><div class="grow"><b>Exposure & Tone</b><small>Exposure ${fmt('exposure',tone.exposure)} · Shadows ${Math.round(tone.shadows)} · Highlights ${Math.round(tone.highlights)}</small></div><span>✓</span></div><div class="masterItem"><span>◐</span><div class="grow"><b>Color & White Balance</b><small>Vibrance ${Math.round(tone.vibrance)} · color-cast safety active</small></div><span>✓</span></div><div class="masterItem"><span>◎</span><div class="grow"><b>Smart Masks</b><small>Overlay only appears in Mask mode</small></div><span>${done.localDone?'✓':'•'}</span></div><div class="masterItem"><span>⌁</span><div class="grow"><b>Remove Distractions</b><small>${state.healProposals.length||0} proposed · approval always required</small></div><span>›</span></div></div><button class="primary wide" id="applyMaster">Apply Quality-Gated AI Edit</button><div class="rowBtns" style="margin-top:10px"><button class="secondary" id="previewMaster">Preview Best Result</button><button class="secondary" id="reviewMaster">Review Individually</button></div>`;$('#applyMaster').onclick=applyMasterRecipe;$('#previewMaster').onclick=previewMasterRecipe;$('#reviewMaster').onclick=()=>toast(`Review: ${qualityName} tone/color · Crop ${cropStatus} · removals require approval`);requestAnimationFrame(()=>$('#panelBody').scrollTop=0)}
async function applyMasterRecipe''',
    "result based rating"
)

# 5) Full AI apply uses the quality winner, a FRAME-styled crop decision sheet, and a post-edit QA backoff.
sub(
    r"async function applyMasterRecipe\(\)\{.*?\}\nfunction previewMasterRecipe|function applyMasterRecipe\(\)\{.*?\}\nfunction previewMasterRecipe",
    '''async function applyMasterRecipe(){const master=qualityMasterRecipe(),sug=master.edits,sc=smartCrop(),s=scene();pushHistory(true);state.edits={...state.edits,...sug};let cropResult='none',reviewAfter=false;if(sc.crop.ratio!=='free'||Math.abs(sc.crop.rotate||0)>.05){if(state.cropLock){cropResult=await showCompositionSheet(sc);if(cropResult==='apply'){state.crop=JSON.parse(JSON.stringify(sc.crop));state.pendingCrop=null}else if(cropResult==='review'){state.pendingCrop=JSON.parse(JSON.stringify(sc.crop));state.cropDraft=JSON.parse(JSON.stringify(sc.crop));reviewAfter=true}else{state.pendingCrop=JSON.parse(JSON.stringify(sc.crop))}}else{state.crop=JSON.parse(JSON.stringify(sc.crop));state.pendingCrop=null;cropResult='apply'}}
if(s.key==='travel'||s.key==='landscape'){state.edits.maskExposure=-.08;heuristicMask('sky')}else if(s.key==='architecture'){state.edits.maskExposure=.08;heuristicMask('architecture')}else if(s.key==='people'||s.key==='wedding'){state.edits.maskExposure=.14;nativeSubject('person')}
let qa=scoreRecipe(state.edits);if(qa.flags.length>1||qa.score<master.original.score-.02){const safer=recipeScaled(sug,.72,.48);state.edits={...state.edits,...safer};qa=scoreRecipe(state.edits)}state.masterApplied={quality:master.name,score:qa.score,crop:cropResult,at:Date.now()};render();updateMeta();requestAnimationFrame(()=>fitView());saveSoon();setTimeout(()=>{updateRateDock();if(reviewAfter){openTool('crop');toast('AI edit applied · review recommended crop')}else if(state.tool==='rate')ratePanel()},140);toast(cropResult==='apply'?'Quality-gated AI edit applied · crop committed · Undo available':cropResult==='review'?'AI edit applied · crop opened for review':'Quality-gated AI edit applied · composition kept · Undo available')}
function previewMasterRecipe''',
    "quality apply"
)

# Preview uses the quality-gated candidate and never leaks the red mask overlay into Smart/Rate.
sub(
    r"function previewMasterRecipe\(\)\{.*?\}\nfunction drawCompareCropped",
    '''function previewMasterRecipe(){const cmp=$('#compare');if(previewBackup){const old=previewBackup;previewBackup=null;cmp.classList.remove('active');restore(old);requestAnimationFrame(fitView);toast('Preview closed');return}previewBackup=cloneState(true);const master=qualityMasterRecipe(),sc=smartCrop(),s=scene();state.edits={...state.edits,...master.edits};state.crop=JSON.parse(JSON.stringify(sc.crop));if(s.key==='travel'||s.key==='landscape'){state.edits.maskExposure=-.08;heuristicMask('sky')}else if(s.key==='architecture'){state.edits.maskExposure=.08;heuristicMask('architecture')};render();updateMeta();requestAnimationFrame(()=>{fitView();drawCompareCropped();cmp.classList.add('active')});toast(`Previewing ${master.name} result · crop preview only until approved`)}
function drawCompareCropped''',
    "quality preview"
)

# Smart page explains the quality winner, not just the raw scene preset.
s = s.replace("AI SCENE ANALYSIS · ${s.confidence}%", "AI QUALITY ENGINE · ${s.confidence}%")
s = s.replace("${s.name}. ${s.tags?.length?'Detected: '+s.tags.slice(0,3).join(' · ')+'. ':''}Balanced technical starting point for this photo.", "${s.name}. ${s.tags?.length?'Detected: '+s.tags.slice(0,3).join(' · ')+'. ':''}${state.masterQuality?.name||'Balanced'} candidate selected after color, clipping and tonal QA.")

# Create the 0.11 entry point.
OUT.write_text(s, encoding="utf-8")
idx10 = ROOT / "app/src/main/assets/index10.html"
idx11 = ROOT / "app/src/main/assets/index11.html"
idx = idx10.read_text(encoding="utf-8").replace("FRAME Beta 0.10", "FRAME Beta 0.11").replace("Version 0.9.0 beta", "Version 0.11.0 beta").replace("app10.js", "app11.js")
idx11.write_text(idx, encoding="utf-8")

main = ROOT / "app/src/main/java/com/ilia/frame/redesignbeta/MainActivity.java"
m = main.read_text(encoding="utf-8").replace("index10.html", "index11.html")
main.write_text(m, encoding="utf-8")

gradle = ROOT / "app/build.gradle"
g = gradle.read_text(encoding="utf-8").replace("versionCode 11", "versionCode 12").replace("versionName '0.10.1-beta11'", "versionName '0.11.0-beta12'")
gradle.write_text(g, encoding="utf-8")

print("Generated FRAME Beta 0.11.0 Master Quality Engine")
