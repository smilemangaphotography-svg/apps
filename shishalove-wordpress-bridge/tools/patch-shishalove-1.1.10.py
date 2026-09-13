#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.10.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent
repo_root = tools.parent.parent

# Carry forward the complete 1.1.9 runtime and then apply owner-approved 1.1.10 fixes.
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.9.py'), str(root)])

js_path = root / 'assets' / 'customer.js'
merchant_path = root / 'assets' / 'merchant.js'
css_path = root / 'assets' / 'bridge.css'
php_path = root / 'shishalove-app-bridge.php'

js = js_path.read_text(encoding='utf-8')
merchant = merchant_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')
php = php_path.read_text(encoding='utf-8')


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'1.1.10 patch failed: {label}')
    return text.replace(old, new, 1)


def sub_once(text, pattern, repl, label):
    out, count = re.subn(pattern, repl, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f'1.1.10 patch failed: {label} ({count})')
    return out


def branding_data(prefix):
    parts = sorted((repo_root / 'shishalove-branding').glob(prefix + '.b64.part*'))
    if not parts:
        raise SystemExit(f'1.1.10 patch failed: missing {prefix} branding')
    encoded = ''.join(p.read_text(encoding='utf-8').strip() for p in parts)
    return 'data:image/png;base64,' + encoded

customer_drawer_logo = branding_data('customer-icon')
merchant_brand_logo = branding_data('merchant-icon')

# New cache namespace.
js = replace_once(js, "var BUILD='1.1.9';", "var BUILD='1.1.10';", 'customer build key')

# State: independent brand paging and Search sorting.
js = replace_once(
    js,
    "  searchPage:1,\n  searchPages:1,",
    "  searchPage:1,\n  searchPages:1,\n  searchSort:'date-desc',\n  brandPage:1,\n  brandPer:12,",
    'customer state extensions'
)

# Drawer uses the approved red-heart / white-mark customer artwork on black.
js = replace_once(
    js,
    "var CFG=window.SHISHALOVE_BRIDGE||{};",
    "var CFG=window.SHISHALOVE_BRIDGE||{};\nvar CUSTOMER_DRAWER_LOGO=" + repr(customer_drawer_logo) + ";",
    'customer drawer logo data'
)
js = replace_once(
    js,
    "<div class=\"slb-drawer-logo\">'+logo()+'</div>",
    "<div class=\"slb-drawer-logo\"><img class=\"slb-drawer-owner-logo\" src=\"'+esc(CUSTOMER_DRAWER_LOGO)+'\" alt=\"ShishaLove\"></div>",
    'customer drawer logo markup'
)

# Recommended = actual customer purchases (WooCommerce total_sales), not generic menu order.
js = replace_once(js, "  return ['popularity','DESC'];", "  return ['purchases','DESC'];", 'purchase-ranked recommended feed')

