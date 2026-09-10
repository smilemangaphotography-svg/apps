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
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentation;
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentationResult;
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenter;
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenterOptions;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.nio.FloatBuffer;
import java.util.List;

public class SmartMlBridge {
    private final Activity activity;
    private final WebView webView;
    private final ImageLabeler labeler;
    private final FaceDetector faceDetector;
    private final SubjectSegmenter subjectSegmenter;

    private interface FaceCallback {
        void done(JSONArray faces);
    }

    public SmartMlBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
        this.labeler = ImageLabeling.getClient(
                new ImageLabelerOptions.Builder().setConfidenceThreshold(0.62f).build()
        );
        FaceDetectorOptions faceOptions = new FaceDetectorOptions.Builder()
                .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
                .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
                .setContourMode(FaceDetectorOptions.CONTOUR_MODE_ALL)
                .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
                .setMinFaceSize(0.03f)
                .build();
        this.faceDetector = FaceDetection.getClient(faceOptions);
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
        final InputImage input = InputImage.fromBitmap(bitmap, 0);
        labeler.process(input)
                .addOnSuccessListener(labels -> detectFacesFlexible(bitmap, faces -> sendAnalysis(requestId, bitmap, labels, faces)))
                .addOnFailureListener(e -> detectFacesFlexible(bitmap, faces -> sendAnalysis(requestId, bitmap, null, faces)));
    }

    private void detectFacesFlexible(Bitmap original, FaceCallback callback) {
        faceDetector.process(InputImage.fromBitmap(original, 0))
                .addOnSuccessListener(faces -> {
                    JSONArray direct = facesToJson(faces, original.getWidth(), original.getHeight(), 0);
                    if (direct.length() > 0) {
                        callback.done(direct);
                        return;
                    }
                    final Bitmap cw = rotate(original, 90);
                    faceDetector.process(InputImage.fromBitmap(cw, 0))
                            .addOnSuccessListener(cwFaces -> {
                                JSONArray mapped = facesToJson(cwFaces, original.getWidth(), original.getHeight(), 90);
                                cw.recycle();
                                if (mapped.length() > 0) {
                                    callback.done(mapped);
                                    return;
                                }
                                final Bitmap ccw = rotate(original, 270);
                                faceDetector.process(InputImage.fromBitmap(ccw, 0))
                                        .addOnSuccessListener(ccwFaces -> {
                                            JSONArray mapped2 = facesToJson(ccwFaces, original.getWidth(), original.getHeight(), 270);
                                            ccw.recycle();
                                            callback.done(mapped2);
                                        })
                                        .addOnFailureListener(e -> {
                                            ccw.recycle();
                                            callback.done(new JSONArray());
                                        });
                            })
                            .addOnFailureListener(e -> {
                                cw.recycle();
                                callback.done(new JSONArray());
                            });
                })
                .addOnFailureListener(e -> callback.done(new JSONArray()));
    }

    private Bitmap rotate(Bitmap bitmap, int degrees) {
        Matrix matrix = new Matrix();
        matrix.postRotate(degrees);
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
                    left = r.top;
                    right = r.bottom;
                    top = originalHeight - r.right;
                    bottom = originalHeight - r.left;
                } else if (rotation == 270) {
                    left = originalWidth - r.bottom;
                    right = originalWidth - r.top;
                    top = r.left;
                    bottom = r.right;
                } else {
                    left = r.left;
                    top = r.top;
                    right = r.right;
                    bottom = r.bottom;
                }
                left = clamp(left, 0, originalWidth);
                right = clamp(right, 0, originalWidth);
                top = clamp(top, 0, originalHeight);
                bottom = clamp(bottom, 0, originalHeight);
                if (right <= left || bottom <= top) continue;
                JSONObject f = new JSONObject();
                f.put("left", left / originalWidth);
                f.put("top", top / originalHeight);
                f.put("right", right / originalWidth);
                f.put("bottom", bottom / originalHeight);
                f.put("rotationFallback", rotation);
                if (face.getSmilingProbability() != null) f.put("smile", face.getSmilingProbability());
                if (face.getLeftEyeOpenProbability() != null) f.put("leftEyeOpen", face.getLeftEyeOpenProbability());
                if (face.getRightEyeOpenProbability() != null) f.put("rightEyeOpen", face.getRightEyeOpenProbability());
                array.put(f);
            } catch (Exception ignored) {
            }
        }
        return array;
    }

    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    @JavascriptInterface
    public void selectSubject(String dataUrl, String requestId) {
        final Bitmap bitmap = decodeDataUrl(dataUrl);
        if (bitmap == null) {
            sendError("onSubjectError", requestId, "Could not decode image for Smart Select.");
            return;
        }
        final InputImage input = InputImage.fromBitmap(bitmap, 0);
        subjectSegmenter.process(input)
                .addOnSuccessListener(result -> sendForegroundMask(requestId, bitmap, result))
                .addOnFailureListener(e -> sendError(
                        "onSubjectError",
                        requestId,
                        "Smart Select model is not ready yet. Keep internet on briefly and retry. " + safeMessage(e)
                ));
    }

    private void sendAnalysis(String requestId, Bitmap bitmap, List<ImageLabel> labels, JSONArray faceArray) {
        try {
            JSONObject root = new JSONObject();
            root.put("width", bitmap.getWidth());
            root.put("height", bitmap.getHeight());
            JSONArray labelArray = new JSONArray();
            if (labels != null) {
                int added = 0;
                for (ImageLabel label : labels) {
                    if (label.getConfidence() < 0.62f) continue;
                    JSONObject item = new JSONObject();
                    item.put("text", label.getText());
                    item.put("confidence", label.getConfidence());
                    labelArray.put(item);
                    if (++added >= 10) break;
                }
            }
            root.put("labels", labelArray);
            root.put("faces", faceArray == null ? new JSONArray() : faceArray);
            root.put("faceCount", faceArray == null ? 0 : faceArray.length());
            callJs("onAnalysis", requestId, root.toString());
        } catch (Exception e) {
            sendError("onAnalysisError", requestId, safeMessage(e));
        }
    }

    private void sendForegroundMask(String requestId, Bitmap bitmap, SubjectSegmentationResult result) {
        try {
            FloatBuffer confidence = result.getForegroundConfidenceMask();
            if (confidence == null) {
                sendError("onSubjectError", requestId, "No foreground subject was found.");
                return;
            }
            int w = bitmap.getWidth();
            int h = bitmap.getHeight();
            int count = w * h;
            int[] pixels = new int[count];
            confidence.rewind();
            int selected = 0;
            for (int i = 0; i < count && confidence.hasRemaining(); i++) {
                float c = confidence.get();
                if (c > 0.20f) {
                    int a = Math.max(0, Math.min(255, Math.round((c - 0.14f) / 0.86f * 255f)));
                    pixels[i] = Color.argb(a, 255, 255, 255);
                    if (c >= 0.55f) selected++;
                } else {
                    pixels[i] = Color.TRANSPARENT;
                }
            }
            if (selected < Math.max(80, count / 1000)) {
                sendError("onSubjectError", requestId, "No reliable foreground subject was found.");
                return;
            }
            Bitmap mask = Bitmap.createBitmap(pixels, w, h, Bitmap.Config.ARGB_8888);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            mask.compress(Bitmap.CompressFormat.PNG, 100, out);
            String encoded = Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
            JSONObject payload = new JSONObject();
            payload.put("mask", "data:image/png;base64," + encoded);
            payload.put("width", w);
            payload.put("height", h);
            payload.put("coverage", selected / (double) count);
            callJs("onSubjectMask", requestId, payload.toString());
        } catch (Exception e) {
            sendError("onSubjectError", requestId, safeMessage(e));
        }
    }

    private Bitmap decodeDataUrl(String dataUrl) {
        try {
            if (dataUrl == null) return null;
            int comma = dataUrl.indexOf(',');
            String raw = comma >= 0 ? dataUrl.substring(comma + 1) : dataUrl;
            byte[] bytes = Base64.decode(raw, Base64.DEFAULT);
            return BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
        } catch (Exception e) {
            return null;
        }
    }

    private void sendError(String callback, String requestId, String message) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("message", message == null ? "Unknown Smart error" : message);
            callJs(callback, requestId, payload.toString());
        } catch (Exception ignored) {
        }
    }

    private void callJs(String callback, String requestId, String json) {
        String js = "window.FRAME_NATIVE&&FRAME_NATIVE." + callback + "(" +
                JSONObject.quote(requestId == null ? "" : requestId) + "," + json + ");";
        activity.runOnUiThread(() -> webView.evaluateJavascript(js, null));
    }

    private String safeMessage(Exception e) {
        if (e == null || e.getMessage() == null) return "";
        return e.getMessage().replace('\n', ' ').trim();
    }
}