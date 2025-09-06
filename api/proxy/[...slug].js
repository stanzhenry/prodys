// // // A helper function to parse the body from the raw request stream
// // async function parseBody(req) {
// //   return new Promise((resolve, reject) => {
// //     let body = "";
// //     req.on("data", (chunk) => {
// //       body += chunk.toString();
// //     });
// //     req.on("end", () => {
// //       if (body) {
// //         try {
// //           resolve(JSON.parse(body));
// //         } catch (error) {
// //           reject(error);
// //         }
// //       } else {
// //         resolve(null); // Resolve with null if there's no body
// //       }
// //     });
// //     req.on("error", (err) => {
// //       reject(err);
// //     });
// //   });
// // }

// // export default async function handler(req, res) {
// //   // ## THE FIX IS HERE ##
// //   // Destructure 'path' separately and use it if it exists.
// //   let { slug = [], path, ...queryParams } = req.query;
// //   const targetPath = path || slug.join("/");

// //   const queryString = new URLSearchParams(queryParams).toString();
// //   const targetUrl = `https://api-mainnet.mitosis.org/${targetPath}${
// //     queryString ? `?${queryString}` : ""
// //   }`;

// //   console.log(`Forwarding request to: ${targetUrl}`);

// //   try {
// //     const requestBody = await parseBody(req);

// //     const options = {
// //       method: req.method,
// //       headers: {
// //         "Content-Type": req.headers["content-type"] || "application/json",
// //         Authorization: req.headers.authorization || "",
// //       },
// //     };

// //     if (requestBody) {
// //       options.body = JSON.stringify(requestBody);
// //     }

// //     const apiResponse = await fetch(targetUrl, options);

// //     res.status(apiResponse.status);
// //     apiResponse.headers.forEach((value, name) => {
// //       res.setHeader(name, value);
// //     });
// //     const body = await apiResponse.text();
// //     res.send(body);

// //   } catch (error) {
// //     console.error("Proxy error:", error);
// //     res.status(500).json({ error: "An error occurred in the proxy route.", message: error.message });
// //   }
// // }

// A helper function to parse the body from the raw request stream
async function parseBody(req) {
  // ... (This helper function remains the same as before)
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
        resolve(null);
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

  // Your existing proxy logic
  let { slug = [], path, ...queryParams } = req.query;
  const targetPath = path || slug.join("/");
  const queryString = new URLSearchParams(queryParams).toString();
  const targetUrl = `https://api.expedition.mitosis.org/${targetPath}${
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
    
    // Make sure our CORS headers are not overwritten
    res.setHeader('Access-Control-Allow-Origin', '*');

    const body = await apiResponse.text();
    res.send(body);

  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "An error occurred in the proxy route.", message: error.message });
  }
}
A helper function to parse the body from the raw request stream
