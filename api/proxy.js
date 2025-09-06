export default async function handler(req, res) {
  const targetBase = "https://api-mainnet.mitosis.org";

  // remove `/api/proxy` prefix from request URL
  const targetPath = req.url.replace(/^\/api\/proxy/, "");

  const targetUrl = targetBase + targetPath;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.text();

    res.status(response.status).send(data);
  } catch (err) {
    res.status(500).json({ error: "Proxy request failed", details: err.message });
  }
}
