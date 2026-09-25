#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.71-visual-search-diagnostics.py <plugin-dir>')

root=Path(sys.argv[1])
php=root/'shishalove-app-bridge.php'
js=root/'assets'/'merchant.js'
css=root/'assets'/'bridge.css'
customer=root/'assets'/'customer.js'
for f in (php,js,css,customer):
    if not f.exists(): raise SystemExit(f'missing {f}')

p=php.read_text(encoding='utf-8')
js0=js.read_bytes(); css0=css.read_bytes(); customer0=customer.read_bytes()

def one(text,old,new,label):
    n=text.count(old)
    if n != 1: raise SystemExit(f'{label}: expected 1 occurrence, found {n}')
    return text.replace(old,new,1)

if p.count('Version: 1.1.70') != 1 or p.count("define('SLB_VERSION', '1.1.70');") != 1:
    raise SystemExit('expected exact Bridge 1.1.70 baseline')
p=one(p,'Version: 1.1.70','Version: 1.1.71','plugin version')
p=one(p,"define('SLB_VERSION', '1.1.70');","define('SLB_VERSION', '1.1.71');",'version constant')

provider_marker='function slb_visual_voyage_embed_160($inputs,$input_type) {'
helpers=r'''/** 1.1.71 — Visual Search query diagnostics. Never stores credentials, headers, cookies, nonce, or image bytes. */
function slb_visual_last_query_error_option_171() { return 'slb_visual_last_query_error_171'; }
function slb_visual_last_provider_diag_option_171() { return 'slb_visual_last_provider_diag_171'; }
function slb_visual_diag_text_171($value) {
    $value=(string)$value;
    $value=preg_replace('/Bearer\\s+[A-Za-z0-9._~+\\/-]+/i','Bearer [REDACTED]',$value);
    $value=preg_replace('/(api[_ -]?key|authorization|cookie|nonce)(\\s*[:=]\\s*)[^\\s,;]+/i','$1$2[REDACTED]',$value);
    return sanitize_text_field(substr($value,0,1800));
}
function slb_visual_safe_file_171($file) {
    $file=(string)$file;
    if(defined('ABSPATH')&&ABSPATH&&strpos($file,ABSPATH)===0)$file='ABSPATH/'.ltrim(substr($file,strlen(ABSPATH)),'/\\\\');
    return slb_visual_diag_text_171($file);
}
function slb_visual_save_provider_diag_171($diag) {
    $safe=array(
        'timestamp'=>gmdate('c'),
        'model'=>slb_visual_model_160(),
        'http_status'=>isset($diag['http_status'])?(int)$diag['http_status']:0,
        'response_json_valid'=>!empty($diag['response_json_valid']),
        'embedding_received'=>!empty($diag['embedding_received']),
        'query_vector_dimension'=>isset($diag['query_vector_dimension'])?(int)$diag['query_vector_dimension']:0,
        'provider_error_code'=>isset($diag['provider_error_code'])?sanitize_key((string)$diag['provider_error_code']):'',
    );
    update_option(slb_visual_last_provider_diag_option_171(),$safe,false);
}
function slb_visual_index_diag_snapshot_171() {
    global $wpdb;$table=slb_visual_table_160();$state=slb_visual_index_state_160();
    $exists=(string)$wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s',$wpdb->esc_like($table)));
    if($exists!==$table)return array('table'=>$table,'status'=>(string)($state['status']??'not_started'),'indexed_products'=>0,'indexed_images'=>0,'failed_items'=>(int)($state['failed_count']??0),'stored_vector_dimensions'=>array(),'invalid_embeddings'=>0);
    $dims=array();$rows=$wpdb->get_results("SELECT dims,COUNT(*) AS n FROM {$table} GROUP BY dims ORDER BY dims ASC",ARRAY_A);
    foreach((array)$rows as $row)$dims[(string)(int)($row['dims']??0)]=(int)($row['n']??0);
    return array(
        'table'=>$table,
        'status'=>(string)($state['status']??'partial'),
        'indexed_products'=>(int)$wpdb->get_var("SELECT COUNT(DISTINCT product_id) FROM {$table}"),
        'indexed_images'=>(int)$wpdb->get_var("SELECT COUNT(*) FROM {$table}"),
        'failed_items'=>(int)($state['failed_count']??0),
        'stored_vector_dimensions'=>$dims,
        'invalid_embeddings'=>(int)$wpdb->get_var("SELECT COUNT(*) FROM {$table} WHERE dims=0 OR embedding IS NULL OR OCTET_LENGTH(embedding)=0"),
    );
}
function slb_visual_capture_throwable_171($e) {
    $trace=array();foreach(array_slice((array)$e->getTrace(),0,12) as $frame){$trace[]=array(
        'file'=>isset($frame['file'])?slb_visual_safe_file_171($frame['file']):'',
        'line'=>isset($frame['line'])?(int)$frame['line']:0,
        'function'=>isset($frame['function'])?slb_visual_diag_text_171($frame['function']):'',
        'class'=>isset($frame['class'])?slb_visual_diag_text_171($frame['class']):'',
        'type'=>isset($frame['type'])?slb_visual_diag_text_171($frame['type']):'',
    );}
    $index=array();try{$index=slb_visual_index_diag_snapshot_171();}catch(Throwable $ignore){$index=array('diagnostic_error'=>'Index snapshot unavailable');}
    $diag=array(
        'timestamp'=>gmdate('c'),
        'exception_class'=>get_class($e),
        'message'=>slb_visual_diag_text_171($e->getMessage()),
        'file'=>slb_visual_safe_file_171($e->getFile()),
        'line'=>(int)$e->getLine(),
        'function'=>isset($trace[0]['function'])?(string)$trace[0]['function']:'',
        'stack'=>$trace,
        'index'=>$index,
    );
    update_option(slb_visual_last_query_error_option_171(),$diag,false);return $diag;
}
function slb_visual_rest_response_171($body,$status=200) { return new WP_REST_Response($body,(int)$status); }
function slb_visual_rest_error_171($error) {
    if(!is_wp_error($error))return slb_visual_rest_response_171(array('success'=>false,'code'=>'visual_search_error','message'=>'Visual search could not be completed.'),500);
    $code=(string)$error->get_error_code();$data=$error->get_error_data();$status=is_array($data)&&isset($data['status'])?(int)$data['status']:500;
    if(in_array($code,array('visual_index_building','visual_index_empty'),true))return slb_visual_rest_response_171(array('success'=>false,'code'=>$code==='visual_index_building'?'index_building':'index_not_ready','message'=>$code==='visual_index_building'?'Visual index is still building.':'Visual index is not ready yet.'),503);
    if(in_array($code,array('visual_provider_auth','visual_provider_rate_limited','visual_provider_unavailable','visual_provider_error','visual_provider_invalid'),true))return slb_visual_rest_response_171(array('success'=>false,'code'=>'provider_error','message'=>'Visual recognition service is unavailable.'),$status>=400?$status:502);
    if($code==='visual_search_not_configured')return slb_visual_rest_response_171(array('success'=>false,'code'=>'visual_search_not_configured','message'=>'Visual Search is not configured on the server.'),503);
    if(in_array($code,array('visual_invalid_image','visual_rate_limited','visual_busy','rest_forbidden'),true))return slb_visual_rest_response_171(array('success'=>false,'code'=>$code,'message'=>$error->get_error_message()),$status>=400?$status:400);
    return slb_visual_rest_response_171(array('success'=>false,'code'=>'visual_search_error','message'=>'Visual search could not be completed.'),$status>=400?$status:500);
}

'''
p=one(p,provider_marker,helpers+provider_marker,'diagnostic helpers insertion')

