// pages/api/[...slug].js

export default async function handler(req, res) {
  // 1. Destructure the slug and other potential query params
  const { slug, ...queryParams } = req.query;

  // 2. Reconstruct the query string
  const queryString = new URLSearchParams(queryParams).toString();

  // 3. Build the full target URL with path and query string
  const targetPath = slug.join("/");
  const targetUrl = `https://api-mainnet.mitosis.org/${targetPath}${
    queryString ? `?${queryString}` : ""
  }`;

  console.log(`Forwarding request to: ${targetUrl}`); // Helpful for debugging

  try {
    // 4. Prepare the request options
    const options = {
      method: req.method,
      headers: {
        // Forward essential headers from the original request
        "Content-Type": req.headers["content-type"] || "application/json",
        Authorization: req.headers.authorization || "",
      },
    };

    // 5. Only add a body if the method is not GET or HEAD
    if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
      options.body = JSON.stringify(req.body);
    }

    const apiResponse = await fetch(targetUrl, options);

    // 6. Send the response back to the client
    // Set status code from the API response
    res.status(apiResponse.status);

    // Forward all headers from the API response
    apiResponse.headers.forEach((value, name) => {
        res.setHeader(name, value);
    });

    // Stream the body from the API response
    const body = await apiResponse.text();
    res.send(body);

  } catch (error) {
    console.error("Proxy error:", error); // Log the actual error
    res.status(500).json({ error: "An error occurred in the proxy route.", message: error.message });
  }
}

// You might need to disable Next.js's default body parser
// if you want to stream bodies or handle non-JSON content.
// For this specific case (JSON), it's okay.
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };
