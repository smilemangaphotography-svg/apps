package com.ilia.photomasterai;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

public class BetaActivity extends MainActivity {
    private WebView patchedWebView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        View root = findViewById(android.R.id.content);
        patchedWebView = findWebView(root);
        if (patchedWebView == null) return;

        patchedWebView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        patchedWebView.setOnApplyWindowInsetsListener((v, insets) -> {
            int bottom = insets.getSystemWindowInsetBottom();
            v.setPadding(0, 0, 0, Math.max(0, bottom));
            return insets;
        });
        patchedWebView.requestApplyInsets();
        patchedWebView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                injectAsset("beta011.css", true);
                injectAsset("beta011.js", false);
                injectAsset("beta012.css", true);
                injectAsset("beta012.js", false);
                injectAsset("beta013.css", true);
                injectAsset("beta013.js", false);
                injectAsset("beta014.css", true);
                injectAsset("beta014.js", false);
                injectAsset("beta015.css", true);
                injectAsset("beta015.js", false);
            }
        });
        patchedWebView.reload();
    }

    private WebView findWebView(View view) {
        if (view == null) return null;
        if (view instanceof WebView) return (WebView) view;
        if (view instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) view;
            for (int i = 0; i < group.getChildCount(); i++) {
                WebView found = findWebView(group.getChildAt(i));
                if (found != null) return found;
            }
        }
        return null;
    }

    private String readAsset(String name) throws Exception {
        StringBuilder out = new StringBuilder();
        try (BufferedReader r = new BufferedReader(new InputStreamReader(getAssets().open(name), StandardCharsets.UTF_8))) {
            String line;
            while ((line = r.readLine()) != null) out.append(line).append('\n');
        }
        return out.toString();
    }

    private void injectAsset(String name, boolean css) {
        try {
            String content = readAsset(name);
            String js;
            if (css) {
                js = "(function(){var s=document.createElement('style');s.textContent=" + JSONObject.quote(content) + ";document.head.appendChild(s);})();";
            } else {
                js = content;
            }
            patchedWebView.evaluateJavascript(js, null);
        } catch (Exception ignored) { }
    }
}
