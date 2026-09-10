package com.ilia.photomasterai;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.UUID;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

public class MainActivity extends Activity {
    private static final int FILE_CHOOSER_REQUEST = 1001;
    private static final String PREFS = "pmai_secure";
    private static final String KEY_ALIAS = "pmai_openai_key";
    private static final String PREF_KEY = "api_key_cipher";
    private static final String PREF_IV = "api_key_iv";

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

    private SecretKey getOrCreateKey() throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore");
        store.load(null);
        if (store.containsAlias(KEY_ALIAS)) {
            return ((KeyStore.SecretKeyEntry) store.getEntry(KEY_ALIAS, null)).getSecretKey();
        }
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setRandomizedEncryptionRequired(true)
                .build());
        return generator.generateKey();
    }

    private boolean storeApiKey(String value) {
        try {
            SecretKey key = getOrCreateKey();
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key);
            byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
            getSharedPreferences(PREFS, MODE_PRIVATE).edit()
                    .putString(PREF_KEY, Base64.encodeToString(encrypted, Base64.NO_WRAP))
                    .putString(PREF_IV, Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP))
                    .apply();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private String readApiKey() {
        try {
            SharedPreferences p = getSharedPreferences(PREFS, MODE_PRIVATE);
            String enc = p.getString(PREF_KEY, null);
            String iv = p.getString(PREF_IV, null);
            if (enc == null || iv == null) return null;
            SecretKey key = getOrCreateKey();
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(128, Base64.decode(iv, Base64.NO_WRAP)));
            byte[] plain = cipher.doFinal(Base64.decode(enc, Base64.NO_WRAP));
            return new String(plain, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return null;
        }
    }

    private void clearApiKeyInternal() {
        getSharedPreferences(PREFS, MODE_PRIVATE).edit().remove(PREF_KEY).remove(PREF_IV).apply();
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

    private String sizeForRatio(String ratio) {
        if ("1:1".equals(ratio)) return "1024x1024";
        if ("4:5".equals(ratio) || "9:16".equals(ratio)) return "1024x1536";
        if ("16:9".equals(ratio)) return "1536x1024";
        return "auto";
    }

    private void writeTextPart(DataOutputStream out, String boundary, String name, String value) throws Exception {
        out.writeBytes("--" + boundary + "\r\n");
        out.writeBytes("Content-Disposition: form-data; name=\"" + name + "\"\r\n\r\n");
        out.write(value.getBytes(StandardCharsets.UTF_8));
        out.writeBytes("\r\n");
    }

    private void writeImagePart(DataOutputStream out, String boundary, String name, String filename, DataImage img) throws Exception {
        out.writeBytes("--" + boundary + "\r\n");
        out.writeBytes("Content-Disposition: form-data; name=\"" + name + "\"; filename=\"" + filename + "\"\r\n");
        out.writeBytes("Content-Type: " + img.mime + "\r\n\r\n");
        out.write(img.bytes);
        out.writeBytes("\r\n");
    }

    private String readStream(InputStream stream) throws Exception {
        if (stream == null) return "";
        BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8));
        StringBuilder b = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) b.append(line);
        return b.toString();
    }

    private JSONObject callBackend(JSONObject request) throws Exception {
        String endpoint = BuildConfig.AI_ENDPOINT == null ? "" : BuildConfig.AI_ENDPOINT.trim();
        URL url = new URL(endpoint);
        HttpURLConnection c = (HttpURLConnection) url.openConnection();
        c.setRequestMethod("POST");
        c.setConnectTimeout(20000);
        c.setReadTimeout(180000);
        c.setDoOutput(true);
        c.setRequestProperty("Content-Type", "application/json; charset=utf-8");
        byte[] body = request.toString().getBytes(StandardCharsets.UTF_8);
        try (OutputStream out = c.getOutputStream()) { out.write(body); }
        int code = c.getResponseCode();
        String raw = readStream(code >= 200 && code < 300 ? c.getInputStream() : c.getErrorStream());
        JSONObject json = raw.isEmpty() ? new JSONObject() : new JSONObject(raw);
        if (code < 200 || code >= 300) throw new Exception(json.optString("error", "AI backend failed (" + code + ")."));
        return json;
    }

    private JSONObject callOpenAI(JSONObject request) throws Exception {
        String apiKey = readApiKey();
        if (apiKey == null || apiKey.trim().isEmpty()) throw new Exception("OpenAI API key is not configured.");

        String boundary = "----PMAI" + UUID.randomUUID().toString().replace("-", "");
        HttpURLConnection c = (HttpURLConnection) new URL("https://api.openai.com/v1/images/edits").openConnection();
        c.setRequestMethod("POST");
        c.setConnectTimeout(20000);
        c.setReadTimeout(180000);
        c.setDoOutput(true);
        c.setRequestProperty("Authorization", "Bearer " + apiKey);
        c.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);
        c.setRequestProperty("Accept", "application/json");

        JSONObject settings = request.optJSONObject("settings");
        String ratio = settings == null ? "Original" : settings.optString("ratio", "Original");
        String quality = settings == null ? "high" : settings.optString("quality", "high");
        if (!(quality.equals("medium") || quality.equals("high") || quality.equals("xhigh"))) quality = "high";

        try (DataOutputStream out = new DataOutputStream(c.getOutputStream())) {
            writeTextPart(out, boundary, "model", "gpt-image-2.5-sunburst");
            writeTextPart(out, boundary, "prompt", request.optString("prompt", "Professional realistic photo edit."));
            writeTextPart(out, boundary, "quality", quality);
            writeTextPart(out, boundary, "size", sizeForRatio(ratio));
            writeTextPart(out, boundary, "output_format", "png");
            writeTextPart(out, boundary, "moderation", "auto");
            writeImagePart(out, boundary, "image[]", "source.jpg", decodeDataUrl(request.getString("source_image")));
            JSONArray refs = request.optJSONArray("reference_images");
            if (refs != null) {
                for (int i = 0; i < refs.length() && i < 5; i++) {
                    writeImagePart(out, boundary, "image[]", "reference-" + (i + 1) + ".jpg", decodeDataUrl(refs.getString(i)));
                }
            }
            out.writeBytes("--" + boundary + "--\r\n");
            out.flush();
        }

        int code = c.getResponseCode();
        String requestId = c.getHeaderField("x-request-id");
        String raw = readStream(code >= 200 && code < 300 ? c.getInputStream() : c.getErrorStream());
        JSONObject upstream;
        try { upstream = new JSONObject(raw); } catch (Exception parse) { upstream = new JSONObject(); }
        if (code < 200 || code >= 300) {
            JSONObject e = upstream.optJSONObject("error");
            String message = e == null ? "OpenAI image edit failed (" + code + ")." : e.optString("message", "OpenAI image edit failed.");
            throw new Exception(message + (requestId == null ? "" : " [" + requestId + "]"));
        }

        JSONArray images = new JSONArray();
        JSONArray data = upstream.optJSONArray("data");
        if (data != null) {
            for (int i = 0; i < data.length(); i++) {
                JSONObject item = data.optJSONObject(i);
                if (item == null) continue;
                String b64 = item.optString("b64_json", "");
                if (!b64.isEmpty()) images.put(b64);
            }
        }
        if (images.length() == 0) throw new Exception("The image service returned no image data.");
        JSONObject result = new JSONObject();
        result.put("images", images);
        if (requestId != null) result.put("request_id", requestId);
        return result;
    }

    private void callback(String requestId, JSONObject payload) {
        String js = "window.__nativeAiResult(" + JSONObject.quote(requestId) + "," + JSONObject.quote(payload.toString()) + ")";
        runOnUiThread(() -> webView.evaluateJavascript(js, null));
    }

    public class NativeBridge {
        @JavascriptInterface
        public String getConnectionStatus() {
            try {
                JSONObject j = new JSONObject();
                String endpoint = BuildConfig.AI_ENDPOINT == null ? "" : BuildConfig.AI_ENDPOINT.trim();
                if (!endpoint.isEmpty()) {
                    j.put("ok", true); j.put("type", "backend");
                } else {
                    String apiKey = readApiKey();
                    boolean ok = apiKey != null && !apiKey.trim().isEmpty();
                    j.put("ok", ok); j.put("type", ok ? "direct" : "none");
                }
                return j.toString();
            } catch (Exception e) { return "{\"ok\":false,\"type\":\"none\"}"; }
        }

        @JavascriptInterface
        public boolean setApiKey(String key) {
            if (key == null || key.trim().length() < 20) return false;
            return storeApiKey(key.trim());
        }

        @JavascriptInterface
        public void clearApiKey() { clearApiKeyInternal(); }

        @JavascriptInterface
        public void editImage(String requestId, String requestJson) {
            new Thread(() -> {
                try {
                    JSONObject req = new JSONObject(requestJson);
                    String endpoint = BuildConfig.AI_ENDPOINT == null ? "" : BuildConfig.AI_ENDPOINT.trim();
                    JSONObject result = endpoint.isEmpty() ? callOpenAI(req) : callBackend(req);
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
