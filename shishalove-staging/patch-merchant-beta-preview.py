#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1] / 'shishalove-mobile'
base_patch = ROOT / 'tools' / 'patch-merchant-context-1.1.43.py'
subprocess.check_call([sys.executable, str(base_patch)])

# Package the exact approved Merchant wordmark used by the WebView header as a
# native splash resource.
import base64
import re
repo_root = Path(__file__).resolve().parents[1]
merchant_runtime = (repo_root / 'shishalove-staging' / 'merchant-generated.js').read_text(encoding='utf-8')
wordmark_match = re.search(r"var MERCHANT_WORDMARK='data:image/png;base64,([^']+)'", merchant_runtime)
if not wordmark_match:
    raise SystemExit('MERCHANT_WORDMARK data URI missing from staging runtime')
drawable_dir = ROOT / 'merchant/src/main/res/drawable-nodpi'
drawable_dir.mkdir(parents=True, exist_ok=True)
(drawable_dir / 'merchant_splash_wordmark.png').write_bytes(base64.b64decode(wordmark_match.group(1)))

def once(text, old, new, label):
    n = text.count(old)
    if n != 1:
        raise SystemExit(f'{label}: expected 1 anchor, found {n}')
    return text.replace(old, new, 1)

def replace_method(text, signature, replacement):
    start = text.find(signature)
    if start < 0:
        raise SystemExit('missing method: ' + signature)
    brace = text.find('{', start)
    if brace < 0:
        raise SystemExit('missing opening brace: ' + signature)
    depth = 0
    end = None
    for i in range(brace, len(text)):
        if text[i] == '{':
            depth += 1
        elif text[i] == '}':
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    if end is None:
        raise SystemExit('missing closing brace: ' + signature)
    return text[:start] + replacement.rstrip() + text[end:]

# ---------------------------------------------------------------------------
# SIDE-BY-SIDE BETA IDENTITY — Preview 7
# ---------------------------------------------------------------------------
main = ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MainActivity.java'
t = main.read_text(encoding='utf-8')

# Native splash dependencies.
t = once(t, 'import android.graphics.Color;\n', 'import android.graphics.Color;\nimport android.graphics.drawable.GradientDrawable;\n', 'splash drawable import')
t = once(t, 'import android.view.ViewGroup;\n', 'import android.view.ViewGroup;\nimport android.view.Gravity;\n', 'splash gravity import')
t = once(t, 'import android.widget.ImageView;\n', 'import android.widget.ImageView;\nimport android.widget.Button;\nimport android.widget.LinearLayout;\nimport android.widget.TextView;\n', 'splash widget imports')

t = once(
    t,
    '    private ImageView snapshotOverlay;\n',
    '    private ImageView snapshotOverlay;\n    private FrameLayout launchOverlay;\n    private Button enterButton;\n    private boolean merchantPageReady = false;\n    private boolean enterRequested = false;\n    private static final String EXTRA_OPEN_ORDER_ID = "shishalove_open_order_id";\n    private long pendingOpenOrderId = 0L;\n',
    'splash fields'
)

# Add the branded splash above the WebView/snapshot layer.
t = once(
    t,
    '''        root.addView(snapshotOverlay, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        progressBar = new ProgressBar''',
    '''        root.addView(snapshotOverlay, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        createLaunchOverlay();

        progressBar = new ProgressBar''',
    'launch overlay insertion'
)

# Show branded splash only on a true cold start.
t = once(
    t,
    '        if (savedInstanceState == null) webView.loadUrl(START_URL);\n        else webView.restoreState(savedInstanceState);',
    '''        captureOrderIntent(getIntent());
        if (savedInstanceState == null) {
            webView.loadUrl(START_URL);
        } else {
            launchOverlay.setVisibility(View.GONE);
            webView.restoreState(savedInstanceState);
        }''',
    'cold start splash state'
)

