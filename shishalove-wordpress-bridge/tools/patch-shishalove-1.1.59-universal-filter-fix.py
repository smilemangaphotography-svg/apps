#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 2:
    raise SystemExit("usage: patch-shishalove-1.1.59-universal-filter-fix.py <plugin-dir>")

root=Path(sys.argv[1])
php=root/"shishalove-app-bridge.php"
js=root/"assets"/"merchant.js"
css=root/"assets"/"bridge.css"
customer=root/"assets"/"customer.js"
for p in (php,js,css,customer):
    if not p.exists():
        raise SystemExit(f"missing {p}")

s=php.read_text(encoding="utf-8")
t=js.read_text(encoding="utf-8")
css_before=css.read_bytes()
customer_before=customer.read_bytes()

def once(text,old,new,label):
    n=text.count(old)
    if n!=1:
        raise SystemExit(f"{label}: expected 1 occurrence, found {n}")
    return text.replace(old,new,1)

if s.count("Version: 1.1.58")!=1 or s.count("define('SLB_VERSION', '1.1.58');")!=1:
    raise SystemExit("expected exact Bridge 1.1.58 baseline")

s=once(s,"Version: 1.1.58","Version: 1.1.59","plugin version")
s=once(s,"define('SLB_VERSION', '1.1.58');","define('SLB_VERSION', '1.1.59');","constant version")
s=once(s,"window.__SLM_AUTHORITATIVE_MERCHANT_UI='bridge-1.1.58';","window.__SLM_AUTHORITATIVE_MERCHANT_UI='bridge-1.1.59';","shell owner marker")

old=r'''            $choices = array(); $seen_terms = array();
            $walk = function($parent_menu_item_id) use (&$walk, &$choices, &$seen_terms, $by_parent) {
                foreach (($by_parent[(int)$parent_menu_item_id] ?? array()) as $child_item) {
                    $resolved = slb_merchant_menu_term_from_item_155($child_item);
                    if ($resolved) {
                        $term = $resolved['term'];
                        $kind = $resolved['kind'];
                        $id = (int) $term->term_id;
                        $key = $kind . ':' . $id;
                        if ($id && !isset($seen_terms[$key]) && slb_normalize((string)$term->name) !== 'uncategorized') {
                            $seen_terms[$key] = true;
                            $choices[] = array(
                                'kind'=>$kind,
                                'taxonomy'=>(string)$resolved['taxonomy'],
                                'id'=>$id,
                                'name'=>html_entity_decode((string)$child_item->title, ENT_QUOTES | ENT_HTML5, 'UTF-8'),
                                'slug'=>(string)$term->slug,
                                'parent'=>$kind === 'category' ? (int)$term->parent : 0,
                                'count'=>(int)$term->count,
                                'menu_item_id'=>(int)$child_item->ID,
                                'menu_parent_id'=>(int)$child_item->menu_item_parent,
                                'menu_order'=>(int)$child_item->menu_order,
                            );
                        }
                    }
                    // Preserve website navigation order across nested groups.
                    $walk((int)$child_item->ID);
                }
            };
            $walk((int)$root_item->ID);
            $by_main[(string)$root_id] = $choices;'''
new=r'''            // Mirror ONLY the direct submenu entries shown immediately under this
            // Main Navigation department. Do not flatten nested taxonomy/menu descendants.
            $choices = array(); $seen_terms = array();
            foreach (($by_parent[(int)$root_item->ID] ?? array()) as $child_item) {
                $resolved = slb_merchant_menu_term_from_item_155($child_item);
                if (!$resolved) { continue; }
                $term = $resolved['term'];
                $kind = $resolved['kind'];
                $id = (int) $term->term_id;
                $key = $kind . ':' . $id;
                if (!$id || isset($seen_terms[$key]) || slb_normalize((string)$term->name) === 'uncategorized') { continue; }
                $seen_terms[$key] = true;
                $choices[] = array(
                    'kind'=>$kind,
                    'taxonomy'=>(string)$resolved['taxonomy'],
                    'id'=>$id,
                    'name'=>html_entity_decode((string)$child_item->title, ENT_QUOTES | ENT_HTML5, 'UTF-8'),
                    'slug'=>(string)$term->slug,
                    'parent'=>$kind === 'category' ? (int)$term->parent : 0,
                    'count'=>(int)$term->count,
                    'menu_item_id'=>(int)$child_item->ID,
                    'menu_parent_id'=>(int)$child_item->menu_item_parent,
                    'menu_order'=>(int)$child_item->menu_order,
                    'exact'=>true,
                );
            }
            $by_main[(string)$root_id] = $choices;'''
