// // // Vercel Serverless Function: Proxy for Mitosis API

// // export default async function handler(req, res) {
// //   const targetBase = "https://api-mainnet.mitosis.org";

// //   // remove the /api/proxy prefix
// //   const targetPath = req.url.replace(/^\/api\/proxy/, "");
// //   const targetUrl = targetBase + targetPath;

// //   try {
// //     const response = await fetch(targetUrl, {
// //       method: req.method,
// //       headers: {
// //         "Content-Type": "application/json"
// //       }
// //     });

// //     const text = await response.text();

// //     // forward status + body from target API
// //     res.status(response.status).send(text);
// //   } catch (err) {
// //     res.status(500).json({
// //       error: "Proxy request failed",
// //       details: err.message
// //     });
// //   }
// // }
// export default async function handler(req, res) {
//   const targetBase = "https://api-mainnet.mitosis.org";

//   // remove the "/api/proxy" prefix only ONCE
//   const targetPath = req.url.startsWith("/api/proxy")
//     ? req.url.slice("/api/proxy".length)
//     : req.url;

//   const targetUrl = targetBase + targetPath;

//   try {
//     const response = await fetch(targetUrl, {
//       method: req.method,
//       headers: { "Content-Type": "application/json" }
//     });

//     const text = await response.text();

//     res.status(response.status).send(text);
//   } catch (err) {
//     res.status(500).json({
//       error: "Proxy request failed",
//       details: err.message
//     });
//   }
// }
export default async function handler(req, res) {
  const targetBase = "https://api-mainnet.mitosis.org";

  // Grab the path after /api/proxy
  const targetPath = req.url.replace(/^\/api\/proxy/, "");
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
