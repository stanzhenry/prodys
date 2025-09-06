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
  // THE FIX IS ON THIS LINE: slug = []
  const { slug = [], ...queryParams } = req.query;

  const queryString = new URLSearchParams(queryParams).toString();
  const targetPath = slug.join("/");
  const targetUrl = `https://api-mainnet.mitosis.org/${targetPath}${
    queryString ? `?${queryString}` : ""
  }`;

  console.log(`Forwarding request to: ${targetUrl}`);

  try {
    const requestBody = await parseBody(req);

    const options = {
      method: req.method,
      headers: {
        "Content-Type": req.headers["content-type"] || "application/json",
        Authorization: req.headers.authorization || "",
      },
    };

    if (requestBody) {
      options.body = JSON.stringify(requestBody);
    }

    const apiResponse = await fetch(targetUrl, options);

    res.status(apiResponse.status);
    apiResponse.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });
    const body = await apiResponse.text();
    res.send(body);

  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "An error occurred in the proxy route.", message: error.message });
  }
}
