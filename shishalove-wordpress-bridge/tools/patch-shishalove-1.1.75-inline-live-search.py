#!/usr/bin/env python3
from pathlib import Path
import hashlib,sys

if len(sys.argv)!=2:
    raise SystemExit("usage: patch-shishalove-1.1.75-inline-live-search.py <plugin-dir>")

root=Path(sys.argv[1])
php=root/"shishalove-app-bridge.php"
js=root/"assets"/"merchant.js"
css=root/"assets"/"bridge.css"
customer=root/"assets"/"customer.js"

expected={
    php:"3ccb53d67e501592515b31e7e35b76eb6060b75a214cc9ced9583764c32be27a",
    js:"218810b39b0333c5ba19d6ad68bf29e8de7dc30f241c948d2fd84c44d8949bc4",
    css:"94d50a8af491d500ac080333d582c60d1cd17815160002c3bb6ebb45c18d8303",
    customer:"bc3d794decaae688ae97ae3a19ff520b9fc71cefa8c332f8aab0d7372818b5d4",
}
for path,sha in expected.items():
    if hashlib.sha256(path.read_bytes()).hexdigest()!=sha:
        raise SystemExit("unexpected 1.1.74 baseline: "+str(path))

p=php.read_text(encoding="utf-8")
m=js.read_text(encoding="utf-8")
c=css.read_text(encoding="utf-8")

p=p.replace("Version: 1.1.74","Version: 1.1.75",1)
p=p.replace("define('SLB_VERSION', '1.1.74');","define('SLB_VERSION', '1.1.75');",1)

seg='<input id="slm-visual-gallery" class="slm-visual-file" type="file" accept="image/*" aria-hidden="true" tabindex="-1"></div><div id="slm-live-suggestions" class="slm-live-suggestions" hidden></div></div>\\'+filters'
rep='<input id="slm-visual-gallery" class="slm-visual-file" type="file" accept="image/*" aria-hidden="true" tabindex="-1"></div></div>\\'+filters'
if seg not in m: raise SystemExit("search overlay host not found")
m=m.replace(seg,rep,1)

start=m.index("function liveScore(it,q){")
end=m.index("function liveProductShape",start)
new_score="""function liveAccessoryPenalty(title,nq){var accessory=['addon','kit','mat','bag','case','hose','mouthpiece','adapter','grommet','seal','brush','tray','tongs','base protector','spare','replacement'];var queryAccessory=accessory.some(function(w){return nq.indexOf(w)>=0;});if(queryAccessory)return 0;for(var i=0;i<accessory.length;i++){if(title.indexOf(accessory[i])>=0)return 55000000;}return 0;}
function liveSequentialPrefixMatch(title,nq){var tw=title.split(' ').filter(Boolean),qw=nq.split(' ').filter(Boolean);if(!qw.length||qw.length>tw.length)return false;for(var i=0;i<=tw.length-qw.length;i++){var ok=true;for(var j=0;j<qw.length;j++){if(tw[i+j].indexOf(qw[j])!==0){ok=false;break;}}if(ok)return true;}return false;}
function liveScore(it,q){var nq=liveNorm(q);if(!nq)return 0;var title=liveNorm(it.name),brand=liveNorm(it.brand),cats=liveNorm((it.categories||[]).join(' ')),sku=liveNorm(it.sku),vskus=(it.variation_skus||[]).map(liveNorm),penalty=liveAccessoryPenalty(title,nq),base=0;if((sku&&sku===nq)||vskus.indexOf(nq)>=0)return 1000000000;if(title===nq)return 900000000;if(title.indexOf(nq)===0)base=800000000-nq.length;else if(brand&&brand.indexOf(nq)===0)base=700000000-nq.length;else if(liveSequentialPrefixMatch(title,nq))base=650000000-nq.length;else{var words=title.split(' ');if(words.some(function(w){return w.indexOf(nq)===0;}))base=600000000-nq.length;else if(cats.split(' ').some(function(w){return w&&w.indexOf(nq)===0;}))base=500000000-nq.length;else{var hay=[title,brand,cats,sku].concat(vskus).join(' '),pos=hay.indexOf(nq);if(pos>=0)base=400000000-Math.min(9999,pos);else if(nq.length>=3){var target=words.concat(brand.split(' '));var best=3;for(var i=0;i<target.length;i++){var w=target[i];if(!w)continue;var d=liveEditDistance(nq,w,2);if(d<best)best=d;}if(best<=2)base=300000000-best*1000000;}}}return base>0?Math.max(1,base-penalty):0;}
"""
m=m[:start]+new_score+m[end:]

start=m.index("function hideLiveSuggestions(){")
end=m.index("function restoreFilteredProductsAfterClear",start)
m=m[:start]+"function hideLiveSuggestions(){}\n"+m[end:]

needle="applySearchPool(state.view==='stock');renderLiveSuggestions(ranked);recordLiveMetric(trimmed,performance.now()-(started||performance.now()));"
if needle not in m: raise SystemExit("suggestion render call not found")
m=m.replace(needle,"applySearchPool(state.view==='stock');recordLiveMetric(trimmed,performance.now()-(started||performance.now()));",1)

old="""  s.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();clearTimeout(liveCatalog.timer);runLiveTextSearch(this.value,performance.now());}else if(e.key==='Escape'){hideLiveSuggestions();}};
  s.onsearch=function(){clearTimeout(liveCatalog.timer);runLiveTextSearch(this.value,performance.now());};
  s.onfocus=function(){var q=String(this.value||'').trim();if(q&&liveCatalog.ready)renderLiveSuggestions(liveSearchMatches(q));};
  s.onblur=function(){setTimeout(hideLiveSuggestions,140);};
"""
new="""  s.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();clearTimeout(liveCatalog.timer);runLiveTextSearch(this.value,performance.now());}};
  s.onsearch=function(){clearTimeout(liveCatalog.timer);runLiveTextSearch(this.value,performance.now());};
"""
if old not in m: raise SystemExit("live search event block not found")
m=m.replace(old,new,1)

c=''.join(line for line in c.splitlines(True) if '.slm-live-suggestions' not in line and '.slm-live-suggest' not in line)

php.write_text(p,encoding="utf-8")
js.write_text(m,encoding="utf-8")
css.write_text(c,encoding="utf-8")

if hashlib.sha256(customer.read_bytes()).hexdigest()!=expected[customer]:
    raise SystemExit("customer runtime changed")
if "slm-live-suggestions" in m or "renderLiveSuggestions" in m or "slm-live-suggestions" in c:
    raise SystemExit("floating overlay code remains")
for token in ("Version: 1.1.75","scheduleLiveTextSearch","liveSequentialPrefixMatch","liveAccessoryPenalty","slb_visual_search_160","SLBF32","wp_tempnam"):
    if token not in p+m+c:
        raise SystemExit("missing required token: "+token)

print("Bridge 1.1.75 inline live search applied")
