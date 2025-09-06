// A helper function to parse the body from the raw request stream
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
          reject(error);
        }
      } else {
        resolve(null); // Resolve with null if there's no body
      }
    });
    req.on("error", (err) => {
      reject(err);
    });
  });
}

export default async function handler(req, res) {
  try {
    // slug will be an array if present, otherwise []
    const { slug = [] } = req.query;

    // Keep only query params that are not "slug"
    const { slug: _ignore, ...queryParams } = req.query;
    const queryString = new URLSearchParams(queryParams).toString();

    // Join path parts safely
    const targetPath = Array.isArray(slug) ? slug.join("/") : slug;
    const targetUrl = `https://api-mainnet.mitosis.org/${targetPath}${
      queryString ? `?${queryString}` : ""
    }`;

    console.log(`Forwarding request to: ${targetUrl}`);

    // Parse request body
    const requestBody = await parseBody(req);

    // Build fetch options
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
      options.body = JSON.stringify(requestBody);
    }

    // Forward to target API
    const apiResponse = await fetch(targetUrl, options);

    // Copy status + headers
    res.status(apiResponse.status);
    for (const [name, value] of apiResponse.headers.entries()) {
      res.setHeader(name, value);
    }

    // Pipe response body
    const body = await apiResponse.text();
    res.send(body);

  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({
      error: "An error occurred in the proxy route.",
      message: error.message,
    });
  }
}