s=once(s,old,new,"direct website submenu")
s=once(s,"$cache_key = 'slb_merchant_filter_contexts_155_' . $menu_id;","$cache_key = 'slb_merchant_filter_contexts_159_' . $menu_id;","menu cache generation")
s=once(s,"/** Merchant 1.1.56: mirror the e-shop Main Navigation menu, not raw taxonomy. */","/** Merchant 1.1.59: mirror only the direct e-shop Main Navigation submenu, not raw descendants. */","menu comment")

s=once(
    s,
    """    $category_id = absint($request->get_param('category_id'));
    $brand_id = absint($request->get_param('brand_id'));
    $stock = sanitize_key((string) $request->get_param('stock_status'));""",
    """    $category_id = absint($request->get_param('category_id'));
    $category_exact = rest_sanitize_boolean($request->get_param('category_exact'));
    $brand_id = absint($request->get_param('brand_id'));
    $stock = sanitize_key((string) $request->get_param('stock_status'));""",
    "exact category request param"
)
s=once(
    s,
    "    if ($category_id) { $tax_query[] = array('taxonomy'=>'product_cat','field'=>'term_id','terms'=>array($category_id),'include_children'=>true); }",
    "    if ($category_id) { $tax_query[] = array('taxonomy'=>'product_cat','field'=>'term_id','terms'=>array($category_id),'include_children'=>!$category_exact); }",
    "exact child category query"
)

t=once(t,"CFG.version='1.1.57';","CFG.version='1.1.59';","merchant js version")
t=once(t,"window.__SLM_AUTHORITATIVE_MERCHANT_UI='bridge-1.1.57';","window.__SLM_AUTHORITATIVE_MERCHANT_UI='bridge-1.1.59';","merchant owner marker")
t=once(t,"<div class=\"slb-account-card\">Bridge 1.1.57</div>","<div class=\"slb-account-card\">Bridge '+esc(CFG.version)+'</div>","More version label")

t=once(
    t,
    """  if(state.categoryId)url+='&category_id='+state.categoryId;
  if(state.brandId)url+='&brand_id='+state.brandId;""",
    """  if(state.categoryId)url+='&category_id='+state.categoryId;
  if(state.contextKind==='category'&&state.contextId)url+='&category_exact=1';
  if(state.brandId)url+='&brand_id='+state.brandId;""",
    "exact child category request"
)

t=once(
    t,
    """  return '<main class="slm-page"><div class="slm-head"><div><h1>'+(stock?'Stock':'Products')+'</h1><div class="slm-muted">'+(data?total+' matching products':'Products')+'</div></div>'+(stock?'':'<button class="add" data-act="new-product">+ Add</button>')+'</div><div class="slm-search"><input id="slm-product-search" placeholder="Search product name or SKU" value="'+esc(state.query)+'"><button data-act="search-products">Search</button></div>'+filters+'<section id="slm-product-list">'+(data?productRows(items):ghostRows(6))+'</section>'+pagerMarkup(data)+'</main>';""",
    """  return '<main class="slm-page"><div class="slm-head"><div><h1>'+(stock?'Stock':'Products')+'</h1><div class="slm-muted">'+(data?total+' matching products':'Products')+'</div></div>'+(stock?'':'<button class="add" data-act="new-product">+ Add</button>')+'</div><div class="slm-search"><input id="slm-product-search" placeholder="Search product name or SKU" value="'+esc(state.query)+'"><button data-act="search-products">Search</button></div>'+filters+'<section id="slm-product-list">'+(data?productRows(items):ghostRows(6))+'</section><div id="slm-product-pager">'+pagerMarkup(data)+'</div></main>';""",
    "stable pager container"
)

