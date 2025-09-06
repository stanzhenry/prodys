// Helper: parse body safely
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      if (body) {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          resolve(body); // fallback: send raw text if not JSON
        }
      } else {
        resolve(null);
      }
    });
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  try {
    // Extract slug from dynamic route
    let { slug } = req.query;
    if (!slug) slug = [];
    if (!Array.isArray(slug)) slug = [slug]; // normalize to array

    // Reconstruct clean path
    const targetPath = slug.join("/");

    // Extract actual query params (remove slug completely)
    const { slug: _ignore, ...queryParams } = req.query;
    const queryString = new URLSearchParams(queryParams).toString();

    const targetUrl = `https://api-mainnet.mitosis.org/${targetPath}${
      queryString ? `?${queryString}` : ""
    }`;

    console.log("Forwarding request to:", targetUrl);

    // Handle body
    const requestBody = await parseBody(req);

    const options = {
      method: req.method,
      headers: {
        "Content-Type": req.headers["content-type"] || "application/json",
      },
    };

    if (req.headers.authorization) {
      options.headers.Authorization = req.headers.authorization;
    }

    if (requestBody && !["GET", "HEAD"].includes(req.method)) {
      options.body =
        typeof requestBody === "string"
          ? requestBody
          : JSON.stringify(requestBody);
    }

    const apiResponse = await fetch(targetUrl, options);

    res.status(apiResponse.status);
    for (const [name, value] of apiResponse.headers.entries()) {
      res.setHeader(name, value);
    }

    const body = await apiResponse.text();
    res.send(body);
  } catch (error) {
    console.error("Proxy error:", error);
    res
      .status(500)
      .json({ error: "Proxy failed", message: error.message });
  }
}