old_provider_line="$code=(int)wp_remote_retrieve_response_code($response);$raw=(string)wp_remote_retrieve_body($response);$data=json_decode($raw,true);"
new_provider_line="$code=(int)wp_remote_retrieve_response_code($response);$raw=(string)wp_remote_retrieve_body($response);$data=json_decode($raw,true);if($input_type==='query')slb_visual_save_provider_diag_171(array('http_status'=>$code,'response_json_valid'=>is_array($data),'embedding_received'=>false,'query_vector_dimension'=>0));"
p=one(p,old_provider_line,new_provider_line,'query provider telemetry start')

old_provider_return="if(count($vectors)!==count($inputs))return new WP_Error('visual_provider_invalid','Visual recognition provider returned an incomplete embedding response.',array('status'=>502));\n    return $vectors;"
new_provider_return="if(count($vectors)!==count($inputs)){if($input_type==='query')slb_visual_save_provider_diag_171(array('http_status'=>$code,'response_json_valid'=>is_array($data),'embedding_received'=>false,'query_vector_dimension'=>0,'provider_error_code'=>'incomplete_embedding'));return new WP_Error('visual_provider_invalid','Visual recognition provider returned an incomplete embedding response.',array('status'=>502));}\n    if($input_type==='query')slb_visual_save_provider_diag_171(array('http_status'=>$code,'response_json_valid'=>is_array($data),'embedding_received'=>!empty($vectors[0])&&is_array($vectors[0]),'query_vector_dimension'=>!empty($vectors[0])&&is_array($vectors[0])?count($vectors[0]):0));\n    return $vectors;"
p=one(p,old_provider_return,new_provider_return,'query provider telemetry success')

