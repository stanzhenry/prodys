// File: api/proxy.js

export default async function handler(req, res) {
  const targetBase = "https://api-mainnet.mitosis.org"; // or dognet if needed

  // Strip off `/api/proxy` prefix and forward the rest
  const targetUrl = targetBase + req.url.replace(/^\/api\/proxy/, "");

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: new URL(targetBase).host, // fix host header
      },
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
    });

    // Mirror response headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // ✅ Add CORS headers so browser accepts it
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    const data = await response.arrayBuffer();
    res.status(response.status).send(Buffer.from(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
