package com.ilia.frame.redesignbeta;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Rect;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.face.Face;
import com.google.mlkit.vision.face.FaceDetection;
import com.google.mlkit.vision.face.FaceDetector;
import com.google.mlkit.vision.face.FaceDetectorOptions;
import com.google.mlkit.vision.label.ImageLabel;
import com.google.mlkit.vision.label.ImageLabeler;
import com.google.mlkit.vision.label.ImageLabeling;
import com.google.mlkit.vision.label.defaults.ImageLabelerOptions;
import com.google.mlkit.vision.pose.Pose;
import com.google.mlkit.vision.pose.PoseDetection;
import com.google.mlkit.vision.pose.PoseDetector;
import com.google.mlkit.vision.pose.PoseLandmark;
import com.google.mlkit.vision.pose.defaults.PoseDetectorOptions;
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentation;
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentationResult;
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenter;
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenterOptions;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.nio.FloatBuffer;
import java.util.ArrayDeque;
import java.util.List;

public class SmartMlBridge {
    private final Activity activity;
    private final WebView webView;
    private final ImageLabeler labeler;
    private final FaceDetector faceDetector;
    private final PoseDetector poseDetector;
    private final SubjectSegmenter subjectSegmenter;
    private volatile String semanticMode = "subject";

    private interface FaceCallback { void done(JSONArray faces); }
    private interface PoseCallback { void done(boolean detected, int landmarkCount, int rotation); }

    public SmartMlBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
        this.labeler = ImageLabeling.getClient(
                new ImageLabelerOptions.Builder().setConfidenceThreshold(0.58f).build()
        );
        FaceDetectorOptions faceOptions = new FaceDetectorOptions.Builder()
                .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
                .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
                .setContourMode(FaceDetectorOptions.CONTOUR_MODE_ALL)
                .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
                .setMinFaceSize(0.025f)
                .build();
        this.faceDetector = FaceDetection.getClient(faceOptions);

        PoseDetectorOptions poseOptions = new PoseDetectorOptions.Builder()
                .setDetectorMode(PoseDetectorOptions.SINGLE_IMAGE_MODE)
                .build();
        this.poseDetector = PoseDetection.getClient(poseOptions);

