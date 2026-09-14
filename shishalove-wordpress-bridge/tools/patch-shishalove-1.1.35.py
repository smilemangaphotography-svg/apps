#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.35.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.34.py'), str(root)])


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one anchor, found {count}')
    return text.replace(old, new, 1)

# Version/cache-bust only; preserve all approved behavior from 1.1.34.
customer_path = root / 'assets' / 'customer.js'
customer = customer_path.read_text(encoding='utf-8')
customer = replace_once(customer, "var BUILD='1.1.34';", "var BUILD='1.1.35';", 'customer build')
customer = replace_once(customer, "CFG.version='1.1.34';", "CFG.version='1.1.35';", 'customer cfg')
customer = replace_once(customer, "slbfix','1.1.34'", "slbfix','1.1.35'", 'customer css bust')

# Product-image resilience: when Woo returns a stale/broken primary URL, retry the
# live Store API image variants instead of leaving Android's broken-image glyph.
repair_anchor = "function toggleFav(id){id=Number(id);var f=favorites(),i=f.indexOf(id);if(i>=0)f.splice(i,1);else f.push(id);setFavorites(f);render();}"
repair_code = repair_anchor + r'''
window.slbRepairProductImage=function(img,id){
  if(!img||img.dataset.slbRepairing==='1'||img.dataset.slbRepaired==='1')return;
  img.dataset.slbRepairing='1';
  fetch('/wp-json/wc/store/v1/products/'+encodeURIComponent(String(id)),{credentials:'same-origin'})
    .then(function(r){if(!r.ok)throw new Error('image '+r.status);return r.json();})
    .then(function(p){
      var im=p&&p.images&&p.images[0]||{},current=img.getAttribute('src')||'',candidates=[];
      if(im.srcset){im.srcset.split(',').forEach(function(part){var u=String(part||'').trim().split(/\s+/)[0];if(u)candidates.unshift(u);});}
      if(im.thumbnail)candidates.push(im.thumbnail);
      if(im.src)candidates.push(im.src);
      var next='';
      for(var i=0;i<candidates.length;i++){if(candidates[i]&&candidates[i]!==current){next=candidates[i];break;}}
      img.dataset.slbRepairing='0';img.dataset.slbRepaired='1';
      if(next)img.src=next;
    })
    .catch(function(){img.dataset.slbRepairing='0';img.dataset.slbRepaired='1';});
};'''
customer = replace_once(customer, repair_anchor, repair_code, 'customer image repair helper')
customer = replace_once(customer,
    '<img data-product="'+"'+p.id+'"+'" src="'+"'+esc(p.image)+'"+'" alt="'+"'+esc(p.name)+'"+'">',
    '<img data-product="'+"'+p.id+'"+'" src="'+"'+esc(p.image)+'"+'" alt="'+"'+esc(p.name)+'"+'" onerror="window.slbRepairProductImage&&window.slbRepairProductImage(this,'+"'+p.id+'"+');">',
    'customer product image recovery')
customer_path.write_text(customer, encoding='utf-8')

merchant_path = root / 'assets' / 'merchant.js'
merchant = merchant_path.read_text(encoding='utf-8')
merchant = replace_once(merchant, "CFG.version='1.1.34';", "CFG.version='1.1.35';", 'merchant cfg')
merchant = replace_once(merchant, "slbfix','1.1.34'", "slbfix','1.1.35'", 'merchant css bust')
merchant = replace_once(merchant, 'Bridge 1.1.34', 'Bridge 1.1.35', 'merchant version label')
merchant_path.write_text(merchant, encoding='utf-8')

css_path = root / 'assets' / 'bridge.css'
css = css_path.read_text(encoding='utf-8')
css += r'''

/* ShishaLove 1.1.35 — final scoped parity corrections only. */

/* Customer: Android's native select reserves more arrow width than Chrome.
   Give the selector enough real width so "Recommended order" is complete. */
body.slb-customer .slb-toolbar{
  grid-template-columns:minmax(0,1fr) 176px!important;
}
body.slb-customer .slb-toolbar select{
  width:176px!important;
  min-width:176px!important;
  max-width:176px!important;
  font-size:13px!important;
  padding-left:8px!important;
  padding-right:18px!important;
  white-space:nowrap!important;
  text-overflow:clip!important;
}

/* Customer: allow the last product row to scroll fully above the fixed nav. */
body.slb-customer .slb-page{
  padding-bottom:calc(112px + var(--safe-bottom))!important;
}
body.slb-customer .slb-product-area,
body.slb-customer .slb-home-feed .slb-section{
  padding-bottom:calc(112px + var(--safe-bottom))!important;
}

/* Merchant browser/iPhone/Android-browser WebView: pin the nav to the actual
   viewport bottom and reserve matching content clearance. Installed Android
   app is excluded because its native wrapper owns the system inset. */
html:not(.slb-android-app) body.slb-merchant .slm-bottom{
  position:fixed!important;
  left:0!important;
  right:0!important;
  top:auto!important;
  bottom:0!important;
  inset:auto 0 0 0!important;
  margin:0!important;
  transform:none!important;
  height:76px!important;
  min-height:76px!important;
  padding:0!important;
  box-sizing:border-box!important;
  background:#fff!important;
}
html:not(.slb-android-app) body.slb-merchant .slm-app{
  padding-bottom:92px!important;
}
html:not(.slb-android-app) body.slb-merchant .slm-page{
  padding-bottom:104px!important;
}
'''
css_path.write_text(css, encoding='utf-8')

print('ShishaLove 1.1.35: selector, customer bottom clearance, image recovery, merchant browser nav anchoring')
