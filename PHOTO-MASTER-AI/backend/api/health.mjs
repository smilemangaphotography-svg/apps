export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ ok: false, message: "GET required." });

  const configured = Boolean(process.env.OPENAI_API_KEY);
  return res.status(configured ? 200 : 503).json({
    ok: configured,
    service: "photo-master-ai",
    message: configured ? "Secure AI cloud connected" : "AI service is not configured"
  });
}
