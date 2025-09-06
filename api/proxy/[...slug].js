export default async function handler(req, res) {
  const targetBase = "https://api-mainnet.mitosis.org";

  // Get the path after /api/proxy
  const slug = req.query.slug || [];
  const targetPath = "/" + slug.join("/");

  const targetUrl = targetBase + targetPath;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: { "Content-Type": "application/json" }
    });

    const text = await response.text();
    res.status(response.status).send(text);
  } catch (err) {
    res.status(500).json({
      error: "Proxy request failed",
      details: err.message
    });
  }
}
