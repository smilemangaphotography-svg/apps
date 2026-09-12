package com.ilia.photomasterai;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private static final int FILE_CHOOSER_REQUEST = 1001;

    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(android.graphics.Color.rgb(7, 16, 15));
        getWindow().setNavigationBarColor(android.graphics.Color.rgb(7, 16, 15));

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (filePathCallback != null) filePathCallback.onReceiveValue(null);
                filePathCallback = callback;
                try {
                    Intent intent = params.createIntent();
                    if (params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) {
                        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                    }
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST);
                    return true;
                } catch (Exception e) {
                    filePathCallback = null;
                    Toast.makeText(MainActivity.this, "Unable to open image picker.", Toast.LENGTH_SHORT).show();
                    return false;
                }
            }
        });

        webView.addJavascriptInterface(new NativeBridge(), "AndroidBridge");
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_CHOOSER_REQUEST || filePathCallback == null) return;
        Uri[] results = null;
        if (resultCode == RESULT_OK && data != null) {
            if (data.getClipData() != null) {
                int count = data.getClipData().getItemCount();
                results = new Uri[count];
                for (int i = 0; i < count; i++) results[i] = data.getClipData().getItemAt(i).getUri();
            } else if (data.getData() != null) {
                results = new Uri[]{data.getData()};
            }
        }
        filePathCallback.onReceiveValue(results);
        filePathCallback = null;
    }

    private static class DataImage {
        final byte[] bytes;
        final String mime;
        DataImage(byte[] bytes, String mime) { this.bytes = bytes; this.mime = mime; }
    }

    private DataImage decodeDataUrl(String dataUrl) throws Exception {
        if (dataUrl == null || !dataUrl.startsWith("data:") || !dataUrl.contains(",")) {
            throw new IllegalArgumentException("Invalid image data.");
        }
        int comma = dataUrl.indexOf(',');
        String header = dataUrl.substring(5, comma);
        String mime = header.split(";")[0];
        byte[] bytes = Base64.decode(dataUrl.substring(comma + 1), Base64.DEFAULT);
        return new DataImage(bytes, mime.isEmpty() ? "image/jpeg" : mime);
    }

    private String readStream(InputStream stream) throws Exception {
        if (stream == null) return "";
        BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8));
        StringBuilder b = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) b.append(line);
        return b.toString();
    }

    private String backendEndpoint() {
        return BuildConfig.AI_ENDPOINT == null ? "" : BuildConfig.AI_ENDPOINT.trim();
    }

    private String healthEndpoint() {
        String endpoint = backendEndpoint();
        if (endpoint.endsWith("/api/edit")) return endpoint.substring(0, endpoint.length() - 9) + "/api/health";
        if (endpoint.endsWith("/api/edit/")) return endpoint.substring(0, endpoint.length() - 10) + "/api/health";
        return endpoint;
    }

    private JSONObject callBackend(JSONObject request) throws Exception {
        String endpoint = backendEndpoint();
        if (endpoint.isEmpty()) throw new Exception("Secure AI backend is not configured for this build.");

        HttpURLConnection c = (HttpURLConnection) new URL(endpoint).openConnection();
        c.setRequestMethod("POST");
        c.setConnectTimeout(20000);
        c.setReadTimeout(180000);
        c.setDoOutput(true);
        c.setRequestProperty("Content-Type", "application/json; charset=utf-8");
        c.setRequestProperty("Accept", "application/json");
        c.setRequestProperty("X-PMAI-Client", BuildConfig.VERSION_NAME);
        byte[] body = request.toString().getBytes(StandardCharsets.UTF_8);
        try (OutputStream out = c.getOutputStream()) { out.write(body); }
        int code = c.getResponseCode();
        String raw = readStream(code >= 200 && code < 300 ? c.getInputStream() : c.getErrorStream());
        JSONObject json;
        try { json = raw.isEmpty() ? new JSONObject() : new JSONObject(raw); }
        catch (Exception parse) { json = new JSONObject(); }
        if (code < 200 || code >= 300) {
            throw new Exception(json.optString("error", "Secure AI backend failed (" + code + ")."));
        }
        return json;
    }

    private JSONObject checkBackend() {
        JSONObject result = new JSONObject();
        try {
            String endpoint = healthEndpoint();
            if (endpoint.isEmpty()) {
                result.put("ok", false);
                result.put("type", "backend");
                result.put("message", "Backend not configured");
                return result;
            }
            HttpURLConnection c = (HttpURLConnection) new URL(endpoint).openConnection();
            c.setRequestMethod("GET");
            c.setConnectTimeout(7000);
            c.setReadTimeout(7000);
            c.setRequestProperty("Accept", "application/json");
            c.setRequestProperty("X-PMAI-Client", BuildConfig.VERSION_NAME);
            int code = c.getResponseCode();
            String raw = readStream(code >= 200 && code < 300 ? c.getInputStream() : c.getErrorStream());
            JSONObject payload;
            try { payload = raw.isEmpty() ? new JSONObject() : new JSONObject(raw); }
            catch (Exception e) { payload = new JSONObject(); }
            result.put("ok", code >= 200 && code < 300 && payload.optBoolean("ok", true));
            result.put("type", "backend");
            result.put("message", payload.optString("message", code >= 200 && code < 300 ? "Secure AI cloud connected" : "Backend unavailable"));
        } catch (Exception e) {
            try {
                result.put("ok", false);
                result.put("type", "backend");
                result.put("message", "Backend unavailable");
            } catch (Exception ignored) {}
        }
        return result;
    }

    private void callback(String requestId, JSONObject payload) {
        String js = "window.__nativeAiResult(" + JSONObject.quote(requestId) + "," + JSONObject.quote(payload.toString()) + ")";
        runOnUiThread(() -> webView.evaluateJavascript(js, null));
    }

    private void backendStatusCallback(String requestId, JSONObject payload) {
        String js = "window.__nativeBackendStatus&&window.__nativeBackendStatus(" + JSONObject.quote(requestId) + "," + JSONObject.quote(payload.toString()) + ")";
        runOnUiThread(() -> webView.evaluateJavascript(js, null));
    }

    public class NativeBridge {
        @JavascriptInterface
        public String getConnectionStatus() {
            try {
                JSONObject j = new JSONObject();
                boolean configured = !backendEndpoint().isEmpty();
                j.put("ok", configured);
                j.put("configured", configured);
                j.put("type", "backend");
                j.put("message", configured ? "Secure backend configured" : "Secure backend not configured");
                return j.toString();
            } catch (Exception e) {
                return "{\"ok\":false,\"configured\":false,\"type\":\"backend\"}";
            }
        }

        @JavascriptInterface
        public void checkBackendStatus(String requestId) {
            new Thread(() -> backendStatusCallback(requestId, checkBackend()), "PMAI-HEALTH").start();
        }

        @JavascriptInterface
        public void editImage(String requestId, String requestJson) {
            new Thread(() -> {
                try {
                    JSONObject req = new JSONObject(requestJson);
                    JSONObject result = callBackend(req);
                    callback(requestId, result);
                } catch (Exception e) {
                    try {
                        JSONObject err = new JSONObject();
                        err.put("error", e.getMessage() == null ? "AI edit failed." : e.getMessage());
                        callback(requestId, err);
                    } catch (Exception ignored) {}
                }
            }, "PMAI-AI").start();
        }

        @JavascriptInterface
        public void saveImage(String dataUrl, String fileName) {
            try {
                DataImage img = decodeDataUrl(dataUrl);
                String mime = img.mime.contains("png") ? "image/png" : "image/jpeg";
                String extension = mime.equals("image/png") ? ".png" : ".jpg";
                if (fileName == null || fileName.trim().isEmpty()) fileName = "ShortcutEditor";
                if (!fileName.toLowerCase().endsWith(extension)) fileName += extension;
                ContentValues values = new ContentValues();
                values.put(MediaStore.Images.Media.DISPLAY_NAME, fileName);
                values.put(MediaStore.Images.Media.MIME_TYPE, mime);
                values.put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/ChatGPT Shortcut Editor");
                Uri uri = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
                if (uri == null) throw new IllegalStateException("Unable to create image entry.");
                try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                    if (out == null) throw new IllegalStateException("Unable to open image output.");
                    out.write(img.bytes);
                }
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "Saved to Pictures / ChatGPT Shortcut Editor", Toast.LENGTH_LONG).show());
            } catch (Exception e) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "Save failed: " + e.getMessage(), Toast.LENGTH_LONG).show());
            }
        }
    }

    @Override
    public void onBackPressed() {
        webView.evaluateJavascript("window.appBack?String(window.appBack()):'false'", value -> {
            if (value == null || value.contains("false")) MainActivity.super.onBackPressed();
        });
    }
}
