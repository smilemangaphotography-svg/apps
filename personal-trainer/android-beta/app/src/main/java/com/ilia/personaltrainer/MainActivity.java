package com.ilia.personaltrainer;

import android.Manifest;
import android.app.Activity;
import android.os.Bundle;
import android.os.Build;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Insets;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.net.Uri;
import android.provider.Settings;
import android.speech.tts.TextToSpeech;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import org.json.JSONObject;

import java.util.Locale;

public class MainActivity extends Activity {
    private WebView webView;
    private FrameLayout root;
    private ValueCallback<Uri[]> fileCallback;
    private static final int FILE_CHOOSER = 501;
    private static final int LOCATION_PERMISSION = 502;
    private LocationManager locationManager;
    private boolean locationRunning = false;
    private TextToSpeech tts;
    private boolean ttsReady = false;

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
        webView.setBackgroundColor(Color.rgb(244,241,233));
        webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        root.addView(webView, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);

        root.setOnApplyWindowInsetsListener((v, windowInsets) -> {
            int top;
            int bottom;
            if (Build.VERSION.SDK_INT >= 30) {
                Insets bars = windowInsets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                top = bars.top;
                bottom = bars.bottom;
            } else {
                top = windowInsets.getSystemWindowInsetTop();
                bottom = windowInsets.getSystemWindowInsetBottom();
            }
            v.setPadding(0, top, 0, bottom);
            return windowInsets;
        });
        root.requestApplyInsets();

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
        WebView.setWebContentsDebuggingEnabled(true);

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
                view.evaluateJavascript(
                    "(function(){return [(window.__PT_BETA2__||'missing'),(window.__PT_STYLE25__||'missing'),(window.__PT_STYLE26__||'missing')].join('|');})()",
                    value -> {
                        if (value == null || value.contains("missing")) {
                            Toast.makeText(MainActivity.this, "Personal Trainer Beta 2.6 runtime failed to initialize", Toast.LENGTH_LONG).show();
                        }
                    }
                );
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

        webView.loadUrl("file:///android_asset/index2.html");
    }

    private class PTBridge {
        @JavascriptInterface public void startLocation() { runOnUiThread(() -> beginLocation()); }
        @JavascriptInterface public void stopLocation() { runOnUiThread(() -> endLocation()); }
        @JavascriptInterface public void speak(String text) {
            if (text == null || text.trim().isEmpty()) return;
            runOnUiThread(() -> {
                if (ttsReady) tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "pt25-coach");
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
        webView.evaluateJavascript(
            "(function(){try{var c=document.getElementById('style2Cover');if(c&&!c.classList.contains('hidden'))return 'exit';return window.ptHandleBack?window.ptHandleBack():'exit'}catch(e){return 'exit'}})()",
            value -> { if ("\"exit\"".equals(value) || "null".equals(value)) MainActivity.super.onBackPressed(); }
        );
    }
}