t=once(
    t,
    """var merchantSearchRequest=0;
function renderKeepingProductSearchFocus(){""",
    """var merchantSearchRequest=0;
function renderProductDataOnly(stock){
  var expected=stock?'stock':'products';
  if(state.view!==expected)return false;
  var list=document.getElementById('slm-product-list'),page=list&&list.closest('.slm-page');
  if(!list||!page)return false;
  var data=currentProductData(stock),items=data&&data.items||[],total=data&&data.total||0;
  var count=page.querySelector('.slm-head .slm-muted');if(count)count.textContent=data?total+' matching products':'Products';
  list.innerHTML=data?productRows(items):ghostRows(6);
  var pager=document.getElementById('slm-product-pager');if(pager)pager.innerHTML=pagerMarkup(data);
  bind();
  return true;
}
function renderProductDataOrFull(stock){if(!renderProductDataOnly(stock))render();}
function renderKeepingProductSearchFocus(){""",
    "stable product partial renderer"
)

t=once(
    t,
    """function renderKeepingProductSearchFocus(){
  var old=document.getElementById('slm-product-search'),focused=!!(old&&document.activeElement===old),pos=old&&typeof old.selectionStart==='number'?old.selectionStart:null;
  render();
  if(focused){""",
    """function renderKeepingProductSearchFocus(){
  var old=document.getElementById('slm-product-search'),focused=!!(old&&document.activeElement===old),pos=old&&typeof old.selectionStart==='number'?old.selectionStart:null;
  if(!renderProductDataOnly(state.view==='stock'))render();
  if(focused){""",
    "search partial renderer"
)

t=once(
    t,
    "  state.productsByView[name]=d;cset(productCacheKey(stock),d);if(state.view===name){render();restoreMerchantScroll(true);}\n}",
    "  state.productsByView[name]=d;cset(productCacheKey(stock),d);if(state.view===name){renderProductDataOrFull(stock);restoreMerchantScroll(true);}\n}",
    "search pool partial update"
)
t=once(
    t,
    "if(cached&&!force){state.productsByView.products=cached;state.productsByView.stock=cached;if(state.view===name){render();restoreMerchantScroll(false);}}",
    "if(cached&&!force){state.productsByView.products=cached;state.productsByView.stock=cached;if(state.view===name){renderProductDataOrFull(stock);restoreMerchantScroll(false);}}",
    "cached product partial update"
)
t=once(
    t,
    "if(key===productCacheKey(stock)&&state.view===name){render();restoreMerchantScroll(true);}return d;",
    "if(key===productCacheKey(stock)&&state.view===name){renderProductDataOrFull(stock);restoreMerchantScroll(true);}return d;",
    "network product partial update"
)
t=once(
    t,
    "if(!state.productsByView[name]&&!cached){state.productsByView[name]={items:[],page:state.page,per_page:state.per,total:0,pages:1,_loadError:true};if(state.view===name){render();restoreMerchantScroll(true);}}else{restoreMerchantScroll(true);}return null;",
    "if(!state.productsByView[name]&&!cached){state.productsByView[name]={items:[],page:state.page,per_page:state.per,total:0,pages:1,_loadError:true};if(state.view===name){renderProductDataOrFull(stock);restoreMerchantScroll(true);}}else{restoreMerchantScroll(true);}return null;",
    "failed product partial update"
)
t=once(
    t,
    """    merchantSyncErrors.bootstrap=null;hydrateViewFromCache(state.view);render();
    if(!startedProducts&&state.view==='products')loadProducts(false,false);""",
    """    merchantSyncErrors.bootstrap=null;hydrateViewFromCache(state.view);
    if((state.view==='products'||state.view==='stock')&&document.getElementById('slm-main-category'))renderProductDataOnly(state.view==='stock');else render();
    if(!startedProducts&&state.view==='products')loadProducts(false,false);""",
    "bootstrap stable filter DOM"
)

php.write_text(s,encoding="utf-8")
js.write_text(t,encoding="utf-8")

if css.read_bytes()!=css_before:
    raise SystemExit("bridge.css unexpectedly changed")
if customer.read_bytes()!=customer_before:
    raise SystemExit("customer.js unexpectedly changed")

required=[
    "Version: 1.1.59",
    "slb_merchant_filter_contexts_159_",
    "'exact'=>true",
    "$category_exact = rest_sanitize_boolean",
    "'include_children'=>!$category_exact",
]
for marker in required:
    if marker not in s:
        raise SystemExit(f"missing PHP marker: {marker}")

for marker in [
    "CFG.version='1.1.59'",
    "bridge-1.1.59",
    "category_exact=1",
    "renderProductDataOnly",
    'id="slm-product-pager"',
]:
    if marker not in t:
        raise SystemExit(f"missing JS marker: {marker}")

print("Bridge 1.1.59 universal filter fix applied")