old_callback="""function slb_visual_search_161($request){
    $rate=slb_visual_rate_check_161();if(is_wp_error($rate))return $rate;$uid=get_current_user_id();$lock='slb_vis_lock_'.(int)$uid;
    if(get_transient($lock))return new WP_Error('visual_busy','Another visual search is already processing for this user.',array('status'=>429));
    set_transient($lock,1,120);try{return slb_visual_search_160($request);}finally{delete_transient($lock);}
}"""
new_callback="""function slb_visual_search_161($request){
    $rate=slb_visual_rate_check_161();if(is_wp_error($rate))return slb_visual_rest_error_171($rate);$uid=get_current_user_id();$lock='slb_vis_lock_'.(int)$uid;
    if(get_transient($lock))return slb_visual_rest_error_171(new WP_Error('visual_busy','Another visual search is already processing for this user.',array('status'=>429)));
    set_transient($lock,1,120);
    try{
        $result=slb_visual_search_160($request);if(is_wp_error($result))return slb_visual_rest_error_171($result);
        $items=isset($result['items'])&&is_array($result['items'])?$result['items']:array();
        $body=$result;$body['success']=true;$body['matches']=$items;if(!$items)$body['status']='no_match';
        return slb_visual_rest_response_171($body,200);
    }catch(Throwable $e){
        slb_visual_capture_throwable_171($e);
        return slb_visual_rest_response_171(array('success'=>false,'code'=>'visual_search_error','message'=>'Visual search could not be completed.'),500);
    }finally{delete_transient($lock);}
}"""
p=one(p,old_callback,new_callback,'Throwable recognition boundary')

old_notice="$notice = slb_visual_admin_notice_message_162($notice_code);\n    ?>"
new_notice="$notice = slb_visual_admin_notice_message_162($notice_code);\n    $query_diag = get_option(slb_visual_last_query_error_option_171(), array()); if(!is_array($query_diag))$query_diag=array();\n    $provider_diag = get_option(slb_visual_last_provider_diag_option_171(), array()); if(!is_array($provider_diag))$provider_diag=array();\n    try{$index_diag=slb_visual_index_diag_snapshot_171();}catch(Throwable $e){$index_diag=array('table'=>slb_visual_table_160(),'status'=>'unavailable','indexed_products'=>0,'indexed_images'=>0,'failed_items'=>0,'stored_vector_dimensions'=>array(),'invalid_embeddings'=>0);}\n    ?>"
p=one(p,old_notice,new_notice,'admin diagnostics variables')

