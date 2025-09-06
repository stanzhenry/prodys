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
  // ## CORS HEADERS ##
  // Set the allowed origin. Use '*' for public access or your specific frontend domain for security.
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // ## PREFLIGHT REQUEST (OPTIONS) HANDLING ##
  // The browser sends an OPTIONS request first to ask for permission.
  // We need to respond with a 204 status code and the headers above.
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // 1. Define the target APIs you want to proxy
  const targets = {
    'mainnet': 'https://api-mainnet.mitosis.org',
    'expedition': 'https://api.expedition.mitosis.org'
  };

  let { slug = [], ...queryParams } = req.query;

  // 2. The first part of the slug is the key for our target
  const targetKey = slug.shift(); // e.g., 'mainnet' or 'expedition'
  const baseUrl = targets[targetKey];

  // 3. If the targetKey is invalid, send an error
  if (!baseUrl) {
    res.status(400).json({ error: "Invalid API target. URL must start with /api/proxy/mainnet/ or /api/proxy/expedition/." });
    return;
  }

  // 4. The rest of the slug is the path for the target API
  const targetPath = slug.join("/");
  const queryString = new URLSearchParams(queryParams).toString();
  const targetUrl = `${baseUrl}/${targetPath}${queryString ? `?${queryString}` : ""}`;

  console.log(`Forwarding request to: ${targetUrl}`);

  try {
    const requestBody = await parseBody(req);

    const options = {
      method: req.method,
      headers: {
        "Content-Type": req.headers["content-type"] || "application/json",
        Authorization: req.headers.authorization || "",
      },
      // Vercel's fetch implementation requires this for streaming bodies
      duplex: 'half' 
    };

    if (requestBody) {
      options.body = JSON.stringify(requestBody);
    }

    const apiResponse = await fetch(targetUrl, options);

    // Forward status code and headers from the target API
    res.status(apiResponse.status);
    apiResponse.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });
    
    // Make sure our CORS headers are not overwritten by the target's headers
    res.setHeader('Access-Control-Allow-Origin', '*');

    const body = await apiResponse.text();
    res.send(body);

  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "An error occurred in the proxy route.", message: error.message });
  }
}