splash_methods = r'''    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private GradientDrawable roundedBackground(int color, int radiusDp) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(color);
        d.setCornerRadius(dp(radiusDp));
        return d;
    }

    private void createLaunchOverlay() {
        launchOverlay = new FrameLayout(this);
        launchOverlay.setBackgroundColor(Color.WHITE);
        launchOverlay.setClickable(true);
        launchOverlay.setFocusable(true);

        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setGravity(Gravity.CENTER_HORIZONTAL);

        LinearLayout logoCard = new LinearLayout(this);
        logoCard.setOrientation(LinearLayout.VERTICAL);
        logoCard.setGravity(Gravity.CENTER);
        logoCard.setBackground(roundedBackground(Color.rgb(5, 5, 5), 14));

        ImageView wordmark = new ImageView(this);
        wordmark.setImageResource(R.drawable.merchant_splash_wordmark);
        wordmark.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        LinearLayout.LayoutParams wordmarkLp = new LinearLayout.LayoutParams(dp(286), dp(74));
        wordmarkLp.setMargins(dp(12), dp(10), dp(12), 0);
        logoCard.addView(wordmark, wordmarkLp);

        TextView merchantBand = new TextView(this);
        merchantBand.setText("MERCHANT");
        merchantBand.setTextColor(Color.WHITE);
        merchantBand.setTextSize(20);
        merchantBand.setGravity(Gravity.CENTER);
        merchantBand.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        merchantBand.setLetterSpacing(0.08f);
        merchantBand.setBackgroundColor(Color.rgb(219, 35, 66));
        logoCard.addView(merchantBand, new LinearLayout.LayoutParams(dp(310), dp(42)));

        content.addView(logoCard, new LinearLayout.LayoutParams(dp(310), dp(126)));

        enterButton = new Button(this);
        enterButton.setText("ENTER");
        enterButton.setTextColor(Color.WHITE);
        enterButton.setTextSize(17);
        enterButton.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        enterButton.setBackground(roundedBackground(Color.rgb(17, 17, 17), 16));
        LinearLayout.LayoutParams enterLp = new LinearLayout.LayoutParams(dp(210), dp(56));
        enterLp.setMargins(0, dp(34), 0, 0);
        content.addView(enterButton, enterLp);

        enterButton.setOnClickListener(v -> {
            enterRequested = true;
            if (merchantPageReady) {
                hideLaunchOverlay();
            } else {
                enterButton.setText("LOADING…");
                enterButton.setEnabled(false);
            }
        });

        FrameLayout.LayoutParams contentLp = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                Gravity.CENTER
        );
        launchOverlay.addView(content, contentLp);
        root.addView(launchOverlay, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));
    }

    private void hideLaunchOverlay() {
        if (launchOverlay == null || launchOverlay.getVisibility() != View.VISIBLE) return;
        launchOverlay.animate().alpha(0f).setDuration(140).withEndAction(() -> {
            launchOverlay.setVisibility(View.GONE);
            launchOverlay.setAlpha(1f);
        }).start();
    }

'''
t = once(t, '    private void createOrderNotificationChannel() {', splash_methods + '    private void createOrderNotificationChannel() {', 'splash methods')

# Share one last-seen order ID between foreground WebView notifications and the
# native background poller so the same order can never alert twice.
t = once(
    t,
    '''        @JavascriptInterface
        public void notifyOrder(String number, String customer, String total) {
            runOnUiThread(() -> showOrderNotification(number, customer, total));
        }''',
    '''        @JavascriptInterface
        public void notifyOrder(String number, String customer, String total) {
            runOnUiThread(() -> showOrderNotification(0L, number, customer, total));
        }

        @JavascriptInterface
        public void notifyOrderWithId(String idText, String number, String customer, String total) {
            long id = 0L;
            try { id = Long.parseLong(idText == null ? "0" : idText); } catch (Exception ignored) {}
            final long orderId = id;
            if (orderId > 0 && !OrderPollReceiver.claimNotification(MainActivity.this, orderId)) return;
            runOnUiThread(() -> showOrderNotification(orderId, number, customer, total));
        }

        @JavascriptInterface
        public boolean hasBackgroundOrderToken() {
            return OrderPollReceiver.hasToken(MainActivity.this);
        }

        @JavascriptInterface
        public void registerBackgroundOrders(String token, String latestOrderId) {
            long baseline = 0L;
            try { baseline = Long.parseLong(latestOrderId == null ? "0" : latestOrderId); } catch (Exception ignored) {}
            OrderPollReceiver.saveRegistration(MainActivity.this, token, baseline);
        }''',
    'background notification bridge'
)

