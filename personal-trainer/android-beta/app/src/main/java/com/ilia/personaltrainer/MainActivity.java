package com.ilia.personaltrainer;

import android.app.Activity;
import android.os.Bundle;
import android.os.Build;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Insets;
import android.net.Uri;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

public class MainActivity extends Activity {
    private WebView webView;
    private FrameLayout root;
    private ValueCallback<Uri[]> fileCallback;
    private static final int FILE_CHOOSER = 501;

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
        root.addView(webView, new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));
        setContentView(root);

        root.setOnApplyWindowInsetsListener((v, windowInsets) -> {
            int top;
            int bottom;
            if (Build.VERSION.SDK_INT >= 30) {
                Insets bars = windowInsets.getInsets(
                    WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout()
                );
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
        WebView.setWebContentsDebuggingEnabled(true);

        webView.setWebViewClient(new WebViewClient() {
            @Override public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                view.evaluateJavascript(
                    "(function(){return [(window.__PT_BETA2__||'missing'),(window.__PT_V21__||'missing'),(window.__PT_STYLE2__||'missing'),(window.__PT_STYLE23__||'missing'),(window.__PT_STYLE24__||'missing')].join('|');})()",
                    value -> {
                        if (value == null || value.contains("missing")) {
                            Toast.makeText(MainActivity.this, "Personal Trainer Style 2.4 runtime failed to initialize", Toast.LENGTH_LONG).show();
                        }
                    }
                );
            }

            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                String scheme = u.getScheme() == null ? "" : u.getScheme();
                if ("http".equals(scheme) || "https".equals(scheme) || "spotify".equals(scheme)) {
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

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER && fileCallback != null) {
            Uri[] out = null;
            if (resultCode == RESULT_OK && data != null) {
                if (data.getClipData() != null) {
                    int n = data.getClipData().getItemCount();
                    out = new Uri[n];
                    for (int k = 0; k < n; k++) out[k] = data.getClipData().getItemAt(k).getUri();
                } else if (data.getData() != null) {
                    out = new Uri[]{data.getData()};
                }
            }
            fileCallback.onReceiveValue(out);
            fileCallback = null;
        }
    }

    @Override public void onBackPressed() {
        webView.evaluateJavascript(
            "(function(){try{var c=document.getElementById('style2Cover');if(c&&!c.classList.contains('hidden'))return 'exit';return window.ptHandleBack?window.ptHandleBack():'exit'}catch(e){return 'exit'}})()",
            value -> {
                if ("\"exit\"".equals(value) || "null".equals(value)) MainActivity.super.onBackPressed();
            }
        );
    }
}