        SubjectSegmenterOptions segmenterOptions = new SubjectSegmenterOptions.Builder()
                .enableForegroundConfidenceMask()
                .build();
        this.subjectSegmenter = SubjectSegmentation.getClient(segmenterOptions);
    }

    @JavascriptInterface
    public void analyzeImage(String dataUrl, String requestId) {
        final Bitmap bitmap = decodeDataUrl(dataUrl);
        if (bitmap == null) {
            sendError("onAnalysisError", requestId, "Could not decode image for analysis.");
            return;
        }
        labeler.process(InputImage.fromBitmap(bitmap, 0))
                .addOnSuccessListener(labels -> detectFacesFlexible(bitmap, faces ->
                        detectPoseFlexible(bitmap, (poseDetected, poseLandmarks, poseRotation) ->
                                sendAnalysis(requestId, bitmap, labels, faces, poseDetected, poseLandmarks, poseRotation))))
                .addOnFailureListener(e -> detectFacesFlexible(bitmap, faces ->
                        detectPoseFlexible(bitmap, (poseDetected, poseLandmarks, poseRotation) ->
                                sendAnalysis(requestId, bitmap, null, faces, poseDetected, poseLandmarks, poseRotation))));
    }

    @JavascriptInterface
    public void setSemanticMode(String mode) {
        if (mode == null) semanticMode = "subject";
        else {
            String m = mode.toLowerCase().trim();
            semanticMode = (m.equals("sky") || m.equals("water") || m.equals("architecture")) ? m : "subject";
        }
    }

    @JavascriptInterface
    public void selectSubject(String dataUrl, String requestId) {
        final Bitmap bitmap = decodeDataUrl(dataUrl);
        if (bitmap == null) {
            sendError("onSubjectError", requestId, "Could not decode image for Smart Select.");
            return;
        }
        String mode = semanticMode;
        semanticMode = "subject";
        if (!"subject".equals(mode)) {
            sendSemanticMask(requestId, bitmap, mode);
            return;
        }
        subjectSegmenter.process(InputImage.fromBitmap(bitmap, 0))
                .addOnSuccessListener(result -> sendForegroundMask(requestId, bitmap, result))
                .addOnFailureListener(e -> sendError(
                        "onSubjectError", requestId,
                        "Smart Select model is not ready yet. Keep internet on briefly and retry. " + safeMessage(e)
                ));
    }

    private void detectFacesFlexible(Bitmap original, FaceCallback callback) {
        faceDetector.process(InputImage.fromBitmap(original, 0))
                .addOnSuccessListener(faces -> {
                    JSONArray direct = facesToJson(faces, original.getWidth(), original.getHeight(), 0);
                    if (direct.length() > 0) { callback.done(direct); return; }
                    final Bitmap cw = rotate(original, 90);
                    faceDetector.process(InputImage.fromBitmap(cw, 0))
                            .addOnSuccessListener(cwFaces -> {
                                JSONArray mapped = facesToJson(cwFaces, original.getWidth(), original.getHeight(), 90);
                                cw.recycle();
                                if (mapped.length() > 0) { callback.done(mapped); return; }
                                final Bitmap ccw = rotate(original, 270);
                                faceDetector.process(InputImage.fromBitmap(ccw, 0))
                                        .addOnSuccessListener(ccwFaces -> {
                                            JSONArray mapped2 = facesToJson(ccwFaces, original.getWidth(), original.getHeight(), 270);
                                            ccw.recycle(); callback.done(mapped2);
                                        })
                                        .addOnFailureListener(e -> { ccw.recycle(); callback.done(new JSONArray()); });
                            })
                            .addOnFailureListener(e -> { cw.recycle(); callback.done(new JSONArray()); });
                })
                .addOnFailureListener(e -> callback.done(new JSONArray()));
    }

    private void detectPoseFlexible(Bitmap original, PoseCallback callback) {
        poseDetector.process(InputImage.fromBitmap(original, 0))
                .addOnSuccessListener(pose -> {
                    int count = reliablePoseLandmarks(pose);
                    if (count >= 4) { callback.done(true, count, 0); return; }
                    final Bitmap cw = rotate(original, 90);
                    poseDetector.process(InputImage.fromBitmap(cw, 0))
                            .addOnSuccessListener(pose90 -> {
                                int count90 = reliablePoseLandmarks(pose90); cw.recycle();
                                if (count90 >= 4) { callback.done(true, count90, 90); return; }
                                final Bitmap ccw = rotate(original, 270);
                                poseDetector.process(InputImage.fromBitmap(ccw, 0))
                                        .addOnSuccessListener(pose270 -> {
                                            int count270 = reliablePoseLandmarks(pose270); ccw.recycle();
                                            callback.done(count270 >= 4, count270, count270 >= 4 ? 270 : 0);
                                        })
                                        .addOnFailureListener(e -> { ccw.recycle(); callback.done(false, 0, 0); });
                            })
                            .addOnFailureListener(e -> { cw.recycle(); callback.done(false, 0, 0); });
                })
                .addOnFailureListener(e -> callback.done(false, 0, 0));
    }

    private int reliablePoseLandmarks(Pose pose) {
        if (pose == null) return 0;
        int reliable = 0;
        List<PoseLandmark> landmarks = pose.getAllPoseLandmarks();
        if (landmarks == null) return 0;
        for (PoseLandmark landmark : landmarks) {
            if (landmark != null && landmark.getInFrameLikelihood() >= 0.42f) reliable++;
        }
        return reliable;
    }

    private Bitmap rotate(Bitmap bitmap, int degrees) {
        Matrix matrix = new Matrix(); matrix.postRotate(degrees);
        return Bitmap.createBitmap(bitmap, 0, 0, bitmap.getWidth(), bitmap.getHeight(), matrix, true);
    }

    private JSONArray facesToJson(List<Face> faces, int originalWidth, int originalHeight, int rotation) {
        JSONArray array = new JSONArray();
        if (faces == null) return array;
        for (Face face : faces) {
            try {
                Rect r = face.getBoundingBox();
                double left, top, right, bottom;
                if (rotation == 90) {
                    left = r.top; right = r.bottom; top = originalHeight - r.right; bottom = originalHeight - r.left;
                } else if (rotation == 270) {
                    left = originalWidth - r.bottom; right = originalWidth - r.top; top = r.left; bottom = r.right;
                } else {
                    left = r.left; top = r.top; right = r.right; bottom = r.bottom;
                }
                left = clamp(left, 0, originalWidth); right = clamp(right, 0, originalWidth);
                top = clamp(top, 0, originalHeight); bottom = clamp(bottom, 0, originalHeight);
                if (right <= left || bottom <= top) continue;
                JSONObject f = new JSONObject();
                f.put("left", left / originalWidth); f.put("top", top / originalHeight);
                f.put("right", right / originalWidth); f.put("bottom", bottom / originalHeight);
                f.put("rotationFallback", rotation);
                if (face.getSmilingProbability() != null) f.put("smile", face.getSmilingProbability());
                if (face.getLeftEyeOpenProbability() != null) f.put("leftEyeOpen", face.getLeftEyeOpenProbability());
                if (face.getRightEyeOpenProbability() != null) f.put("rightEyeOpen", face.getRightEyeOpenProbability());
                array.put(f);
            } catch (Exception ignored) { }
        }
        return array;
    }

    private double clamp(double value, double min, double max) { return Math.max(min, Math.min(max, value)); }

    private void sendAnalysis(String requestId, Bitmap bitmap, List<ImageLabel> labels, JSONArray faceArray,
                              boolean poseDetected, int poseLandmarks, int poseRotation) {
        try {
            JSONObject root = new JSONObject();
            root.put("width", bitmap.getWidth()); root.put("height", bitmap.getHeight());
            JSONArray labelArray = new JSONArray();
            if (labels != null) {
                int added = 0;
                for (ImageLabel label : labels) {
                    if (label.getConfidence() < 0.58f) continue;
                    JSONObject item = new JSONObject(); item.put("text", label.getText()); item.put("confidence", label.getConfidence());
                    labelArray.put(item); if (++added >= 18) break;
                }
            }
            root.put("labels", labelArray); root.put("faces", faceArray == null ? new JSONArray() : faceArray);
            root.put("faceCount", faceArray == null ? 0 : faceArray.length());
            root.put("poseDetected", poseDetected); root.put("poseLandmarks", poseLandmarks);
            root.put("poseRotationFallback", poseRotation);
            root.put("peopleEvidence", poseDetected || (faceArray != null && faceArray.length() > 0));
            callJs("onAnalysis", requestId, root.toString());
        } catch (Exception e) { sendError("onAnalysisError", requestId, safeMessage(e)); }
    }

    private void sendForegroundMask(String requestId, Bitmap bitmap, SubjectSegmentationResult result) {
        try {
            FloatBuffer confidence = result.getForegroundConfidenceMask();
            if (confidence == null) { sendError("onSubjectError", requestId, "No foreground subject was found."); return; }
            int w = bitmap.getWidth(), h = bitmap.getHeight(), count = w * h;
            int[] pixels = new int[count]; confidence.rewind(); int selected = 0;
            for (int i = 0; i < count && confidence.hasRemaining(); i++) {
                float c = confidence.get();
                if (c > 0.18f) {
                    int a = Math.max(0, Math.min(255, Math.round((c - 0.12f) / 0.88f * 255f)));
                    pixels[i] = Color.argb(a, 255, 255, 255); if (c >= 0.50f) selected++;
                } else pixels[i] = Color.TRANSPARENT;
            }
            if (selected < Math.max(60, count / 1400)) {
                sendError("onSubjectError", requestId, "No reliable foreground subject was found."); return;
            }
            sendMaskBitmap(requestId, pixels, w, h, selected, "subject");
        } catch (Exception e) { sendError("onSubjectError", requestId, safeMessage(e)); }
    }

    private void sendSemanticMask(String requestId, Bitmap bitmap, String mode) {
        try {
            int w = bitmap.getWidth(), h = bitmap.getHeight(), count = w * h;
            int[] src = new int[count]; bitmap.getPixels(src, 0, w, 0, 0, w, h);
            boolean[] candidate = new boolean[count];
            for (int y = 0; y < h; y++) {
                for (int x = 0; x < w; x++) {
                    int i = y * w + x, c = src[i];
                    float r = Color.red(c) / 255f, g = Color.green(c) / 255f, b = Color.blue(c) / 255f;
                    float max = Math.max(r, Math.max(g, b)), min = Math.min(r, Math.min(g, b));
                    float sat = max - min, lum = .2126f*r + .7152f*g + .0722f*b;
                    if ("sky".equals(mode)) {
                        candidate[i] = y < h * .78f && ((b > r * 1.05f && b > g * .90f && b > .24f) || (lum > .72f && sat < .22f && y < h * .64f));
                    } else if ("water".equals(mode)) {
                        candidate[i] = y > h * .18f && ((b > r * 1.07f && g > r * .88f && b > .20f) || (g > r * 1.14f && b > r * 1.02f && sat > .10f));
                    }
                }
            }

            boolean[] selectedMask;
            if ("sky".equals(mode)) selectedMask = connectedFromTop(candidate, w, h);
            else if ("water".equals(mode)) selectedMask = connectedFromSidesAndBottom(candidate, w, h);
            else {
                boolean[] sky = new boolean[count], water = new boolean[count];
                for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
                    int i = y*w+x, c=src[i]; float r=Color.red(c)/255f,g=Color.green(c)/255f,b=Color.blue(c)/255f;
                    float max=Math.max(r,Math.max(g,b)),min=Math.min(r,Math.min(g,b)),sat=max-min,lum=.2126f*r+.7152f*g+.0722f*b;
                    sky[i]=y<h*.78f&&((b>r*1.05f&&b>g*.90f&&b>.24f)||(lum>.72f&&sat<.22f&&y<h*.64f));
                    water[i]=y>h*.18f&&((b>r*1.07f&&g>r*.88f&&b>.20f)||(g>r*1.14f&&b>r*1.02f&&sat>.10f));
                }
                sky=connectedFromTop(sky,w,h); water=connectedFromSidesAndBottom(water,w,h);
                selectedMask=new boolean[count];
                for(int y=1;y<h-1;y++) for(int x=1;x<w-1;x++){
                    int i=y*w+x;if(sky[i]||water[i])continue;int c=src[i];float lum=.2126f*Color.red(c)/255f+.7152f*Color.green(c)/255f+.0722f*Color.blue(c)/255f;
                    int cx=src[i+1],cy=src[i+w];float l2=.2126f*Color.red(cx)/255f+.7152f*Color.green(cx)/255f+.0722f*Color.blue(cx)/255f;float l3=.2126f*Color.red(cy)/255f+.7152f*Color.green(cy)/255f+.0722f*Color.blue(cy)/255f;
                    float edge=Math.abs(lum-l2)+Math.abs(lum-l3);selectedMask[i]=lum>.055f&&(edge>.045f||y>h*.26f);
                }
            }

            int[] out = new int[count]; int selected = 0;
            for (int i = 0; i < count; i++) {
                if (selectedMask[i]) { out[i] = Color.argb(235,255,255,255); selected++; }
                else out[i] = Color.TRANSPARENT;
            }
            if (selected < Math.max(100, count / 500)) {
                sendError("onSubjectError", requestId, "No reliable " + mode + " region was found."); return;
            }
            sendMaskBitmap(requestId, out, w, h, selected, mode);
        } catch (Exception e) { sendError("onSubjectError", requestId, safeMessage(e)); }
    }

    private boolean[] connectedFromTop(boolean[] c, int w, int h) {
        boolean[] out = new boolean[c.length]; ArrayDeque<Integer> q = new ArrayDeque<>();
        int seedRows = Math.max(2, h / 40);
        for (int y=0;y<seedRows;y++) for(int x=0;x<w;x++){int i=y*w+x;if(c[i]&&!out[i]){out[i]=true;q.add(i);}}
        flood(c,out,q,w,h); return out;
    }

    private boolean[] connectedFromSidesAndBottom(boolean[] c, int w, int h) {
        boolean[] out = new boolean[c.length]; ArrayDeque<Integer> q = new ArrayDeque<>();
        for(int y=h/5;y<h;y++){int a=y*w,b=y*w+w-1;if(c[a]){out[a]=true;q.add(a);}if(c[b]){out[b]=true;q.add(b);}}
        for(int x=0;x<w;x++){int i=(h-1)*w+x;if(c[i]&&!out[i]){out[i]=true;q.add(i);}}
        flood(c,out,q,w,h); return out;
    }

    private void flood(boolean[] c, boolean[] out, ArrayDeque<Integer> q, int w, int h) {
        while(!q.isEmpty()){
            int i=q.removeFirst(),x=i%w,y=i/w;
            if(x>0)visit(i-1,c,out,q); if(x<w-1)visit(i+1,c,out,q); if(y>0)visit(i-w,c,out,q); if(y<h-1)visit(i+w,c,out,q);
        }
    }
    private void visit(int i, boolean[] c, boolean[] out, ArrayDeque<Integer> q){if(c[i]&&!out[i]){out[i]=true;q.add(i);}}

    private void sendMaskBitmap(String requestId, int[] pixels, int w, int h, int selected, String kind) throws Exception {
        Bitmap mask = Bitmap.createBitmap(pixels, w, h, Bitmap.Config.ARGB_8888);
        ByteArrayOutputStream out = new ByteArrayOutputStream(); mask.compress(Bitmap.CompressFormat.PNG, 100, out); mask.recycle();
        String encoded = Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
        JSONObject payload = new JSONObject(); payload.put("mask", "data:image/png;base64," + encoded);
        payload.put("width", w); payload.put("height", h); payload.put("coverage", selected / (double)(w*h)); payload.put("kind", kind);
        callJs("onSubjectMask", requestId, payload.toString());
    }

    private Bitmap decodeDataUrl(String dataUrl) {
        try {
            if (dataUrl == null) return null; int comma = dataUrl.indexOf(',');
            String raw = comma >= 0 ? dataUrl.substring(comma + 1) : dataUrl;
            byte[] bytes = Base64.decode(raw, Base64.DEFAULT); return BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
        } catch (Exception e) { return null; }
    }

    private void sendError(String callback, String requestId, String message) {
        try { JSONObject payload = new JSONObject(); payload.put("message", message == null ? "Unknown Smart error" : message); callJs(callback, requestId, payload.toString()); }
        catch (Exception ignored) { }
    }

    private void callJs(String callback, String requestId, String json) {
        String js = "window.FRAME_NATIVE&&FRAME_NATIVE." + callback + "(" + JSONObject.quote(requestId == null ? "" : requestId) + "," + json + ");";
        activity.runOnUiThread(() -> webView.evaluateJavascript(js, null));
    }

    private String safeMessage(Exception e) {
        if (e == null || e.getMessage() == null) return ""; return e.getMessage().replace('\n',' ').trim();
    }
}