# Notification taps must reuse the permanent Merchant shell and open the exact order.
t = replace_method(t, '    private void showOrderNotification(String number, String customer, String total)', r'''    private void showOrderNotification(long orderId, String number, String customer, String total) {
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        Intent openIntent = new Intent(this, MerchantActivityV121.class);
        openIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if (orderId > 0L) {
            openIntent.putExtra(EXTRA_OPEN_ORDER_ID, orderId);
            openIntent.setData(Uri.parse("shishalove://merchant/order/" + orderId));
        }
        int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) pendingFlags |= PendingIntent.FLAG_IMMUTABLE;
        int requestCode = orderId > 0L ? (int) (orderId & 0x7fffffff) : 0;
        PendingIntent pendingIntent = PendingIntent.getActivity(this, requestCode, openIntent, pendingFlags);

        String safeNumber = number == null || number.trim().isEmpty() ? "" : " #" + number.trim();
        String safeCustomer = customer == null || customer.trim().isEmpty() ? "Customer" : customer.trim();
        String safeTotal = total == null ? "" : total.trim();
        String text = safeCustomer + (safeTotal.isEmpty() ? "" : " · " + safeTotal);

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(this, ORDER_CHANNEL_ID);
        } else {
            builder = new Notification.Builder(this);
            builder.setPriority(Notification.PRIORITY_HIGH);
        }
        builder.setSmallIcon(R.drawable.ic_shishalove)
                .setContentTitle("New ShishaLove order" + safeNumber)
                .setContentText(text)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent);

        int notificationId = orderId > 0L ? (int) (orderId & 0x7fffffff) : (int) (System.currentTimeMillis() & 0x7fffffff);
        manager.notify(notificationId, builder.build());
    }''')

background_register_method = r'''    private void registerBackgroundOrderChannel(WebView view, String url) {
        if (view == null || url == null || !url.contains("shishalove-merchant")) return;
        String js = "(function(){try{"
                + "if(!window.ShishaLoveNative||typeof window.ShishaLoveNative.registerBackgroundOrders!=='function')return;"
                + "if(typeof window.ShishaLoveNative.hasBackgroundOrderToken==='function'&&window.ShishaLoveNative.hasBackgroundOrderToken())return;"
                + "var cfg=window.SHISHALOVE_BRIDGE||{},nonce=cfg.restNonce||'';if(!nonce)return;"
                + "var beta=location.pathname.indexOf('/shishalove-merchant-beta/')===0;"
                + "var endpoint=location.origin+(beta?'/wp-json/shishalove-staging/v1/merchant/device-register':'/wp-json/shishalove/v1/merchant/device-register');"
                + "fetch(endpoint,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'X-WP-Nonce':nonce,'Content-Type':'application/json'}})"
                + ".then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();})"
                + ".then(function(d){if(d&&d.token)window.ShishaLoveNative.registerBackgroundOrders(String(d.token),String(d.latest_order_id||0));})"
                + ".catch(function(){});"
                + "}catch(e){}})();";
        view.evaluateJavascript(js, null);
    }

'''
t = once(t, '    private String readAsset(String name) {', background_register_method + r'''    private void captureOrderIntent(Intent intent) {
        if (intent == null) return;
        long id = intent.getLongExtra(EXTRA_OPEN_ORDER_ID, 0L);
        if (id <= 0L && intent.getData() != null) {
            try {
                java.util.List<String> segments = intent.getData().getPathSegments();
                if (segments != null && !segments.isEmpty()) id = Long.parseLong(segments.get(segments.size() - 1));
            } catch (Exception ignored) {}
        }
        if (id > 0L) {
            pendingOpenOrderId = id;
            enterRequested = true;
        }
    }

    private void tryOpenPendingOrder() {
        if (webView == null || pendingOpenOrderId <= 0L) return;
        final long id = pendingOpenOrderId;
        String js = "(function(){if(typeof window.SLM_OPEN_ORDER==='function'){window.SLM_OPEN_ORDER(" + id + ");return true;}return false;})();";
        webView.evaluateJavascript(js, value -> {
            if ("true".equals(value)) {
                pendingOpenOrderId = 0L;
                hideLaunchOverlay();
            }
        });
    }

''' + '    private String readAsset(String name) {', 'background registration + order deep link methods')

t = once(
    t,
    'https://shishalove.eu/shishalove-merchant/?app=android&build=143',
    'https://shishalove.eu/shishalove-merchant-beta/?app=android&build=merchant-preview-7',
    'Merchant beta route'
)
t = t.replace('ShishaLoveMerchant/1.1.43', 'ShishaLoveMerchant/1.1.43-BetaPreview7')

# Faster first paint/reload: the HTML shell may paint from cache immediately;
# Merchant REST calls still bypass cache in the staged Bridge.
t = once(
    t,
    'settings.setCacheMode(WebSettings.LOAD_DEFAULT);',
    'settings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);',
    'Merchant shell cache mode'
)

