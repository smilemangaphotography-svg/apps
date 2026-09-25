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
import android.widget.ScrollView;
import android.widget.TextView;
import android.health.connect.HealthConnectManager;
import android.health.connect.HealthConnectException;
import android.health.connect.ReadRecordsRequestUsingFilters;
import android.health.connect.ReadRecordsResponse;
import android.health.connect.TimeInstantRangeFilter;
import android.health.connect.datatypes.DataOrigin;
import android.health.connect.datatypes.DistanceRecord;
import android.health.connect.datatypes.ExerciseSessionRecord;
import android.health.connect.datatypes.HeartRateRecord;
import android.health.connect.datatypes.SpeedRecord;
import android.health.connect.datatypes.StepsCadenceRecord;
import android.os.OutcomeReceiver;

import org.json.JSONObject;
import org.json.JSONArray;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public class MainActivity extends Activity {
    private WebView webView;
    private FrameLayout root;
    private ValueCallback<Uri[]> fileCallback;
    private static final int FILE_CHOOSER = 501;
    private static final int LOCATION_PERMISSION = 502;
    private static final String GARMIN_CONNECT_PACKAGE = "com.garmin.android.apps.connectmobile";
    private static final String[] HEALTH_READ_PERMISSIONS = new String[]{
        "android.permission.health.READ_EXERCISE",
        "android.permission.health.READ_HEART_RATE",
        "android.permission.health.READ_DISTANCE",
        "android.permission.health.READ_SPEED",
        "android.permission.health.READ_STEPS"
    };
    private static final int RUNTIME_MAX_ATTEMPTS = 18;
    private static final long RUNTIME_RETRY_MS = 300L;
    private LocationManager locationManager;
    private boolean locationRunning = false;
    private TextToSpeech tts;
    private boolean ttsReady = false;
    private float ttsVolume = 1.0f;
    private float ttsRate = 1.02f;

    private final LocationListener locationListener = new LocationListener() {
        @Override public void onLocationChanged(Location location) { sendLocation(location); }
        @Override public void onProviderEnabled(String provider) { sendGpsStatus("GPS ready"); }
        @Override public void onProviderDisabled(String provider) { sendGpsStatus("Location provider disabled"); }
        @Override public void onStatusChanged(String provider, int status, Bundle extras) { }
    };

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        if (Intent.ACTION_VIEW_PERMISSION_USAGE.equals(getIntent() != null ? getIntent().getAction() : null)) {
            showHealthPermissionRationale();
            return;
        }
        getWindow().setStatusBarColor(Color.rgb(6,16,11));
        getWindow().setNavigationBarColor(Color.rgb(6,16,11));
        if (Build.VERSION.SDK_INT >= 30) getWindow().setDecorFitsSystemWindows(false);

        root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(6,16,11));
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(6,16,11));
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
        WebView.setWebContentsDebuggingEnabled(false);

        locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                int result = tts.setLanguage(Locale.UK);
                ttsReady = result != TextToSpeech.LANG_MISSING_DATA && result != TextToSpeech.LANG_NOT_SUPPORTED;
                if (ttsReady) tts.setSpeechRate(ttsRate);
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

        webView.loadUrl("file:///android_asset/system.html");
    }

    private void verifyRuntimeReady(WebView view, int attempt) {
        if (view == null || isFinishing()) return;
        final String probe = "(function(){try{" +
                "var p=window.__ILIA_RUNTIME_PREFLIGHT__||'missing';" +
                "var s=window.__PT_STYLE29__||'missing';" +
                "var v=window.__ILIA_V7__||'missing';" +
                "var l=window.__ILIA_V73_LIBRARY_TOOLS__||'missing';" +
                "var b=window.__KINETIQ_BETA303__||'missing';" +
                "var y=window.__KINETIQ_SYSTEM_BETA__||'missing';" +
                "var ui=window.__KINETIQ_SYSTEM_UI__||'missing';" +
                "return (p==='ready'&&s==='locked-all-in-one-2.9'&&v==='3.0.3-calendar-ai-ready'&&l&&b==='KINETIQ-3.0.3-approved-beta-1'&&y==='KINETIQ-3.0.3-system-beta-2'&&ui==='KINETIQ-SYSTEM-UI-2')?'ready':(p+'|'+s+'|'+v+'|'+l+'|'+b+'|'+y+'|'+ui);" +
                "}catch(e){return 'error';}})()";
        view.evaluateJavascript(probe, value -> {
            if ("\"ready\"".equals(value)) return;
            if (attempt + 1 < RUNTIME_MAX_ATTEMPTS) {
                view.postDelayed(() -> verifyRuntimeReady(view, attempt + 1), RUNTIME_RETRY_MS);
            } else {
                Toast.makeText(MainActivity.this, "KINETIQ SYSTEM BETA 3.0.3 runtime failed to initialize", Toast.LENGTH_LONG).show();
            }
        });
    }

    private class PTBridge {
        @JavascriptInterface public void startLocation() { runOnUiThread(() -> beginLocation()); }
        @JavascriptInterface public void stopLocation() { runOnUiThread(() -> endLocation()); }
        @JavascriptInterface public void speak(String text) {
            if (text == null || text.trim().isEmpty()) return;
            runOnUiThread(() -> {
                if (ttsReady) {
                    Bundle params = new Bundle();
                    params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, ttsVolume);
                    tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, "kinetiq-coach");
                }
            });
        }
        @JavascriptInterface public void stopTts() {
            runOnUiThread(() -> {
                if (tts != null) tts.stop();
            });
        }
        @JavascriptInterface public void setTtsVolume(double value) {
            ttsVolume = (float)Math.max(0.2d, Math.min(1.0d, value));
        }
        @JavascriptInterface public void setTtsRate(double value) {
            ttsRate = (float)Math.max(0.75d, Math.min(1.25d, value));
            runOnUiThread(() -> { if (ttsReady) tts.setSpeechRate(ttsRate); });
        }
        @JavascriptInterface public String getTtsVoices() {
            if (!ttsReady || tts == null || Build.VERSION.SDK_INT < 21) return "[]";
            try {
                org.json.JSONArray out = new org.json.JSONArray();
                Set<android.speech.tts.Voice> voices = tts.getVoices();
                if (voices != null) {
                    for (android.speech.tts.Voice voice : voices) {
                        if (voice != null && voice.getLocale() != null && voice.getLocale().getLanguage().equals(Locale.ENGLISH.getLanguage())) {
                            JSONObject row = new JSONObject();
                            row.put("name", voice.getName());
                            row.put("locale", voice.getLocale().toLanguageTag());
                            out.put(row);
                        }
                    }
                }
                return out.toString();
            } catch (Exception ignored) { return "[]"; }
        }
        @JavascriptInterface public boolean setTtsVoice(String voiceName) {
            if (!ttsReady || tts == null || voiceName == null || Build.VERSION.SDK_INT < 21) return false;
            try {
                Set<android.speech.tts.Voice> voices = tts.getVoices();
                if (voices != null) {
                    for (android.speech.tts.Voice voice : voices) {
                        if (voice != null && voiceName.equals(voice.getName())) {
                            final android.speech.tts.Voice selected = voice;
                            runOnUiThread(() -> tts.setVoice(selected));
                            return true;
                        }
                    }
                }
            } catch (Exception ignored) { }
            return false;
        }
        @JavascriptInterface public String getDeviceCapabilities() {
            try {
                JSONObject out = new JSONObject();
                boolean gps = Build.VERSION.SDK_INT < 23 || checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
                boolean garminInstalled = getPackageManager().getLaunchIntentForPackage(GARMIN_CONNECT_PACKAGE) != null;
                boolean healthAvailable = healthConnectAvailable();
                boolean healthGranted = healthAvailable && healthPermissionsGranted();
                out.put("phoneGpsPermission", gps);
                out.put("garminConnectInstalled", garminInstalled);
                out.put("healthConnectAvailable", healthAvailable);
                out.put("healthPermissionsGranted", healthGranted);
                out.put("garminDataBridge", healthAvailable);
                out.put("externalSensorBridge", false);
                out.put("garminConnectionMethod", "Health Connect");
                out.put("garminDataSourcePackage", GARMIN_CONNECT_PACKAGE);
                return out.toString();
            } catch (Exception ignored) {
                return "{\"phoneGpsPermission\":false,\"garminConnectInstalled\":false,\"healthConnectAvailable\":false,\"healthPermissionsGranted\":false,\"garminDataBridge\":false,\"externalSensorBridge\":false}";
            }
        }
        @JavascriptInterface public void openHealthConnectPermissions() {
            runOnUiThread(() -> openHealthConnectPermissionsUi());
        }
        @JavascriptInterface public void syncGarminHealth() {
            runOnUiThread(() -> syncGarminHealthInternal());
        }
        @JavascriptInterface public void requestLocationPermission() {
            runOnUiThread(() -> {
                if (Build.VERSION.SDK_INT < 23 || checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                    sendGpsStatus("GPS ready");
                    return;
                }
                requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, LOCATION_PERMISSION);
            });
        }
        @JavascriptInterface public void openGarminConnect() {
            runOnUiThread(() -> {
                try {
                    Intent launch = getPackageManager().getLaunchIntentForPackage(GARMIN_CONNECT_PACKAGE);
                    if (launch != null) { startActivity(launch); return; }
                    try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=com.garmin.android.apps.connectmobile"))); }
                    catch (Exception ignored) { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=com.garmin.android.apps.connectmobile"))); }
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Garmin Connect unavailable", Toast.LENGTH_SHORT).show();
                }
            });
        }
        @JavascriptInterface public boolean hasLocationPermission() {
            return Build.VERSION.SDK_INT < 23 || checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        }
    }

    private void showHealthPermissionRationale() {
        getWindow().setStatusBarColor(Color.rgb(6,16,11));
        getWindow().setNavigationBarColor(Color.rgb(6,16,11));
        ScrollView scroll = new ScrollView(this);
        scroll.setBackgroundColor(Color.rgb(6,16,11));
        TextView text = new TextView(this);
        int pad = (int)(24 * getResources().getDisplayMetrics().density);
        text.setPadding(pad, pad, pad, pad);
        text.setTextColor(Color.rgb(238,240,232));
        text.setTextSize(16f);
        text.setLineSpacing(0f, 1.25f);
        text.setText("KINETIQ · HEALTH DATA\n\nKINETIQ reads only the health and workout data you explicitly allow through Android Health Connect. In this System Beta, Health Connect is used to read Garmin-origin exercise sessions and supported metrics such as heart rate, distance, speed and step cadence when Garmin Connect has written those records.\n\nPhone GPS is separate and is used only for a live KINETIQ run after location permission is granted.\n\nKINETIQ does not sell this data, does not send it to advertisers, and does not fabricate unavailable Garmin metrics. You can revoke Health Connect access at any time in Android Settings.");
        scroll.addView(text, new ScrollView.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        setContentView(scroll);
    }

    private boolean healthConnectAvailable() {
        if (Build.VERSION.SDK_INT < 34) return false;
        try { return getSystemService(HealthConnectManager.class) != null; }
        catch (Throwable ignored) { return false; }
    }

    private boolean healthPermissionsGranted() {
        if (Build.VERSION.SDK_INT < 34) return false;
        for (String permission : HEALTH_READ_PERMISSIONS) {
            if (checkSelfPermission(permission) != PackageManager.PERMISSION_GRANTED) return false;
        }
        return true;
    }

    private void openHealthConnectPermissionsUi() {
        if (Build.VERSION.SDK_INT < 34 || !healthConnectAvailable()) {
            sendGarminState("DATA UNAVAILABLE");
            return;
        }
        try {
            Intent intent = new Intent(HealthConnectManager.ACTION_MANAGE_HEALTH_PERMISSIONS);
            intent.putExtra(Intent.EXTRA_PACKAGE_NAME, getPackageName());
            startActivity(intent);
            sendGarminState(healthPermissionsGranted() ? "CONNECTED" : "CONNECTING");
        } catch (Exception e) {
            sendGarminError("Unable to open Health Connect permissions");
        }
    }

    private void sendGarminState(String status) {
        if (webView == null) return;
        final String js = "window.KINETIQDeviceBridge&&window.KINETIQDeviceBridge.onGarminState(" + JSONObject.quote(status) + ")";
        runOnUiThread(() -> webView.evaluateJavascript(js, null));
    }

    private void sendGarminError(String message) {
        if (webView == null) return;
        final String js = "window.KINETIQDeviceBridge&&window.KINETIQDeviceBridge.onError(" + JSONObject.quote(message) + ")";
        runOnUiThread(() -> webView.evaluateJavascript(js, null));
    }

    private void sendGarminSyncComplete(JSONObject payload) {
        if (webView == null) return;
        final String js = "window.KINETIQDeviceBridge&&window.KINETIQDeviceBridge.onSyncComplete(" + payload.toString() + ")";
        runOnUiThread(() -> webView.evaluateJavascript(js, null));
    }

    private void syncGarminHealthInternal() {
        if (Build.VERSION.SDK_INT < 34 || !healthConnectAvailable()) {
            sendGarminState("DATA UNAVAILABLE");
            return;
        }
        if (!healthPermissionsGranted()) {
            sendGarminState("PERMISSION REQUIRED");
            return;
        }
        HealthConnectManager manager;
        try { manager = getSystemService(HealthConnectManager.class); }
        catch (Throwable e) { manager = null; }
        if (manager == null) {
            sendGarminState("DATA UNAVAILABLE");
            return;
        }
        sendGarminState("SYNCING");
        readGarminSessions(manager);
    }

    private DataOrigin garminOrigin() {
        return new DataOrigin.Builder().setPackageName(GARMIN_CONNECT_PACKAGE).build();
    }

    private TimeInstantRangeFilter timeRange(Instant start, Instant end) {
        return new TimeInstantRangeFilter.Builder().setStartTime(start).setEndTime(end).build();
    }

    private void readGarminSessions(HealthConnectManager manager) {
        final Instant end = Instant.now();
        final Instant start = end.minus(Duration.ofDays(14));
        ReadRecordsRequestUsingFilters<ExerciseSessionRecord> request =
            new ReadRecordsRequestUsingFilters.Builder<>(ExerciseSessionRecord.class)
                .addDataOrigins(garminOrigin())
                .setTimeRangeFilter(timeRange(start, end))
                .setAscending(false)
                .setPageSize(20)
                .build();
        manager.readRecords(request, getMainExecutor(), new OutcomeReceiver<ReadRecordsResponse<ExerciseSessionRecord>, HealthConnectException>() {
            @Override public void onResult(ReadRecordsResponse<ExerciseSessionRecord> response) {
                List<ExerciseSessionRecord> sessions = response.getRecords();
                if (sessions == null || sessions.isEmpty()) {
                    try {
                        JSONObject out = new JSONObject();
                        out.put("dataAvailable", false);
                        out.put("source", "Health Connect · Garmin Connect");
                        out.put("activities", new JSONArray());
                        out.put("metrics", new JSONObject());
                        sendGarminSyncComplete(out);
                    } catch (Exception e) { sendGarminError("Garmin sync completed without readable data"); }
                    return;
                }
                ExerciseSessionRecord latest = sessions.get(0);
                GarminSyncAccumulator acc = new GarminSyncAccumulator(latest, sessions);
                readGarminHeartRate(manager, latest, acc);
                readGarminDistance(manager, latest, acc);
                readGarminSpeed(manager, latest, acc);
                readGarminCadence(manager, latest, acc);
            }
            @Override public void onError(HealthConnectException error) {
                if (error != null && error.getErrorCode() == HealthConnectException.ERROR_SECURITY) sendGarminState("PERMISSION REQUIRED");
                else sendGarminError("Health Connect could not read Garmin activities");
            }
        });
    }

    private <T extends android.health.connect.datatypes.Record> ReadRecordsRequestUsingFilters<T> garminRequest(Class<T> type, Instant start, Instant end, int pageSize) {
        return new ReadRecordsRequestUsingFilters.Builder<>(type)
            .addDataOrigins(garminOrigin())
            .setTimeRangeFilter(timeRange(start, end))
            .setAscending(false)
            .setPageSize(pageSize)
            .build();
    }

    private void readGarminHeartRate(HealthConnectManager manager, ExerciseSessionRecord session, GarminSyncAccumulator acc) {
        manager.readRecords(garminRequest(HeartRateRecord.class, session.getStartTime(), session.getEndTime(), 100), getMainExecutor(),
            new OutcomeReceiver<ReadRecordsResponse<HeartRateRecord>, HealthConnectException>() {
                @Override public void onResult(ReadRecordsResponse<HeartRateRecord> response) {
                    long sum = 0, max = 0, latest = 0, count = 0;
                    for (HeartRateRecord record : response.getRecords()) {
                        for (HeartRateRecord.HeartRateSample sample : record.getSamples()) {
                            long bpm = sample.getBeatsPerMinute(); sum += bpm; count++; if (bpm > max) max = bpm;
                            if (latest == 0 || sample.getTime().isAfter(acc.latestHeartTime)) { latest = bpm; acc.latestHeartTime = sample.getTime(); }
                        }
                    }
                    try {
                        if (count > 0) { acc.metrics.put("heartRate", latest); acc.metrics.put("averageHeartRate", Math.round((double)sum / count)); acc.metrics.put("maxHeartRate", max); }
                    } catch (Exception ignored) { }
                    acc.finishOne();
                }
                @Override public void onError(HealthConnectException error) { acc.addError("heartRate", error); acc.finishOne(); }
            });
    }

    private void readGarminDistance(HealthConnectManager manager, ExerciseSessionRecord session, GarminSyncAccumulator acc) {
        manager.readRecords(garminRequest(DistanceRecord.class, session.getStartTime(), session.getEndTime(), 100), getMainExecutor(),
            new OutcomeReceiver<ReadRecordsResponse<DistanceRecord>, HealthConnectException>() {
                @Override public void onResult(ReadRecordsResponse<DistanceRecord> response) {
                    double meters = 0d;
                    for (DistanceRecord record : response.getRecords()) meters += record.getDistance().getInMeters();
                    try {
                        if (meters > 0d) {
                            double km = meters / 1000d; acc.metrics.put("distance", km);
                            long seconds = Math.max(1L, Duration.between(session.getStartTime(), session.getEndTime()).getSeconds());
                            acc.metrics.put("averagePace", seconds / km);
                        }
                    } catch (Exception ignored) { }
                    acc.finishOne();
                }
                @Override public void onError(HealthConnectException error) { acc.addError("distance", error); acc.finishOne(); }
            });
    }

    private void readGarminSpeed(HealthConnectManager manager, ExerciseSessionRecord session, GarminSyncAccumulator acc) {
        manager.readRecords(garminRequest(SpeedRecord.class, session.getStartTime(), session.getEndTime(), 100), getMainExecutor(),
            new OutcomeReceiver<ReadRecordsResponse<SpeedRecord>, HealthConnectException>() {
                @Override public void onResult(ReadRecordsResponse<SpeedRecord> response) {
                    double sum = 0d, latest = 0d; long count = 0; Instant latestTime = Instant.EPOCH;
                    for (SpeedRecord record : response.getRecords()) {
                        for (SpeedRecord.SpeedRecordSample sample : record.getSamples()) {
                            double speed = sample.getSpeed().getInMetersPerSecond(); sum += speed; count++;
                            if (sample.getTime().isAfter(latestTime)) { latest = speed; latestTime = sample.getTime(); }
                        }
                    }
                    try {
                        if (count > 0) { double avg = sum / count; acc.metrics.put("speed", latest); if (avg > 0.05d) acc.metrics.put("pace", 1000d / avg); }
                    } catch (Exception ignored) { }
                    acc.finishOne();
                }
                @Override public void onError(HealthConnectException error) { acc.addError("speed", error); acc.finishOne(); }
            });
    }

    private void readGarminCadence(HealthConnectManager manager, ExerciseSessionRecord session, GarminSyncAccumulator acc) {
        manager.readRecords(garminRequest(StepsCadenceRecord.class, session.getStartTime(), session.getEndTime(), 100), getMainExecutor(),
            new OutcomeReceiver<ReadRecordsResponse<StepsCadenceRecord>, HealthConnectException>() {
                @Override public void onResult(ReadRecordsResponse<StepsCadenceRecord> response) {
                    double sum = 0d, latest = 0d; long count = 0; Instant latestTime = Instant.EPOCH;
                    for (StepsCadenceRecord record : response.getRecords()) {
                        for (StepsCadenceRecord.StepsCadenceRecordSample sample : record.getSamples()) {
                            double rate = sample.getRate(); sum += rate; count++;
                            if (sample.getTime().isAfter(latestTime)) { latest = rate; latestTime = sample.getTime(); }
                        }
                    }
                    try {
                        if (count > 0) { acc.metrics.put("cadence", Math.round(latest)); acc.metrics.put("averageCadence", Math.round(sum / count)); }
                    } catch (Exception ignored) { }
                    acc.finishOne();
                }
                @Override public void onError(HealthConnectException error) { acc.addError("cadence", error); acc.finishOne(); }
            });
    }

    private final class GarminSyncAccumulator {
        final ExerciseSessionRecord latest;
        final JSONObject metrics = new JSONObject();
        final JSONArray activities = new JSONArray();
        final JSONObject errors = new JSONObject();
        int remaining = 4;
        Instant latestHeartTime = Instant.EPOCH;

        GarminSyncAccumulator(ExerciseSessionRecord latestSession, List<ExerciseSessionRecord> sessions) {
            latest = latestSession;
            try {
                metrics.put("duration", Math.max(0L, Duration.between(latest.getStartTime(), latest.getEndTime()).getSeconds()));
                metrics.put("activityType", latest.getExerciseType());
                metrics.put("routeAvailable", latest.hasRoute());
                metrics.put("activityTitle", latest.getTitle() == null ? "Garmin activity" : latest.getTitle().toString());
                metrics.put("startTime", latest.getStartTime().toString());
                int max = Math.min(8, sessions.size());
                for (int i = 0; i < max; i++) {
                    ExerciseSessionRecord session = sessions.get(i);
                    JSONObject row = new JSONObject();
                    row.put("title", session.getTitle() == null ? "Garmin activity" : session.getTitle().toString());
                    row.put("type", session.getExerciseType());
                    row.put("start", session.getStartTime().toString());
                    row.put("end", session.getEndTime().toString());
                    row.put("duration", Math.max(0L, Duration.between(session.getStartTime(), session.getEndTime()).getSeconds()));
                    row.put("routeAvailable", session.hasRoute());
                    activities.put(row);
                }
            } catch (Exception ignored) { }
        }

        void addError(String metric, HealthConnectException error) {
            try { errors.put(metric, error == null ? "unavailable" : String.valueOf(error.getErrorCode())); }
            catch (Exception ignored) { }
        }

        void finishOne() {
            remaining--;
            if (remaining > 0) return;
            try {
                JSONObject out = new JSONObject();
                out.put("dataAvailable", activities.length() > 0);
                out.put("source", "Health Connect · Garmin Connect");
                out.put("metrics", metrics);
                out.put("activities", activities);
                if (errors.length() > 0) out.put("unavailableMetrics", errors);
                sendGarminSyncComplete(out);
            } catch (Exception e) { sendGarminError("Garmin sync result could not be prepared"); }
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
        if (webView == null) { super.onBackPressed(); return; }
        webView.evaluateJavascript("(function(){try{return window.ptHandleBack?window.ptHandleBack():'exit'}catch(e){return 'exit'}})()", value -> {
            if ("\"exit\"".equals(value) || "null".equals(value)) MainActivity.super.onBackPressed();
        });
    }
}
