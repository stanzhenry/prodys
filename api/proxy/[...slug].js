export default async function handler(req, res) {
  const { slug = [] } = req.query;
  const targetUrl = `https://api-mainnet.mitosis.org/${slug.join("/")}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
      },
    });

    const text = await response.text();
    res.status(response.status).send(text);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