# Never expose a blank white reload. If no in-memory snapshot exists yet, keep a
# lightweight native ShishaLove placeholder until the WebView is genuinely ready.
t = replace_method(t, '    private void showLastSnapshot()', r'''    private void showLastSnapshot() {
        if (launchOverlay != null && launchOverlay.getVisibility() == View.VISIBLE) return;
        if (lastSnapshot == null || lastSnapshot.isRecycled()) return;
        snapshotOverlay.animate().cancel();
        snapshotOverlay.setBackgroundColor(Color.WHITE);
        snapshotOverlay.setAlpha(1f);
        snapshotOverlay.setScaleType(ImageView.ScaleType.FIT_XY);
        snapshotOverlay.setImageBitmap(lastSnapshot);
        snapshotOverlay.setPadding(0, 0, 0, 0);
        snapshotOverlay.setVisibility(View.VISIBLE);
        snapshotOverlay.removeCallbacks(hideSnapshotFailsafe);
        snapshotOverlay.postDelayed(hideSnapshotFailsafe, 1400);
    }''')

# Insert a reusable hard timeout runnable before hideLastSnapshot().
t = t.replace(
    '    private void hideLastSnapshot() {',
    '''    private final Runnable hideSnapshotFailsafe = () -> {
        if (snapshotOverlay != null && snapshotOverlay.getVisibility() == View.VISIBLE) {
            hideLastSnapshot();
        }
    };

    private void hideLastSnapshot() {'''
)

# Do not hide the previous frame at first visual commit; Bridge data/layout may
# still be hydrating. Hide only after onPageFinished and a short paint window.
t = replace_method(t, '            public void onPageStarted(WebView view, String url, Bitmap favicon)', r'''            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                merchantPageReady = false;
                showLastSnapshot();
                applyRuntimeJs(view, url);
                view.postDelayed(() -> applyRuntimeJs(view, url), 60);
                view.postDelayed(() -> applyRuntimeJs(view, url), 180);
            }''')

t = replace_method(t, '            public void onPageCommitVisible(WebView view, String url)', r'''            public void onPageCommitVisible(WebView view, String url) {
                super.onPageCommitVisible(view, url);
                applyRuntimeJs(view, url);
                progressBar.setVisibility(View.GONE);
                merchantPageReady = true;
                if (enterButton != null) {
                    enterButton.setEnabled(true);
                    enterButton.setText("ENTER");
                }
                if (enterRequested && pendingOpenOrderId <= 0L) hideLaunchOverlay();
                view.postDelayed(this::tryOpenPendingOrder, 90);
                view.postDelayed(() -> registerBackgroundOrderChannel(view, url), 350);
                view.postDelayed(() -> {
                    applyRuntimeJs(view, url);
                    hideLastSnapshot();
                }, 120);
            }''')

t = replace_method(t, '            public void onPageFinished(WebView view, String url)', r'''            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                applyRuntimeJs(view, url);
                progressBar.setVisibility(View.GONE);
                merchantPageReady = true;
                if (enterButton != null) {
                    enterButton.setEnabled(true);
                    enterButton.setText("ENTER");
                }
                snapshotOverlay.removeCallbacks(hideSnapshotFailsafe);
                hideLastSnapshot();
                if (enterRequested && pendingOpenOrderId <= 0L) hideLaunchOverlay();
                tryOpenPendingOrder();
                registerBackgroundOrderChannel(view, url);
                view.postDelayed(() -> {
                    applyRuntimeJs(view, url);
                    registerBackgroundOrderChannel(view, url);
                    captureSnapshot();
                }, 600);
            }''')
# Notification tap behavior: reuse current Activity/WebView and deep-link immediately.
t = once(
    t,
    '''    @Override
    protected void onResume() {''',
    '''    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        captureOrderIntent(intent);
        if (webView != null) webView.post(this::tryOpenPendingOrder);
    }

    @Override
    protected void onResume() {''',
    'notification onNewIntent'
)

# Ensure background polling is alive whenever Merchant returns to foreground.
t = once(
    t,
    '''    protected void onResume() {
        super.onResume();
        if (webView != null) {''',
    '''    protected void onResume() {
        super.onResume();
        OrderPollReceiver.scheduleExisting(this, 5000L);
        if (webView != null) {''',
    'resume background polling'
)

main.write_text(t, encoding='utf-8')

