export default async function handler(req, res) {
  // The base API you want to proxy to
  const targetBase = "https://api-mainnet.mitosis.org";

  // Strip the `/api/proxy` prefix
  const targetPath = req.url.replace(/^\/api\/proxy/, "");

  const targetUrl = targetBase + targetPath;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: { "Content-Type": "application/json" }
    });

    const text = await response.text();

    // Pass back the status + raw response
    res.status(response.status).send(text);
  } catch (err) {
    res.status(500).json({ error: "Proxy failed", details: err.message });
  }
}