# Brand pager for complete live Hookah brand/subcategory list.
js = replace_once(
    js,
    "function pagerMarkup(page,pages){\n  page=Math.max(1,Number(page||1));pages=Math.max(1,Number(pages||1));\n  if(pages<=1)return '';\n  return '<div class=\"slb-pager\"><button data-page=\"'+(page-1)+'\"'+(page<=1?' disabled':'')+'>← Previous</button><strong>Page '+page+' / '+pages+'</strong><button data-page=\"'+(page+1)+'\"'+(page>=pages?' disabled':'')+'>Next →</button></div>';\n}",
    "function pagerMarkup(page,pages){\n  page=Math.max(1,Number(page||1));pages=Math.max(1,Number(pages||1));\n  if(pages<=1)return '';\n  return '<div class=\"slb-pager\"><button data-page=\"'+(page-1)+'\"'+(page<=1?' disabled':'')+'>← Previous</button><strong>Page '+page+' / '+pages+'</strong><button data-page=\"'+(page+1)+'\"'+(page>=pages?' disabled':'')+'>Next →</button></div>';\n}\nfunction brandPagerMarkup(page,pages){\n  page=Math.max(1,Number(page||1));pages=Math.max(1,Number(pages||1));\n  if(pages<=1)return '';\n  return '<div class=\"slb-brand-pager\"><button data-brand-page=\"'+(page-1)+'\"'+(page<=1?' disabled':'')+'>← Previous brands</button><strong>Brands '+page+' / '+pages+'</strong><button data-brand-page=\"'+(page+1)+'\"'+(page>=pages?' disabled':'')+'>Next brands →</button></div>';\n}",
    'brand pager helper'
)
js = replace_once(
    js,
    "  var top=isTopCategory(cat),subs=top?collectionFor(cat):[];",
    "  var top=isTopCategory(cat),subs=top?collectionFor(cat):[];\n  var brandPages=Math.max(1,Math.ceil(subs.length/state.brandPer));\n  if(state.brandPage>brandPages)state.brandPage=brandPages;\n  var brandStart=(state.brandPage-1)*state.brandPer,visibleSubs=subs.slice(brandStart,brandStart+state.brandPer);",
    'category brand pagination state'
)
js = replace_once(
    js,
    "    (subs.length?'<div class=\"slb-subgrid\" id=\"slb-subgrid\">'+subs.map(categoryCard).join('')+'</div>':'')+",
    "    (subs.length?'<div class=\"slb-subgrid\" id=\"slb-subgrid\">'+visibleSubs.map(categoryCard).join('')+'</div>'+brandPagerMarkup(state.brandPage,brandPages):'')+",
    'category visible brand page'
)
js = replace_once(
    js,
    "  state.category=cat;state.product=null;state.view='category';state.page=1;state.pages=1;state.sort='date-desc';state.per=30;",
    "  state.category=cat;state.product=null;state.view='category';state.page=1;state.pages=1;state.brandPage=1;state.sort='date-desc';state.per=30;",
    'reset brand page on category open'
)
js = replace_once(
    js,
    "  root.querySelectorAll('[data-act=\"see-all-brands\"]').forEach(function(e){e.onclick=function(){var g=document.getElementById('slb-subgrid');if(g)g.scrollIntoView({behavior:'smooth',block:'start'});};});",
    "  root.querySelectorAll('[data-act=\"see-all-brands\"]').forEach(function(e){e.onclick=function(){state.brandPage=1;render();setTimeout(function(){var g=document.getElementById('slb-subgrid');if(g)g.scrollIntoView({behavior:'smooth',block:'start'});},0);};});\n  root.querySelectorAll('[data-brand-page]').forEach(function(e){e.onclick=function(){if(this.disabled)return;state.brandPage=Math.max(1,Number(this.dataset.brandPage||1));render();setTimeout(function(){var g=document.getElementById('slb-subgrid');if(g)g.scrollIntoView({behavior:'smooth',block:'start'});},0);};});",
    'brand pager binding'
)