# Native background poller: survives normal app closure, reschedules itself,
# and restores after reboot/app update. It does not rely on the WebView process.
receiver_java = r'''package eu.shishalove.merchant;

import android.Manifest;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.PowerManager;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class OrderPollReceiver extends BroadcastReceiver {
    private static final String PREFS = "shishalove_order_background_v1";
    private static final String KEY_TOKEN = "device_token";
    private static final String KEY_LAST = "last_seen_order_id";
    private static final String CHANNEL_ID = "shishalove_orders";
    private static final String PULSE_URL = "https://shishalove.eu/wp-json/shishalove-staging/v1/merchant/order-pulse";
    private static final long NORMAL_DELAY_MS = 60_000L;
    private static final long ERROR_DELAY_MS = 120_000L;
    private static final int ALARM_REQUEST = 8146;

    public static boolean hasToken(Context context) {
        return !prefs(context).getString(KEY_TOKEN, "").trim().isEmpty();
    }

    public static void saveRegistration(Context context, String token, long baseline) {
        if (token == null || token.trim().isEmpty()) return;
        SharedPreferences p = prefs(context);
        long current = p.getLong(KEY_LAST, 0L);
        SharedPreferences.Editor e = p.edit().putString(KEY_TOKEN, token.trim());
        if (current <= 0L && baseline > 0L) e.putLong(KEY_LAST, baseline);
        e.apply();
        scheduleExisting(context, 3000L);
    }

    public static synchronized boolean claimNotification(Context context, long orderId) {
        if (orderId <= 0L) return true;
        SharedPreferences p = prefs(context);
        long current = p.getLong(KEY_LAST, 0L);
        if (orderId <= current) return false;
        p.edit().putLong(KEY_LAST, orderId).apply();
        return true;
    }

    public static void scheduleExisting(Context context, long delayMs) {
        if (!hasToken(context)) return;
        schedule(context, delayMs);
    }

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private static PendingIntent alarmIntent(Context context) {
        Intent i = new Intent(context, OrderPollReceiver.class);
        i.setAction("eu.shishalove.merchant.POLL_ORDERS");
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getBroadcast(context, ALARM_REQUEST, i, flags);
    }

    private static void schedule(Context context, long delayMs) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        long at = System.currentTimeMillis() + Math.max(30_000L, delayMs);
        PendingIntent pi = alarmIntent(context);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        } else {
            am.set(AlarmManager.RTC_WAKEUP, at, pi);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (!hasToken(context)) return;
        final PendingResult pending = goAsync();
        final PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        final PowerManager.WakeLock wake = pm == null ? null :
                pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "ShishaLove:OrderPoll");
        if (wake != null) wake.acquire(20_000L);

        new Thread(() -> {
            long next = NORMAL_DELAY_MS;
            try {
                poll(context.getApplicationContext());
            } catch (Throwable ignored) {
                next = ERROR_DELAY_MS;
            } finally {
                schedule(context.getApplicationContext(), next);
                if (wake != null && wake.isHeld()) wake.release();
                pending.finish();
            }
        }, "ShishaLoveOrderPoll").start();
    }

    private static void poll(Context context) throws Exception {
        String token = prefs(context).getString(KEY_TOKEN, "").trim();
        if (token.isEmpty()) return;

        HttpURLConnection conn = (HttpURLConnection) new URL(PULSE_URL + "?_=" + System.currentTimeMillis()).openConnection();
        conn.setRequestMethod("GET");
        conn.setConnectTimeout(10_000);
        conn.setReadTimeout(10_000);
        conn.setUseCaches(false);
        conn.setRequestProperty("Accept", "application/json");
        conn.setRequestProperty("Cache-Control", "no-store");
        conn.setRequestProperty("X-ShishaLove-Device", token);

        int code = conn.getResponseCode();
        if (code == 401 || code == 403) {
            prefs(context).edit().remove(KEY_TOKEN).apply();
            return;
        }
        if (code < 200 || code >= 300) throw new IllegalStateException("HTTP " + code);

        StringBuilder body = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) body.append(line);
        } finally {
            conn.disconnect();
        }

        JSONObject payload = new JSONObject(body.toString());
        JSONArray items = payload.optJSONArray("items");
        if (items == null || items.length() == 0) return;

        List<JSONObject> fresh = new ArrayList<>();
        long current = prefs(context).getLong(KEY_LAST, 0L);
        long latest = current;

        for (int i = 0; i < items.length(); i++) {
            JSONObject o = items.optJSONObject(i);
            if (o == null) continue;
            long id = o.optLong("id", 0L);
            latest = Math.max(latest, id);
            if (current > 0L && id > current) fresh.add(o);
        }

        if (current <= 0L) {
            prefs(context).edit().putLong(KEY_LAST, latest).apply();
            return;
        }

        Collections.sort(fresh, Comparator.comparingLong(o -> o.optLong("id", 0L)));
        for (JSONObject o : fresh) {
            long id = o.optLong("id", 0L);
            if (id <= 0L || !claimNotification(context, id)) continue;
            showNotification(
                    context,
                    id,
                    String.valueOf(o.opt("number")),
                    o.optString("customer", "Customer"),
                    o.optString("total", "")
            );
        }
    }

    private static void showNotification(Context context, long orderId, String number, String customer, String total) {
        if (Build.VERSION.SDK_INT >= 33 &&
                context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID, "New orders", NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("Notifications when a new ShishaLove WooCommerce order arrives");
            manager.createNotificationChannel(channel);
        }

        Intent open = new Intent(context, MerchantActivityV121.class);
        open.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if (orderId > 0L) {
            open.putExtra("shishalove_open_order_id", orderId);
            open.setData(android.net.Uri.parse("shishalove://merchant/order/" + orderId));
        }
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        int requestCode = orderId > 0L ? (int) (orderId & 0x7fffffff) : 0;
        PendingIntent pending = PendingIntent.getActivity(context, requestCode, open, flags);

        String safeNumber = number == null || number.trim().isEmpty() ? "" : " #" + number.trim();
        String safeCustomer = customer == null || customer.trim().isEmpty() ? "Customer" : customer.trim();
        String safeTotal = total == null ? "" : total.trim();
        String text = safeCustomer + (safeTotal.isEmpty() ? "" : " · " + safeTotal);

        Notification.Builder b = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(context, CHANNEL_ID)
                : new Notification.Builder(context);
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) b.setPriority(Notification.PRIORITY_HIGH);

        b.setSmallIcon(R.drawable.ic_shishalove)
                .setContentTitle("New ShishaLove order" + safeNumber)
                .setContentText(text)
                .setAutoCancel(true)
                .setContentIntent(pending);

        manager.notify((int) (System.currentTimeMillis() & 0x7fffffff), b.build());
    }
}
'''
(ROOT / 'merchant/src/main/java/eu/shishalove/merchant/OrderPollReceiver.java').write_text(receiver_java, encoding='utf-8')

