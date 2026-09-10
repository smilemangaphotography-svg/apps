function dataUrlToBlob(dataUrl) {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl || "");
  if (!match) throw new Error("Invalid image data.");
  const mime = match[1];
  const bytes = Buffer.from(match[2], "base64");
  return { blob: new Blob([bytes], { type: mime }), mime };
}

function sizeForRatio(ratio) {
  switch (ratio) {
    case "1:1": return "1024x1024";
    case "4:5": return "1024x1280";
    case "9:16": return "1024x1824";
    case "16:9": return "1824x1024";
    default: return "auto";
  }
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
    const source = body.source_image;
    if (!source) return res.status(400).json({ error: "source_image is required." });

    const prompt = String(body.prompt || "").trim();
    if (!prompt) return res.status(400).json({ error: "prompt is required." });

    const settings = body.settings || {};
    const form = new FormData();
    form.append("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-sunburst");
    form.append("prompt", prompt);
    form.append("quality", process.env.OPENAI_IMAGE_QUALITY || "high");
    form.append("size", sizeForRatio(settings.ratio));
    form.append("output_format", "png");
    form.append("moderation", "auto");

    if (String(settings.background || "").toLowerCase().includes("transparent")) {
      form.append("background", "transparent");
    }

    const main = dataUrlToBlob(source);
    form.append("image[]", main.blob, "source.png");

    const refs = Array.isArray(body.reference_images) ? body.reference_images.slice(0, 5) : [];
    refs.forEach((r, i) => {
      const ref = dataUrlToBlob(r);
      form.append("image[]", ref.blob, `reference-${i + 1}.png`);
    });

    const upstream = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form
    });

    const requestId = upstream.headers.get("x-request-id") || "";
    const raw = await upstream.text();
    let json;
    try { json = JSON.parse(raw); } catch { json = null; }

    if (!upstream.ok) {
      const message = json?.error?.message || `OpenAI image edit failed (${upstream.status}).`;
      return res.status(upstream.status).json({ error: message, request_id: requestId });
    }

    const images = (json?.data || []).map(x => x.b64_json).filter(Boolean);
    if (!images.length) return res.status(502).json({ error: "No image returned by the image service.", request_id: requestId });

    return res.status(200).json({ images, request_id: requestId });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Unexpected server error." });
  }
}