# Search sort controls: Newest / Low→High / High→Low / A–Z.
search_view_pattern = r'''function searchView\(\)\{.*?\n\}\nfunction searchRequest\(q\)\{.*?\n\}'''
search_view_repl = r'''function searchView(){
  return appShell('<main class="slb-page slb-search-page"><h1 style="font-size:32px;margin:0 0 18px">Search</h1><div class="slb-search-box"><input id="slb-search" placeholder="Search by product or category…" value="'+esc(state.search)+'"><button data-act="search-go">Search</button></div><div class="slb-search-sort"><span>Sort results</span><select id="slb-search-sort"><option value="date-desc"'+(state.searchSort==='date-desc'?' selected':'')+'>Newest</option><option value="price-asc"'+(state.searchSort==='price-asc'?' selected':'')+'>Price: Low to High</option><option value="price-desc"'+(state.searchSort==='price-desc'?' selected':'')+'>Price: High to Low</option><option value="title-asc"'+(state.searchSort==='title-asc'?' selected':'')+'>A–Z</option></select></div><div id="slb-search-results" class="slb-search-results"></div><div id="slb-search-pager"></div></main>','search');
}
function searchOrder(){
  if(state.searchSort==='price-asc')return ['price','ASC'];
  if(state.searchSort==='price-desc')return ['price','DESC'];
  if(state.searchSort==='title-asc')return ['title','ASC'];
  return ['date','DESC'];
}
function searchRequest(q){
  var cat=categoryMatch(q),o=searchOrder();
  if(cat)return api('customer/products?category_id='+encodeURIComponent(cat.id)+'&page='+state.searchPage+'&per_page=30&stock_status=instock&orderby='+encodeURIComponent(o[0])+'&order='+encodeURIComponent(o[1]));
  return api('customer/products?search='+encodeURIComponent(q)+'&page='+state.searchPage+'&per_page=30&stock_status=instock&orderby='+encodeURIComponent(o[0])+'&order='+encodeURIComponent(o[1]));
}'''
js = sub_once(js, search_view_pattern, search_view_repl, 'search sort view/request')
js = replace_once(js, "var key=productKey(null,state.searchPage,'date',30,state.search)", "var key=productKey(null,state.searchPage,state.searchSort,30,state.search)", 'search cache key')
js = replace_once(
    js,
    "    d.items=(d.items||[]).filter(function(x){return x.stock_status==='instock';});cacheSet(key,d);state.searchPages=Math.max(1,Number(d.pages||1));",
    "    d.items=(d.items||[]).filter(function(x){return x.stock_status==='instock';});\n    if(state.searchSort==='price-asc'||state.searchSort==='price-desc'){d.items.sort(function(a,b){var av=numericProductPrice(a),bv=numericProductPrice(b);return state.searchSort==='price-asc'?av-bv:bv-av;});}\n    else if(state.searchSort==='title-asc'){d.items.sort(function(a,b){return String(a.name||'').localeCompare(String(b.name||''));});}\n    cacheSet(key,d);state.searchPages=Math.max(1,Number(d.pages||1));",
    'defensive search sorting'
)
js = replace_once(
    js,
    "  if(state.view==='search'&&state.search){u.searchParams.set('q',state.search);u.searchParams.set('page',state.searchPage);}",
    "  if(state.view==='search'&&state.search){u.searchParams.set('q',state.search);u.searchParams.set('page',state.searchPage);if(state.searchSort!=='date-desc')u.searchParams.set('searchSort',state.searchSort);}",
    'search route URL sort'
)
js = replace_once(
    js,
    "q:state.search,searchPage:state.searchPage,feed:state.homeFilter",
    "q:state.search,searchPage:state.searchPage,searchSort:state.searchSort,feed:state.homeFilter",
    'search route state sort'
)
js = replace_once(
    js,
    "if(view==='search'){state.searchPage=1;}",
    "if(view==='search'){state.searchPage=1;state.searchSort='date-desc';}",
    'search navigation reset'
)
js = replace_once(
    js,
    "state.search=p.get('q')||'';state.searchPage=Math.max(1,Number(p.get('page')||1));",
    "state.search=p.get('q')||'';state.searchPage=Math.max(1,Number(p.get('page')||1));state.searchSort=p.get('searchSort')||'date-desc';",
    'search route restore sort'
)
js = replace_once(
    js,
    "  var sort=document.getElementById('slb-sort');if(sort)sort.onchange=function(){state.sort=this.value;state.page=1;routeWrite(true);render();};",
    "  var searchSort=document.getElementById('slb-search-sort');if(searchSort)searchSort.onchange=function(){state.searchSort=this.value;state.searchPage=1;routeWrite(true);doSearch(true);};\n  var sort=document.getElementById('slb-sort');if(sort)sort.onchange=function(){state.sort=this.value;state.page=1;routeWrite(true);render();};",
    'search sort binding'
)

# PHP: expose every live direct child brand/subcategory under Hookah and rank Recommended by purchases.
collection_all = r'''
function slb_collection_all($root_label) {
    $root = slb_find_term($root_label);
    if (!$root) { return array(); }
    $rows = get_terms(array(
        'taxonomy' => 'product_cat',
        'hide_empty' => true,
        'parent' => (int) $root->term_id,
        'orderby' => 'name',
        'order' => 'ASC',
        'number' => 0,
    ));
    if (is_wp_error($rows)) { return array(); }
    $out = array();
    foreach ($rows as $term) { $out[] = slb_term_payload($term); }
    return $out;
}

'''
php = replace_once(php, "function slb_customer_bootstrap_data() {", collection_all + "function slb_customer_bootstrap_data() {", 'all child categories helper')
php = replace_once(
    php,
    "'hookah' => slb_collection('Hookah', array('Wookah','Alpha','Steamulation','Union','MIG','El-Badia','Moze','Anima','Gold Miner','YKAP','Mexanika','DIAVLA'), 18),",
    "'hookah' => slb_collection_all('Hookah'),",
    'all Hookah brands'
)
php = replace_once(php, "        'price_value' => (float) $product->get_price(),", "        'price_value' => (float) $product->get_price(),\n        'purchase_count' => (int) $product->get_total_sales(),", 'purchase count payload')
php = replace_once(
    php,
    "$allowed_orderby = array('date','title','menu_order','modified','price','popularity');",
    "$allowed_orderby = array('date','title','menu_order','modified','price','popularity','purchases');",
    'purchase orderby allowlist'
)
php = replace_once(
    php,
    "elseif ($orderby === 'popularity') { $query_orderby = 'meta_value_num'; $meta_key = 'total_sales'; }",
    "elseif ($orderby === 'popularity' || $orderby === 'purchases') { $query_orderby = 'meta_value_num'; $meta_key = 'total_sales'; }",
    'purchase ordering implementation'
)