boot_java = r'''package eu.shishalove.merchant;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        OrderPollReceiver.scheduleExisting(context.getApplicationContext(), 15_000L);
    }
}
'''
(ROOT / 'merchant/src/main/java/eu/shishalove/merchant/BootReceiver.java').write_text(boot_java, encoding='utf-8')


# ---------------------------------------------------------------------------
# FIRST-PAINT CSS + EDITOR ACTION PLACEMENT.
# Runs through MainActivity.applyRuntimeJs() at page start/commit/finish and is
# intentionally idempotent. It fixes the cold-open nav before the delayed native
# viewport guard and moves CANCEL/UPDATE directly below Stock management.
# ---------------------------------------------------------------------------
polish = ROOT / 'merchant/src/main/assets/merchant_phone_polish.js'
pt = polish.read_text(encoding='utf-8')
preview7 = r'''
;(function(){
  function installPreview3(){
    if(!document.head)return;
    var s=document.getElementById('slm-preview7-first-paint');
    if(!s){
      s=document.createElement('style');
      s.id='slm-preview7-first-paint';
      s.textContent='body.slb-merchant{--safe-bottom:0px!important}body.slb-merchant .slm-app{height:auto!important;min-height:100vh!important;overflow:visible!important;padding-bottom:92px!important}body.slb-merchant .slm-page{height:auto!important;max-height:none!important;overflow:visible!important;padding-bottom:118px!important}body.slb-merchant .slm-bottom{position:fixed!important;left:0!important;right:0!important;top:auto!important;bottom:0!important;height:72px!important;min-height:72px!important;padding:0!important;margin:0!important;transform:none!important;background:#fff!important;z-index:9999!important}body.slb-merchant .slm-bottom button{font-size:11px!important;line-height:1.1!important;padding:0 2px!important}body.slb-merchant .slm-bottom button i{font-size:22px!important}.slm-panel .slm-form-actions{position:static!important;bottom:auto!important;margin:12px 0 6px!important;padding:0!important;background:#fff!important}';
      document.head.appendChild(s);
    }
    var panel=document.getElementById('slm-panel');
    if(panel){
      var stock=panel.querySelector('.slm-stock-management');
      var actions=panel.querySelector('.slm-form-actions');
      if(stock&&actions&&stock.nextElementSibling!==actions){
        stock.insertAdjacentElement('afterend',actions);
      }
    }
  }
  installPreview3();
  setTimeout(installPreview3,40);
  setTimeout(installPreview3,160);
  setTimeout(installPreview3,500);
  if(!window.__slmPreview3Observer&&document.documentElement){
    window.__slmPreview3Observer=new MutationObserver(function(){installPreview3();});
    window.__slmPreview3Observer.observe(document.documentElement,{childList:true,subtree:true});
  }
})();
'''
if 'slm-preview7-first-paint' not in pt:
    pt += preview7
