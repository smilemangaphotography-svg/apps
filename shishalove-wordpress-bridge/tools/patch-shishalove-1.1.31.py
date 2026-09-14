#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.31.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.30.py'), str(root)])


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one anchor, found {count}')
    return text.replace(old, new, 1)

# -----------------------------------------------------------------------------
# CUSTOMER — preserve product/catalogue caches across Bridge updates so reloads
# paint immediately and refresh in the background. Fix only favorite visibility
# and bottom-label color in CSS below.
# -----------------------------------------------------------------------------
customer_path = root / 'assets' / 'customer.js'
customer = customer_path.read_text(encoding='utf-8')
customer = replace_once(customer, "var BUILD='1.1.30';", "var BUILD='1.1.31';", 'customer build')
customer = replace_once(customer, "CFG.version='1.1.30';", "CFG.version='1.1.31';", 'customer cfg')
customer = replace_once(customer, "slbfix','1.1.30'", "slbfix','1.1.31'", 'customer css bust')
customer = replace_once(
    customer,
    "function vkey(base){return base+'-'+BUILD;}",
    "var DATA_CACHE='stable-v1';\nfunction vkey(base){return base+'-'+DATA_CACHE;}",
    'customer stable data cache'
)
customer = replace_once(
    customer,
    "function cacheGet(key,maxAge){try{var o=JSON.parse(localStorage.getItem(key)||'null');if(o&&o.data&&(!maxAge||Date.now()-o.time<maxAge))return o.data;}catch(e){}return null;}",
    r'''function cacheGet(key,maxAge){
  try{
    var raw=localStorage.getItem(key),o=raw?JSON.parse(raw):null;
    if(o&&o.data&&(!maxAge||Date.now()-o.time<maxAge))return o.data;
    if(!raw&&/-stable-v1$/.test(key)){
      var prefix=key.replace(/stable-v1$/,''),best=null,bestTime=0;
      Object.keys(localStorage).forEach(function(k){
        if(k===key||k.indexOf(prefix)!==0)return;
        try{var c=JSON.parse(localStorage.getItem(k)||'null');if(c&&c.data&&Number(c.time||0)>bestTime){best=c;bestTime=Number(c.time||0);}}catch(e){}
      });
      if(best&&(!maxAge||Date.now()-bestTime<maxAge)){try{localStorage.setItem(key,JSON.stringify(best));}catch(e){}return best.data;}
    }
  }catch(e){}
  return null;
}''',
    'customer cache migration'
)
customer_path.write_text(customer, encoding='utf-8')

