#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.24-fast.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.24.py'), str(root)])


def replace_between(text, start, end, replacement):
    s = text.index(start)
    e = text.index(end, s)
    return text[:s] + replacement.rstrip() + '\n' + text[e:]

# Customer category lists: use the Woo Store API first (already used by the
# approved price-sort path), with the canonical Bridge endpoint as fallback.
# This removes the heavyweight full-product payload from first brand open.
customer_path = root / 'assets' / 'customer.js'
customer = customer_path.read_text(encoding='utf-8')
fast_request = r'''function categoryRequest(cat){
  var orderby=state.sort==='price-asc'||state.sort==='price-desc'?'price':state.sort==='title-asc'?'title':'date';
  var order=state.sort==='price-desc'?'desc':state.sort==='date-desc'?'desc':'asc';
  return storeApi({category:cat.id,page:state.page,per_page:state.per,stock_status:['instock'],orderby:orderby,order:order}).catch(function(){
    var bridgeOrderby=state.sort==='title-asc'?'title':'date';
    var bridgeOrder=state.sort==='title-asc'?'ASC':'DESC';
    return api('customer/products?category_id='+encodeURIComponent(cat.id)+'&page='+state.page+'&per_page='+state.per+'&stock_status=instock&orderby='+bridgeOrderby+'&order='+bridgeOrder);
  });
}'''
customer = replace_between(customer, 'function categoryRequest(cat){', 'var categoryPending={};', fast_request)
customer_path.write_text(customer, encoding='utf-8')

# Bridge list endpoint: do not build gallery/categories/descriptions for every row.
# Product detail endpoint stays unchanged and still returns full editor data.
main_path = root / 'shishalove-app-bridge.php'
main = main_path.read_text(encoding='utf-8')
marker = 'function slb_query_products($request, $merchant = false) {'
if marker not in main:
    raise SystemExit('slb_query_products marker missing')
light = r'''function slb_product_list_payload($product, $merchant = false) {
    if (!$product) { return null; }
    $image_id = $product->get_image_id();
    $image = $image_id ? wp_get_attachment_image_url($image_id, 'woocommerce_thumbnail') : '';
    $row = array(
        'id' => (int) $product->get_id(),
        'name' => $product->get_name(),
        'image' => $image ?: wc_placeholder_img_src('woocommerce_thumbnail'),
        'price' => $product->get_price(),
        'regular_price' => $product->get_regular_price(),
        'sale_price' => $product->get_sale_price(),
        'price_html' => html_entity_decode(wp_strip_all_tags($product->get_price_html()), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
        'stock_status' => $product->get_stock_status(),
    );
    if ($merchant) {
        $row['sku'] = $product->get_sku();
        $row['status'] = $product->get_status();
        $row['permalink'] = $product->get_permalink();
    }
    return $row;
}

'''
if 'function slb_product_list_payload(' not in main:
    main = main.replace(marker, light + marker, 1)
old = "if ($p) { $items[] = slb_product_payload($p); }"
if old not in main:
    raise SystemExit('product list payload call marker missing')
main = main.replace(old, "if ($p) { $items[] = slb_product_list_payload($p, $merchant); }", 1)
main_path.write_text(main, encoding='utf-8')

print('ShishaLove 1.1.24 FAST: Customer brand lists use Store API first; Bridge list payload is lightweight for Customer and Merchant reloads')