polish.write_text(pt, encoding='utf-8')

# ---------------------------------------------------------------------------
# ANDROID DOCUMENT SCROLL + BOTTOM NAV — same approved Preview 2 behavior,
# applied more aggressively on cold opens where the first document can arrive late.
# ---------------------------------------------------------------------------
activity = ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MerchantActivityV121.java'
t = activity.read_text(encoding='utf-8')
t = replace_method(t, '    private void scheduleWebFixes()', r'''    private void scheduleWebFixes() {
        if (merchantWebView == null) return;
        merchantWebView.post(this::applyWebFix);
        merchantWebView.postDelayed(this::applyWebFix, 40);
        merchantWebView.postDelayed(this::applyWebFix, 120);
        merchantWebView.postDelayed(this::applyWebFix, 300);
        merchantWebView.postDelayed(this::applyWebFix, 700);
        merchantWebView.postDelayed(this::applyWebFix, 1400);
        merchantWebView.postDelayed(this::applyWebFix, 2600);
        merchantWebView.postDelayed(this::applyWebFix, 5000);
        merchantWebView.postDelayed(this::applyWebFix, 8000);
    }''')
t = replace_method(t, '    private void applyWebFix()', r'''    private void applyWebFix() {
        if (merchantWebView == null) return;
        String js = "(function(){"
                + "var d=document.documentElement,b=document.body,r=document.getElementById('slb-root');if(!d||!b)return;"
                + "d.style.setProperty('--safe-top','0px','important');"
                + "d.style.setProperty('--safe-bottom','0px','important');"
                + "d.style.setProperty('--slb-native-bottom','0px','important');"
                + "d.style.setProperty('height','auto','important');d.style.setProperty('min-height','100%','important');d.style.setProperty('overflow-x','hidden','important');d.style.setProperty('overflow-y','auto','important');d.style.setProperty('touch-action','pan-y','important');"
                + "b.style.setProperty('position','static','important');b.style.setProperty('height','auto','important');b.style.setProperty('min-height','100%','important');b.style.setProperty('overflow-x','hidden','important');b.style.setProperty('overflow-y','auto','important');b.style.setProperty('touch-action','pan-y','important');b.style.setProperty('-webkit-overflow-scrolling','touch','important');b.style.setProperty('overscroll-behavior-y','auto','important');"
                + "if(r){r.style.setProperty('position','static','important');r.style.setProperty('height','auto','important');r.style.setProperty('min-height','100%','important');r.style.setProperty('overflow','visible','important');r.style.setProperty('touch-action','pan-y','important');}"
                + "['slm-native-layout-141','slm-native-layout-142','slm-native-layout-beta2','slm-native-layout-beta7'].forEach(function(id){var x=document.getElementById(id);if(x)x.remove();});"
                + "var s=document.createElement('style');s.id='slm-native-layout-beta7';"
                + "s.textContent='body.slb-merchant{--safe-bottom:0px!important}body.slb-merchant .slm-app{position:relative!important;height:auto!important;min-height:100vh!important;display:block!important;overflow:visible!important;padding-bottom:92px!important}body.slb-merchant .slm-top{position:sticky!important;top:0!important;z-index:80!important}body.slb-merchant .slm-page{position:relative!important;height:auto!important;min-height:calc(100vh - 160px)!important;max-height:none!important;overflow:visible!important;touch-action:pan-y!important;padding-bottom:118px!important}body.slb-merchant .slm-bottom{position:fixed!important;left:0!important;right:0!important;top:auto!important;bottom:0!important;width:100%!important;height:72px!important;min-height:72px!important;padding:0!important;margin:0!important;transform:none!important;box-sizing:border-box!important;background:#fff!important;z-index:9999!important}body.slb-merchant .slm-bottom button{font-size:11px!important;line-height:1.1!important;padding:0 2px!important;min-width:0!important}body.slb-merchant .slm-bottom button i{font-size:22px!important;line-height:1!important}body.slb-merchant .slm-product-row,body.slb-merchant .slm-order{touch-action:pan-y!important}.slm-panel .slm-form-actions{position:static!important;bottom:auto!important;margin:12px 0 6px!important;padding:0!important}';"
                + "document.head.appendChild(s);"
                + "var panel=document.getElementById('slm-panel'),stock=panel&&panel.querySelector('.slm-stock-management'),actions=panel&&panel.querySelector('.slm-form-actions');if(stock&&actions&&stock.nextElementSibling!==actions)stock.insertAdjacentElement('afterend',actions);"
                + "})();";
        merchantWebView.evaluateJavascript(js, null);
    }''')