# Merchant header/login use the same locked white ShishaLove + red heart + red MERCHANT artwork as launcher.
merchant = replace_once(
    merchant,
    "var CFG=window.SHISHALOVE_BRIDGE||{};",
    "var CFG=window.SHISHALOVE_BRIDGE||{};\nvar MERCHANT_BRAND_LOGO=" + repr(merchant_brand_logo) + ";",
    'merchant logo data'
)
merchant = replace_once(
    merchant,
    "function normalizeBrandLockups()",
    "function merchantOwnerLogo(){return '<img class=\"slm-owner-logo\" src=\"'+esc(MERCHANT_BRAND_LOGO)+'\" alt=\"ShishaLove Merchant\">';}\nfunction normalizeBrandLockups()",
    'merchant owner logo helper'
)
merchant = sub_once(
    merchant,
    r'''function top\(\)\{.*?\n\}''',
    "function top(){return '<header class=\"slm-top\"><button data-act=\"menu\">☰</button><div class=\"slm-brand slm-brand-owner\">'+merchantOwnerLogo()+'</div><button data-act=\"refresh\">↻</button></header>';}\n",
    'merchant header branding'
)
merchant = sub_once(
    merchant,
    r'''function login\(\)\{.*?\n\}''',
    "function login(){return '<div class=\"slm-login\"><div class=\"slm-login-card\"><div class=\"slm-login-brand slm-login-owner\">'+merchantOwnerLogo()+'</div><h1>Store control<br>from your phone.</h1><p>Sign in with an authorized WordPress account to manage WooCommerce.</p><a href=\"'+esc(CFG.loginUrl)+'\">SIGN IN WITH WORDPRESS</a><div class=\"slm-footer-note\">Secure WordPress session · no separate product database</div></div></div>';}\n",
    'merchant login branding'
)

css += r'''

/* ShishaLove 1.1.10 owner lock */
.slb-drawer-logo .slb-drawer-owner-logo{display:block;width:224px;height:96px;max-width:68vw;object-fit:contain;object-position:left center;filter:none!important;border-radius:18px}
.slb-brand-pager{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;padding:10px 24px 16px}
.slb-brand-pager button{min-height:44px;border:1px solid #ddd;background:#fff;font-weight:800;padding:0 10px}.slb-brand-pager button:disabled{opacity:.35}.slb-brand-pager strong{font-size:13px;text-align:center;white-space:nowrap}
.slb-search-sort{display:grid;grid-template-columns:1fr minmax(190px,52%);gap:12px;align-items:center;margin:14px 0 4px}.slb-search-sort span{font-size:14px;color:#777;font-weight:700}.slb-search-sort select{height:46px;border:1px solid #ddd;background:#fff;padding:0 12px}
.slm-brand-owner{height:72px}.slm-brand-owner .slm-owner-logo{display:block;width:164px;height:68px;object-fit:contain;border-radius:15px}.slm-login-owner .slm-owner-logo{display:block;width:210px;height:210px;object-fit:contain;margin:0 auto 8px;border-radius:28px}
@media(max-width:390px){.slb-brand-pager{grid-template-columns:1fr 1fr}.slb-brand-pager strong{grid-column:1/-1;grid-row:1}.slb-brand-pager button{grid-row:2}.slb-search-sort{grid-template-columns:1fr minmax(174px,58%)}}
'''

js_path.write_text(js, encoding='utf-8')
merchant_path.write_text(merchant, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
php_path.write_text(php, encoding='utf-8')
print('ShishaLove 1.1.10 owner-requested bridge patch applied')
