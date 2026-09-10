function dataUrlToBlob(dataUrl) {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl || "");
  if (!match) throw new Error("Invalid image data.");
  return { blob: new Blob([Buffer.from(match[2], "base64")], { type: match[1] }), mime: match[1] };
}

function sizeForRatio(ratio) {
  if (ratio === "1:1") return "1024x1024";
  if (ratio === "4:5" || ratio === "9:16") return "1024x1536";
  if (ratio === "16:9") return "1536x1024";
  return "auto";
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST required." });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "Server is missing OPENAI_API_KEY." });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    if (!body.source_image) return res.status(400).json({ error: "source_image is required." });
    const prompt = String(body.prompt || "").trim();
    if (!prompt) return res.status(400).json({ error: "prompt is required." });

    const settings = body.settings || {};
    const quality = ["medium", "high", "xhigh"].includes(settings.quality) ? settings.quality : "high";
    const form = new FormData();
    form.append("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-sunburst");
    form.append("prompt", prompt);
    form.append("quality", quality);
    form.append("size", sizeForRatio(settings.ratio));
    form.append("output_format", "png");
    form.append("moderation", "auto");

    const main = dataUrlToBlob(body.source_image);
    form.append("image[]", main.blob, "source.jpg");
    const refs = Array.isArray(body.reference_images) ? body.reference_images.slice(0, 5) : [];
    refs.forEach((item, i) => {
      const ref = dataUrlToBlob(item);
      form.append("image[]", ref.blob, `reference-${i + 1}.jpg`);
    });

    const upstream = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form
    });

    const requestId = upstream.headers.get("x-request-id") || "";
    const raw = await upstream.text();
    let json = null;
    try { json = JSON.parse(raw); } catch {}

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: json?.error?.message || `OpenAI image edit failed (${upstream.status}).`,
        request_id: requestId
      });
    }

    const images = (json?.data || []).map(item => item?.b64_json).filter(Boolean);
    if (!images.length) return res.status(502).json({ error: "No image returned by the image service.", request_id: requestId });
    return res.status(200).json({ images, request_id: requestId });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Unexpected server error." });
  }
}