activity.write_text(t, encoding='utf-8')

gradle = ROOT / 'merchant/build.gradle'
t = gradle.read_text(encoding='utf-8')
t = once(t, 'versionCode 143', 'versionCode 14307', 'Merchant beta versionCode')
t = once(t, "versionName '1.1.43'", "versionName '1.1.43-preview7'", 'Merchant beta versionName')
gradle.write_text(t, encoding='utf-8')

manifest = ROOT / 'merchant/src/main/AndroidManifest.xml'
t = manifest.read_text(encoding='utf-8')
t = once(t, 'android:label="ShishaLove Merchant"', 'android:label="ShishaLove Merchant Beta"', 'Merchant beta label')
t = once(t, '    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />', '    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />\n    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />\n    <uses-permission android:name="android.permission.WAKE_LOCK" />', 'background permissions')
t = once(
    t,
    '''        <activity
            android:name=".MerchantActivityV121"
            android:launchMode="singleTop"''',
    '''        <receiver
            android:name=".OrderPollReceiver"
            android:exported="false" />
        <receiver
            android:name=".BootReceiver"
            android:enabled="true"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />
            </intent-filter>
        </receiver>
        <activity
            android:name=".MerchantActivityV121"''',
    'background receivers'
)
manifest.write_text(t, encoding='utf-8')

final_main = main.read_text(encoding='utf-8')
final_activity = activity.read_text(encoding='utf-8')
final_gradle = gradle.read_text(encoding='utf-8')
final_manifest = manifest.read_text(encoding='utf-8')
final_polish = polish.read_text(encoding='utf-8')

assert '/shishalove-merchant-beta/' in final_main
assert 'merchant-preview-7' in final_main
assert 'WebSettings.LOAD_CACHE_ELSE_NETWORK' in final_main
assert 'hideSnapshotFailsafe' in final_main
assert 'postDelayed(hideSnapshotFailsafe, 1400)' in final_main
assert 'snapshotOverlay.removeCallbacks(hideSnapshotFailsafe)' in final_main
assert 'merchant_splash_wordmark' in final_main
assert 'merchantBand.setText("MERCHANT")' in final_main
assert 'enterButton.setText("ENTER")' in final_main
assert 'createLaunchOverlay()' in final_main
assert 'view.postDelayed(() -> {' in final_main
assert 'versionCode 14307' in final_gradle
assert "versionName '1.1.43-preview7'" in final_gradle
assert 'ShishaLove Merchant Beta' in final_manifest
assert 'POST_NOTIFICATIONS' in final_manifest
assert 'RECEIVE_BOOT_COMPLETED' in final_manifest
assert 'WAKE_LOCK' in final_manifest
assert 'OrderPollReceiver' in final_manifest
assert 'BootReceiver' in final_manifest
assert 'android:launchMode="singleTop"' in final_manifest
assert 'registerBackgroundOrderChannel' in final_main
assert 'hasBackgroundOrderToken' in final_main
assert 'registerBackgroundOrders' in final_main
assert 'notifyOrderWithId' in final_main
assert 'EXTRA_OPEN_ORDER_ID' in final_main
assert 'new Intent(this, MerchantActivityV121.class)' in final_main
assert 'protected void onNewIntent(Intent intent)' in final_main
assert 'tryOpenPendingOrder' in final_main
assert (ROOT / 'merchant/src/main/java/eu/shishalove/merchant/OrderPollReceiver.java').exists()
assert (ROOT / 'merchant/src/main/java/eu/shishalove/merchant/BootReceiver.java').exists()
assert 'slm-native-layout-beta7' in final_activity
assert "padding-bottom:118px!important" in final_activity
assert "height:72px!important" in final_activity
assert "slm-preview7-first-paint" in final_polish
assert "stock.insertAdjacentElement('afterend',actions)" in final_polish
assert ".slm-panel .slm-form-actions{position:static!important" in final_polish
print('Merchant Beta Preview 7: instant notification deep-link + fast order reload/context + native background notifications + approved UI fixes MASTER FIX prepared')
