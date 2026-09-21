function slb_prod_beta_product_payload($product) {
    if (!$product) { return null; }
    $image_id = $product->get_image_id();
    $image = $image_id ? wp_get_attachment_image_url($image_id, 'woocommerce_thumbnail') : '';
    $cats = array();
    $terms = get_the_terms($product->get_id(), 'product_cat');
    if ($terms && !is_wp_error($terms)) {
        foreach ($terms as $term) {
            $cats[] = array('id' => (int) $term->term_id, 'name' => (string) $term->name);
        }
    }
    return array(
        'id' => (int) $product->get_id(),
        'name' => (string) $product->get_name(),
        'sku' => (string) $product->get_sku(),
        'image' => $image ?: (function_exists('wc_placeholder_img_src') ? wc_placeholder_img_src('woocommerce_thumbnail') : ''),
        'regular_price' => (string) $product->get_regular_price(),
        'price_html' => html_entity_decode(wp_strip_all_tags($product->get_price_html()), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
        'stock_status' => (string) $product->get_stock_status(),
        'categories' => $cats,
    );
}

function slb_prod_beta_merchant_products($request) {
    if (!function_exists('wc_get_product')) {
        return new WP_Error('woocommerce_unavailable', 'WooCommerce unavailable', array('status' => 503));
    }
    global $wpdb;
    $page = max(1, absint($request->get_param('page')));
    $per = min(50, max(1, absint($request->get_param('per_page') ?: 20)));
    $search = sanitize_text_field((string) $request->get_param('search'));
    $category_id = absint($request->get_param('category_id'));
    $stock = sanitize_key((string) $request->get_param('stock_status'));

    $args = array(
        'post_type' => 'product',
        'post_status' => array('publish','draft','pending','private'),
        'posts_per_page' => $per,
        'paged' => $page,
        'orderby' => 'title',
        'order' => 'ASC',
        'fields' => 'ids',
        'no_found_rows' => false,
    );

    if ($search !== '') {
        $like = '%' . $wpdb->esc_like($search) . '%';
        $title_sku = $wpdb->get_col($wpdb->prepare(
            "SELECT DISTINCT p.ID
             FROM {$wpdb->posts} p
             LEFT JOIN {$wpdb->postmeta} pm ON pm.post_id=p.ID AND pm.meta_key='_sku'
             WHERE p.post_type='product'
               AND p.post_status IN ('publish','draft','pending','private')
               AND (p.post_title LIKE %s OR pm.meta_value LIKE %s)
             LIMIT 1500",
            $like, $like
        ));
        $term_matches = $wpdb->get_col($wpdb->prepare(
            "SELECT DISTINCT tr.object_id
             FROM {$wpdb->terms} t
             INNER JOIN {$wpdb->term_taxonomy} tt ON tt.term_id=t.term_id
             INNER JOIN {$wpdb->term_relationships} tr ON tr.term_taxonomy_id=tt.term_taxonomy_id
             INNER JOIN {$wpdb->posts} p ON p.ID=tr.object_id
             WHERE p.post_type='product'
               AND p.post_status IN ('publish','draft','pending','private')
               AND t.name LIKE %s
             LIMIT 1500",
            $like
        ));
        $ids = array_values(array_unique(array_filter(array_map('absint', array_merge((array) $title_sku, (array) $term_matches)))));
        $args['post__in'] = $ids ? $ids : array(0);
    }

    $tax_query = array();
    if ($category_id) {
        $tax_query[] = array('taxonomy' => 'product_cat', 'field' => 'term_id', 'terms' => array($category_id), 'include_children' => true);
    }
    if ($tax_query) { $args['tax_query'] = $tax_query; }

    if ($stock && in_array($stock, array('instock','outofstock','onbackorder'), true)) {
        $args['meta_query'] = array(array('key' => '_stock_status', 'value' => $stock));
    }

    $q = new WP_Query($args);
    $items = array();
    foreach ((array) $q->posts as $id) {
        $product = wc_get_product($id);
        if ($product) { $items[] = slb_prod_beta_product_payload($product); }
    }
    return array(
        'items' => $items,
        'page' => $page,
        'per_page' => $per,
        'total' => (int) $q->found_posts,
        'pages' => max(1, (int) $q->max_num_pages),
        'server_time' => time(),
    );
}

function slb_prod_beta_merchant_orders($request) {
    if (!function_exists('wc_get_orders')) {
        return new WP_Error('woocommerce_unavailable', 'WooCommerce unavailable', array('status' => 503));
    }
    $page = max(1, absint($request->get_param('page')));
    $per = min(50, max(1, absint($request->get_param('per_page') ?: 20)));
    $result = wc_get_orders(array(
        'limit' => $per,
        'page' => $page,
        'paginate' => true,
        'orderby' => 'date',
        'order' => 'DESC',
        'return' => 'objects',
    ));
    $items = array();
    foreach ((array) $result->orders as $order) {
        $items[] = array(
            'id' => (int) $order->get_id(),
            'number' => (string) $order->get_order_number(),
            'customer' => trim((string) $order->get_formatted_billing_full_name()) ?: 'Customer',
            'status' => (string) $order->get_status(),
            'total' => html_entity_decode(wp_strip_all_tags($order->get_formatted_order_total()), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
            'date' => $order->get_date_created() ? $order->get_date_created()->date_i18n('Y-m-d H:i') : '',
        );
    }
    return array(
        'items' => $items,
        'page' => $page,
        'per_page' => $per,
        'total' => (int) $result->total,
        'pages' => max(1, (int) $result->max_num_pages),
        'server_time' => time(),
    );
}

add_action('rest_api_init', function() {
    register_rest_route('shishalove-production/v1', '/merchant/products', array(
        'methods' => 'GET',
        'permission_callback' => 'slb_merchant_permission',
        'callback' => 'slb_prod_beta_merchant_products',
    ));
    register_rest_route('shishalove-production/v1', '/merchant/orders', array(
        'methods' => 'GET',
        'permission_callback' => 'slb_merchant_permission',
        'callback' => 'slb_prod_beta_merchant_orders',
    ));
});
