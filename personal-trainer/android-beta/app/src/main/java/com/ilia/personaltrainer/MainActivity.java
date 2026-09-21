package com.ilia.personaltrainer;

import android.Manifest;
import android.app.Activity;
import android.os.Bundle;
import android.os.Build;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Insets;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.net.Uri;
import android.provider.Settings;
import android.speech.tts.TextToSpeech;
import android.view.ViewGroup;
import android.view.View;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.Toast;

import org.json.JSONObject;
import java.util.Locale;
import java.io.InputStream;

public class MainActivity extends Activity {
    private WebView webView;
    private FrameLayout root;
    private ValueCallback<Uri[]> fileCallback;
    private static final int FILE_CHOOSER = 501;
    private static final int LOCATION_PERMISSION = 502;
    private static final int RUNTIME_MAX_ATTEMPTS = 18;
    private static final long RUNTIME_RETRY_MS = 300L;
    private LocationManager locationManager;
    private boolean locationRunning = false;
    private TextToSpeech tts;
    private boolean ttsReady = false;
    private View coverTapView;
    private FrameLayout nativeCover;
    private ImageView nativeCoverImage;
    private boolean coverVisible = true;
    private boolean nativeEntryCommitted = false;
    private int lastInsetTop = 0;
    private int lastInsetBottom = 0;