# -----------------------------------------------------------------------------
# MERCHANT — same stable data-cache behavior plus stale-while-revalidate Media
# Library. Existing items remain visible during refresh instead of becoming a
# full-page Loading state, and page 1 is prefetched after bootstrap.
# -----------------------------------------------------------------------------
merchant_path = root / 'assets' / 'merchant.js'
merchant = merchant_path.read_text(encoding='utf-8')
merchant = replace_once(merchant, "CFG.version='1.1.30';", "CFG.version='1.1.31';", 'merchant cfg')
merchant = replace_once(merchant, "slbfix','1.1.30'", "slbfix','1.1.31'", 'merchant css bust')
merchant = replace_once(merchant, 'Bridge 1.1.30', 'Bridge 1.1.31', 'merchant version label')
merchant = replace_once(
    merchant,
    "function vkey(base){return base+'-'+String(CFG.version||'bridge');}",
    "var DATA_CACHE='stable-v1';\nfunction vkey(base){return base+'-'+DATA_CACHE;}",
    'merchant stable data cache'
)
merchant = replace_once(
    merchant,
    "function cget(key,max){try{var o=JSON.parse(localStorage.getItem(key)||'null');if(o&&o.data&&(!max||Date.now()-o.time<max))return o.data;}catch(e){}return null;}",
    r'''function cget(key,max){
  try{
    var raw=localStorage.getItem(key),o=raw?JSON.parse(raw):null;
    if(o&&o.data&&(!max||Date.now()-o.time<max))return o.data;
    if(!raw&&/-stable-v1$/.test(key)){
      var prefix=key.replace(/stable-v1$/,''),best=null,bestTime=0;
      Object.keys(localStorage).forEach(function(k){
        if(k===key||k.indexOf(prefix)!==0)return;
        try{var c=JSON.parse(localStorage.getItem(k)||'null');if(c&&c.data&&Number(c.time||0)>bestTime){best=c;bestTime=Number(c.time||0);}}catch(e){}
      });
      if(best&&(!max||Date.now()-bestTime<max)){try{localStorage.setItem(key,JSON.stringify(best));}catch(e){}return best.data;}
    }
  }catch(e){}
  return null;
}''',
    'merchant cache migration'
)
merchant = replace_once(
    merchant,
    "function openMediaLibrary(mode){mediaPicker.open=true;mediaPicker.mode=mode==='gallery'?'gallery':'main';mediaPicker.page=1;mediaPicker.pages=1;mediaPicker.search='';mediaPicker.items=[];mediaPicker.selected={};mediaPicker.loading=true;renderEditorOnly();loadMediaLibrary();}",
    r'''function mediaCacheKey(page,search){return vkey('slm-media-'+Math.max(1,Number(page)||1)+'-'+String(search||'').trim().toLowerCase());}
function applyMediaCache(target,page,search){var d=cget(mediaCacheKey(page,search),10*60*1000);if(!d)return false;target.items=d.items||[];target.pages=Math.max(1,Number(d.pages||1));target.loading=false;return true;}
function openMediaLibrary(mode){mediaPicker.open=true;mediaPicker.mode=mode==='gallery'?'gallery':'main';mediaPicker.page=1;mediaPicker.pages=1;mediaPicker.search='';mediaPicker.items=[];mediaPicker.selected={};mediaPicker.loading=!applyMediaCache(mediaPicker,1,'');renderEditorOnly();loadMediaLibrary();}''',
    'merchant picker cache helpers'
)
merchant = replace_once(
    merchant,
    "function loadMediaLibrary(){if(!mediaPicker.open)return;mediaPicker.loading=true;renderEditorOnly();api('merchant/media?page='+mediaPicker.page+'&per_page=20&search='+encodeURIComponent(mediaPicker.search||'')).then(function(d){if(!mediaPicker.open)return;mediaPicker.items=d.items||[];mediaPicker.pages=Math.max(1,Number(d.pages||1));if(mediaPicker.page>mediaPicker.pages)mediaPicker.page=mediaPicker.pages;mediaPicker.loading=false;renderEditorOnly();}).catch(function(){mediaPicker.loading=false;mediaPicker.items=[];renderEditorOnly();});}",
    r'''function loadMediaLibrary(){if(!mediaPicker.open)return;var key=mediaCacheKey(mediaPicker.page,mediaPicker.search);var had=mediaPicker.items&&mediaPicker.items.length;if(!had)had=applyMediaCache(mediaPicker,mediaPicker.page,mediaPicker.search);mediaPicker.loading=!had;if(!had)renderEditorOnly();api('merchant/media?page='+mediaPicker.page+'&per_page=20&search='+encodeURIComponent(mediaPicker.search||'')).then(function(d){if(!mediaPicker.open)return;mediaPicker.items=d.items||[];mediaPicker.pages=Math.max(1,Number(d.pages||1));if(mediaPicker.page>mediaPicker.pages)mediaPicker.page=mediaPicker.pages;mediaPicker.loading=false;cset(key,d);renderEditorOnly();}).catch(function(){mediaPicker.loading=false;if(!had)mediaPicker.items=[];renderEditorOnly();});}''',
    'merchant picker stale while revalidate'
)
merchant = replace_once(
    merchant,
    "function loadMediaManager(force){if(state.view!=='media-library')return;if(mediaManager.loading&&!force)return;mediaManager.loading=true;render();api('merchant/media?page='+mediaManager.page+'&per_page=20&search='+encodeURIComponent(mediaManager.search||'')).then(function(d){if(state.view!=='media-library')return;mediaManager.items=d.items||[];mediaManager.pages=Math.max(1,Number(d.pages||1));if(mediaManager.page>mediaManager.pages)mediaManager.page=mediaManager.pages;mediaManager.loading=false;render();}).catch(function(){mediaManager.loading=false;mediaManager.items=[];render();});}",
    r'''function hydrateMediaManagerCache(){return applyMediaCache(mediaManager,mediaManager.page,mediaManager.search);}
function loadMediaManager(force){if(state.view!=='media-library')return;if(mediaManager.loading&&!force)return;var key=mediaCacheKey(mediaManager.page,mediaManager.search),had=mediaManager.items&&mediaManager.items.length;if(!had)had=hydrateMediaManagerCache();mediaManager.loading=!had;if(!had)render();api('merchant/media?page='+mediaManager.page+'&per_page=20&search='+encodeURIComponent(mediaManager.search||'')).then(function(d){if(state.view!=='media-library')return;mediaManager.items=d.items||[];mediaManager.pages=Math.max(1,Number(d.pages||1));if(mediaManager.page>mediaManager.pages)mediaManager.page=mediaManager.pages;mediaManager.loading=false;cset(key,d);render();}).catch(function(){mediaManager.loading=false;if(!had)mediaManager.items=[];render();});}
function prefetchMediaManager(){var key=mediaCacheKey(1,''),cached=cget(key,10*60*1000);if(cached)return;api('merchant/media?page=1&per_page=20&search=').then(function(d){cset(key,d);}).catch(function(){});}''',
    'merchant manager stale while revalidate'
)
merchant = replace_once(
    merchant,
    "function navigate(view){state.menuOpen=false;var changed=view!==state.view;if(changed&&(view==='products'||view==='stock')){state.query='';state.categoryId=0;state.stockStatus='all';state.searchPools[view]=null;}state.view=view;state.page=1;hydrateViewFromCache(view);render();if(view==='products')loadProducts(false,false);if(view==='stock')loadProducts(true,false);if(view==='orders')loadOrders(false);if(view==='media-library')loadMediaManager(false);}",
    r'''function navigate(view){state.menuOpen=false;var changed=view!==state.view;if(changed&&(view==='products'||view==='stock')){state.query='';state.categoryId=0;state.stockStatus='all';state.searchPools[view]=null;}state.view=view;state.page=1;hydrateViewFromCache(view);if(view==='media-library'){mediaManager.page=1;mediaManager.search='';hydrateMediaManagerCache();}render();if(view==='products')loadProducts(false,false);if(view==='stock')loadProducts(true,false);if(view==='orders')loadOrders(false);if(view==='media-library')loadMediaManager(false);}''',
    'merchant navigate media hydrate'
)
merchant = replace_once(
    merchant,
    "function bootstrap(force){var key=vkey('slm-bootstrap'),cached=cget(key,60*60*1000);if(cached&&!force){state.bootstrap=cached;CFG.restNonce=cached.nonce||CFG.restNonce;hydrateViewFromCache('products');render();loadProducts(false,false);}api('merchant/bootstrap').then(function(d){state.bootstrap=d;cset(key,d);CFG.restNonce=d.nonce||CFG.restNonce;hydrateViewFromCache(state.view);render();if(state.view==='products')loadProducts(false,false);else if(state.view==='stock')loadProducts(true,false);else if(state.view==='orders')loadOrders(false);}).catch(function(){if(!state.bootstrap)render();});}",
    r'''function bootstrap(force){var key=vkey('slm-bootstrap'),cached=cget(key,60*60*1000);if(cached&&!force){state.bootstrap=cached;CFG.restNonce=cached.nonce||CFG.restNonce;hydrateViewFromCache('products');render();loadProducts(false,false);setTimeout(prefetchMediaManager,0);}api('merchant/bootstrap').then(function(d){state.bootstrap=d;cset(key,d);CFG.restNonce=d.nonce||CFG.restNonce;hydrateViewFromCache(state.view);render();if(state.view==='products')loadProducts(false,false);else if(state.view==='stock')loadProducts(true,false);else if(state.view==='orders')loadOrders(false);setTimeout(prefetchMediaManager,0);}).catch(function(){if(!state.bootstrap)render();});}''',
    'merchant bootstrap media prefetch'
)
merchant_path.write_text(merchant, encoding='utf-8')

# -----------------------------------------------------------------------------
# CSS — only the two requested Customer visual fixes. The image became positioned
# in 1.1.29, so the favorite button needs an explicit stacking level to stop the
# product image from painting over the left half of the heart.
# -----------------------------------------------------------------------------
css_path = root / 'assets' / 'bridge.css'
css = css_path.read_text(encoding='utf-8')
css += r'''

/* ShishaLove 1.1.31 — scoped reload/favorite/nav corrections only */
body.slb-customer .slb-heart{
  z-index:4!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  width:42px!important;
  height:42px!important;
  padding:0!important;
  overflow:visible!important;
  font-family:Arial,"Segoe UI Symbol",sans-serif!important;
  font-size:31px!important;
  line-height:1!important;
}
body.slb-customer .slb-bottom .slb-bottom-label,
body.slb-customer .slb-bottom button.active .slb-bottom-label{
  color:#000!important;
  -webkit-text-fill-color:#000!important;
  opacity:1!important;
  filter:none!important;
}
'''
css_path.write_text(css, encoding='utf-8')

print('ShishaLove 1.1.31: instant stale-while-revalidate cache, full favorite hearts, black Customer bottom labels')