old_admin_end='''      </div>
    </div>
    <?php
}
add_action('admin_menu', function() {'''
new_admin_end='''      </div>
      <div class="card" style="max-width:820px;padding:22px;margin-top:18px">
        <h2 style="margin-top:0">Visual Search Diagnostics</h2>
        <p class="description">Administrator-only diagnostics. Credentials, cookies, nonces, authorization headers and uploaded image data are never stored here.</p>
        <table class="widefat striped" style="max-width:760px;margin-top:14px"><tbody>
          <tr><td><strong>MODEL</strong></td><td><code><?php echo esc_html((string)($provider_diag['model'] ?? slb_visual_model_160())); ?></code></td></tr>
          <tr><td><strong>VOYAGE HTTP STATUS</strong></td><td><?php echo esc_html((string)((int)($provider_diag['http_status'] ?? 0) ?: '—')); ?></td></tr>
          <tr><td><strong>RESPONSE JSON VALID</strong></td><td><?php echo !empty($provider_diag['response_json_valid']) ? 'YES' : 'NO / NOT YET TESTED'; ?></td></tr>
          <tr><td><strong>EMBEDDING RECEIVED</strong></td><td><?php echo !empty($provider_diag['embedding_received']) ? 'YES' : 'NO / NOT YET TESTED'; ?></td></tr>
          <tr><td><strong>QUERY VECTOR DIMENSION</strong></td><td><?php echo esc_html((string)((int)($provider_diag['query_vector_dimension'] ?? 0) ?: '—')); ?></td></tr>
          <tr><td><strong>INDEX TABLE</strong></td><td><code><?php echo esc_html((string)($index_diag['table'] ?? '')); ?></code></td></tr>
          <tr><td><strong>INDEX STATUS</strong></td><td><?php echo esc_html((string)($index_diag['status'] ?? '')); ?></td></tr>
          <tr><td><strong>INDEXED PRODUCTS</strong></td><td><?php echo esc_html((string)(int)($index_diag['indexed_products'] ?? 0)); ?></td></tr>
          <tr><td><strong>INDEXED IMAGES</strong></td><td><?php echo esc_html((string)(int)($index_diag['indexed_images'] ?? 0)); ?></td></tr>
          <tr><td><strong>FAILED ITEMS</strong></td><td><?php echo esc_html((string)(int)($index_diag['failed_items'] ?? 0)); ?></td></tr>
          <tr><td><strong>STORED VECTOR DIMENSIONS</strong></td><td><code><?php echo esc_html(wp_json_encode($index_diag['stored_vector_dimensions'] ?? array())); ?></code></td></tr>
          <tr><td><strong>INVALID / NULL EMBEDDINGS</strong></td><td><?php echo esc_html((string)(int)($index_diag['invalid_embeddings'] ?? 0)); ?></td></tr>
        </tbody></table>
        <h3>Last recognition Throwable</h3>
        <?php if($query_diag){ ?>
        <table class="widefat striped" style="max-width:760px"><tbody>
          <tr><td><strong>TIMESTAMP</strong></td><td><?php echo esc_html((string)($query_diag['timestamp'] ?? '')); ?></td></tr>
          <tr><td><strong>EXCEPTION CLASS</strong></td><td><code><?php echo esc_html((string)($query_diag['exception_class'] ?? '')); ?></code></td></tr>
          <tr><td><strong>MESSAGE</strong></td><td><?php echo esc_html((string)($query_diag['message'] ?? '')); ?></td></tr>
          <tr><td><strong>FILE</strong></td><td><code><?php echo esc_html((string)($query_diag['file'] ?? '')); ?></code></td></tr>
          <tr><td><strong>LINE</strong></td><td><?php echo esc_html((string)(int)($query_diag['line'] ?? 0)); ?></td></tr>
          <tr><td><strong>FUNCTION</strong></td><td><code><?php echo esc_html((string)($query_diag['function'] ?? '')); ?></code></td></tr>
        </tbody></table>
        <pre style="max-width:760px;white-space:pre-wrap;overflow:auto;background:#f6f7f7;padding:12px;margin-top:12px"><?php echo esc_html(wp_json_encode($query_diag['stack'] ?? array(),JSON_PRETTY_PRINT)); ?></pre>
        <?php } else { ?><p>No recognition Throwable has been captured yet.</p><?php } ?>
      </div>
    </div>
    <?php
}
add_action('admin_menu', function() {'''
p=one(p,old_admin_end,new_admin_end,'admin last-error panel')

php.write_text(p,encoding='utf-8')
if js.read_bytes()!=js0: raise SystemExit('merchant.js unexpectedly changed')
if css.read_bytes()!=css0: raise SystemExit('bridge.css unexpectedly changed')
if customer.read_bytes()!=customer0: raise SystemExit('customer.js unexpectedly changed')

required=(
    'Version: 1.1.71',
    "define('SLB_VERSION', '1.1.71');",
    'catch(Throwable $e)',
    'slb_visual_capture_throwable_171',
    'slb_visual_last_query_error_option_171',
    'Visual Search Diagnostics',
    "'success'=>false,'code'=>'visual_search_error'",
    "$body['success']=true;$body['matches']=$items",
    'STORED VECTOR DIMENSIONS',
)
for token in required:
    if token not in p: raise SystemExit('missing required token: '+token)

print('Bridge 1.1.71 Visual Search diagnostics + JSON containment applied')