    private final LocationListener locationListener = new LocationListener() {
        @Override public void onLocationChanged(Location location) { sendLocation(location); }
        @Override public void onProviderEnabled(String provider) { sendGpsStatus("GPS ready"); }
        @Override public void onProviderDisabled(String provider) { sendGpsStatus("Location provider disabled"); }
        @Override public void onStatusChanged(String provider, int status, Bundle extras) { }
    };

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.BLACK);
        getWindow().setNavigationBarColor(Color.BLACK);
        if (Build.VERSION.SDK_INT >= 30) getWindow().setDecorFitsSystemWindows(false);

        root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(6,16,11));
        webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        root.addView(webView, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        // KINETIQ 3.0.12: native A54 cover above WebView.
        // This removes all dependency on transparent HTML/WebView hit testing.
        nativeCover = new FrameLayout(this);
        nativeCover.setBackgroundColor(Color.rgb(8, 9, 10));
        nativeCover.setClickable(false);
        nativeCover.setFocusable(false);
        nativeCover.setHapticFeedbackEnabled(true);

        nativeCoverImage = new ImageView(this);
        nativeCoverImage.setBackgroundColor(Color.rgb(8, 9, 10));
        nativeCoverImage.setScaleType(ImageView.ScaleType.FIT_XY);
        try (InputStream in = getAssets().open("kinetiq-cover-a54-v312.png")) {
            Bitmap coverBitmap = BitmapFactory.decodeStream(in);
            nativeCoverImage.setImageBitmap(coverBitmap);
        } catch (Exception ignored) {
            nativeCoverImage.setBackgroundColor(Color.rgb(8, 9, 10));
        }
        nativeCover.addView(nativeCoverImage, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));
        root.addView(nativeCover, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        // Retain the field only for source/binary continuity; it stays inert in 3.0.12.
        coverTapView = new View(this);
        coverTapView.setVisibility(View.GONE);
        root.addView(coverTapView, new FrameLayout.LayoutParams(1, 1));

        setContentView(root);

        getWindow().getDecorView().setOnSystemUiVisibilityChangeListener(visibility -> {
            if (coverVisible) scheduleImmersiveCover();
        });

        root.setOnApplyWindowInsetsListener((v, windowInsets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                Insets bars = windowInsets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                lastInsetTop = bars.top;
                lastInsetBottom = bars.bottom;
            } else {
                lastInsetTop = windowInsets.getSystemWindowInsetTop();
                lastInsetBottom = windowInsets.getSystemWindowInsetBottom();
            }
            if (coverVisible) v.setPadding(0, 0, 0, 0);
            else v.setPadding(0, lastInsetTop, 0, lastInsetBottom);
            return windowInsets;
        });
        root.requestApplyInsets();
        root.post(() -> setCoverMode(true));

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        if (Build.VERSION.SDK_INT >= 21) s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
        WebView.setWebContentsDebuggingEnabled(false);

        locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                int result = tts.setLanguage(Locale.UK);
                ttsReady = result != TextToSpeech.LANG_MISSING_DATA && result != TextToSpeech.LANG_NOT_SUPPORTED;
                if (ttsReady) tts.setSpeechRate(1.02f);
            }
        });
        webView.addJavascriptInterface(new PTBridge(), "PTNative");

        webView.setWebViewClient(new WebViewClient() {
            @Override public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                view.postDelayed(() -> verifyRuntimeReady(view, 0), RUNTIME_RETRY_MS);
            }

            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                if (!req.isForMainFrame()) return false;
                Uri u = req.getUrl();
                String scheme = u.getScheme() == null ? "" : u.getScheme();
                if ("http".equals(scheme) || "https".equals(scheme)) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, u)); }
                    catch (Exception e) { Toast.makeText(MainActivity.this, "No app can open this link", Toast.LENGTH_SHORT).show(); }
                    return true;
                }
                return false;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent i;
                try { i = params.createIntent(); }
                catch (Exception e) {
                    i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                    i.setType("*/*");
                    i.addCategory(Intent.CATEGORY_OPENABLE);
                }
                try { startActivityForResult(i, FILE_CHOOSER); }
                catch (Exception e) {
                    fileCallback = null;
                    Toast.makeText(MainActivity.this, "File picker unavailable", Toast.LENGTH_SHORT).show();
                    return false;
                }
                return true;
            }
        });

        webView.loadUrl("file:///android_asset/index29.html");
    }

    private void enterCoverFromNative(int attempt) {
        if (webView == null || isFinishing()) return;

        final String js = "(function(){try{" +
                "var gate=document.getElementById('kinetiqCleanGate');" +
                "var cover=document.getElementById('style2Cover');" +
                "var main=document.getElementById('mainApp');" +
                "var builder=document.getElementById('builder');" +
                "var s=window.__KINETIQ_STATE__||window.S||null;" +
                "if(!s){try{s=JSON.parse(localStorage.getItem('personalTrainer.beta2')||'{}')}catch(_){s={}}}" +
                "var built=!!s.built;" +
                "if(built){" +
                    "if(window.PT29&&typeof window.PT29.showMain==='function')window.PT29.showMain('home');" +
                    "else if(typeof window.showMain==='function')window.showMain('home');" +
                    "else{if(builder)builder.classList.add('hidden');if(main)main.classList.remove('hidden');}" +
                "}else{" +
                    "if(typeof window.showBuilder==='function')window.showBuilder(Number(s.builderStep)||0);" +
                    "else{if(main)main.classList.add('hidden');if(builder)builder.classList.remove('hidden');}" +
                "}" +
                "if(cover)cover.classList.add('hidden');" +
                "if(gate)gate.classList.add('hidden');" +
                "document.documentElement.classList.add('kinetiq-app-open');" +
                "document.body.classList.add('kinetiq-app-open');" +
                "var visible=built?(!!main&&!main.classList.contains('hidden')):(!!builder&&!builder.classList.contains('hidden'));" +
                "return visible?'entered':'not-ready';" +
                "}catch(e){return 'error';}})()";

        webView.evaluateJavascript(js, value -> {
            if ("\"entered\"".equals(value)) {
                nativeEntryCommitted = true;
                setCoverMode(false);
                return;
            }
            if (attempt < 60 && webView != null) {
                webView.postDelayed(() -> enterCoverFromNative(attempt + 1), 100L);
            }
        });
    }

    private boolean isCoverQTouch(MotionEvent event) {
        if (root == null || event == null || !coverVisible) return false;
        int w = root.getWidth();
        int h = root.getHeight();
        if (w <= 0 || h <= 0) return false;

        // Q position in the 941x2039 A54 master cover.
        float cx = w * 0.504f;
        float cy = h * 0.751f;
        float radius = w * 0.155f;
        float dx = event.getX() - cx;
        float dy = event.getY() - cy;
        return (dx * dx + dy * dy) <= (radius * radius);
    }

    @Override public boolean dispatchTouchEvent(MotionEvent event) {
        if (coverVisible && event != null && isCoverQTouch(event)) {
            int action = event.getActionMasked();
            if (action == MotionEvent.ACTION_DOWN && nativeCoverImage != null) {
                nativeCoverImage.animate().alpha(0.94f).setDuration(70L).start();
            }
            if (action == MotionEvent.ACTION_UP) {
                if (nativeCoverImage != null) {
                    nativeCoverImage.animate().alpha(1f).setDuration(110L).start();
                }
                if (nativeCover != null) nativeCover.performHapticFeedback(android.view.HapticFeedbackConstants.KEYBOARD_TAP);
                enterCoverFromNative(0);
            }
            if (action == MotionEvent.ACTION_CANCEL && nativeCoverImage != null) {
                nativeCoverImage.animate().alpha(1f).setDuration(80L).start();
            }
            return true;
        }
        return super.dispatchTouchEvent(event);
    }

    private void applyImmersiveCover() {
        if (!coverVisible || root == null) return;

        root.setPadding(0, 0, 0, 0);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);

        if (Build.VERSION.SDK_INT >= 29) {
            getWindow().setStatusBarContrastEnforced(false);
            getWindow().setNavigationBarContrastEnforced(false);
        }

        int legacyFlags =
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
                View.SYSTEM_UI_FLAG_FULLSCREEN |
                View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE;
        getWindow().getDecorView().setSystemUiVisibility(legacyFlags);

        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                controller.hide(WindowInsets.Type.systemBars());
            }
        }
    }

    private void scheduleImmersiveCover() {
        if (root == null) return;
        root.post(this::applyImmersiveCover);
        root.postDelayed(this::applyImmersiveCover, 120L);
        root.postDelayed(this::applyImmersiveCover, 420L);
        root.postDelayed(this::applyImmersiveCover, 1000L);
    }

    private void setCoverMode(boolean visible) {
        coverVisible = visible;
        if (root == null) return;

        if (visible) {
            if (nativeCover != null) nativeCover.setVisibility(View.GONE);
            if (coverTapView != null) coverTapView.setVisibility(View.GONE);
            scheduleImmersiveCover();
        } else {
            if (nativeCover != null) nativeCover.setVisibility(View.GONE);
            if (coverTapView != null) coverTapView.setVisibility(View.GONE);

            getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
            if (Build.VERSION.SDK_INT >= 30) {
                WindowInsetsController controller = getWindow().getInsetsController();
                if (controller != null) controller.show(WindowInsets.Type.systemBars());
            }
            getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
            getWindow().setStatusBarColor(Color.BLACK);
            getWindow().setNavigationBarColor(Color.BLACK);
            root.setPadding(0, lastInsetTop, 0, lastInsetBottom);
            root.requestApplyInsets();
        }
    }

    private void positionCoverTap() {
        // 3.0.12 uses Activity.dispatchTouchEvent() against the Q region.
    }

    private void verifyRuntimeReady(WebView view, int attempt) {
        if (view == null || isFinishing()) return;
        final String probe = "(function(){try{" +
                "var q=!!document.getElementById('kinetiqCleanGateQ');" +
                "var state=!!(window.__KINETIQ_STATE__||window.S);" +
                "var builder=(typeof window.showBuilder==='function');" +
                "var main=(typeof window.showMain==='function')||(window.PT29&&typeof window.PT29.showMain==='function');" +
                "var entry=(window.__KINETIQ_ENTRY_READY__===true)||(typeof window.KINETIQ_CLEAN_GATE_ENTER==='function');" +
                "return (q&&state&&builder&&main&&entry)?'ready':'warming';" +
                "}catch(e){return 'warming';}})()";
        view.evaluateJavascript(probe, value -> {
            if ("\"ready\"".equals(value)) return;
            if (attempt + 1 < RUNTIME_MAX_ATTEMPTS) {
                view.postDelayed(() -> verifyRuntimeReady(view, attempt + 1), RUNTIME_RETRY_MS);
            }
            // No blocking/toast failure state: native Q entry remains available independently.
        });
    }

    private class PTBridge {
        @JavascriptInterface public void setCoverVisible(boolean visible) {
            runOnUiThread(() -> setCoverMode(visible));
        }
        @JavascriptInterface public void startLocation() { runOnUiThread(() -> beginLocation()); }
        @JavascriptInterface public void stopLocation() { runOnUiThread(() -> endLocation()); }
        @JavascriptInterface public void speak(String text) {
            if (text == null || text.trim().isEmpty()) return;
            runOnUiThread(() -> {
                if (ttsReady) tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "ilia-coach-v7");
            });
        }
        @JavascriptInterface public boolean hasLocationPermission() {
            return Build.VERSION.SDK_INT < 23 || checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        }
    }

    private void beginLocation() {
        if (Build.VERSION.SDK_INT >= 23 && checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, LOCATION_PERMISSION);
            sendGpsStatus("Location permission required");
            return;
        }
        if (locationManager == null) { sendGpsStatus("GPS unavailable"); return; }
        boolean any = false;
        try {
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 1000L, 1.5f, locationListener);
                any = true;
            }
        } catch (SecurityException ignored) { }
        try {
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 1500L, 2.5f, locationListener);
                any = true;
            }
        } catch (SecurityException ignored) { }
        locationRunning = any;
        sendGpsStatus(any ? "GPS tracking started" : "Enable Location/GPS to start tracking");
        if (!any) {
            try { startActivity(new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS)); } catch (Exception ignored) { }
        }
    }

    private void endLocation() {
        if (locationManager != null && locationRunning) {
            try { locationManager.removeUpdates(locationListener); } catch (SecurityException ignored) { }
        }
        locationRunning = false;
    }

    private void sendLocation(Location l) {
        if (webView == null || l == null) return;
        final String js = String.format(Locale.US,
            "window.PT25&&window.PT25.onLocation(%1$.7f,%2$.7f,%3$.4f,%4$.2f,%5$d)",
            l.getLatitude(), l.getLongitude(), l.hasSpeed() ? l.getSpeed() : 0f, l.hasAccuracy() ? l.getAccuracy() : 0f, System.currentTimeMillis());
        runOnUiThread(() -> webView.evaluateJavascript(js, null));
    }

    private void sendGpsStatus(String status) {
        if (webView == null) return;
        final String js = "window.PT25&&window.PT25.onGpsStatus(" + JSONObject.quote(status) + ")";
        runOnUiThread(() -> webView.evaluateJavascript(js, null));
    }

    @Override public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == LOCATION_PERMISSION) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) beginLocation();
            else sendGpsStatus("Location permission denied");
        }
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER && fileCallback != null) {
            Uri[] out = null;
            if (resultCode == RESULT_OK && data != null) {
                if (data.getClipData() != null) {
                    int n = data.getClipData().getItemCount();
                    out = new Uri[n];
                    for (int k = 0; k < n; k++) out[k] = data.getClipData().getItemAt(k).getUri();
                } else if (data.getData() != null) out = new Uri[]{data.getData()};
            }
            fileCallback.onReceiveValue(out);
            fileCallback = null;
        }
    }

    @Override public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus && coverVisible) scheduleImmersiveCover();
    }

    @Override protected void onResume() {
        super.onResume();
        if (coverVisible) scheduleImmersiveCover();
    }

    @Override protected void onPostResume() {
        super.onPostResume();
        if (coverVisible) scheduleImmersiveCover();
    }

    @Override protected void onPause() {
        super.onPause();
        if (webView != null) webView.evaluateJavascript("document.querySelectorAll('video').forEach(v=>v.pause())", null);
    }

    @Override protected void onDestroy() {
        endLocation();
        if (tts != null) { tts.stop(); tts.shutdown(); }
        if (webView != null) webView.destroy();
        super.onDestroy();
    }

    @Override public void onBackPressed() {
        webView.evaluateJavascript("(function(){try{return window.ptHandleBack?window.ptHandleBack():'exit'}catch(e){return 'exit'}})()", value -> {
            if ("\"exit\"".equals(value) || "null".equals(value)) MainActivity.super.onBackPressed();
        });
    }
}
