// standalone-server.js
const http = require("http");
const { JSDOM } = require("jsdom");
const FormData = require("form-data");

// Types
// VideoData interface (same as before)

/**
 * Helper function to make the authenticated POST request to the CDN endpoint.
 */
async function getVideoCdnUrl(videoId, csrfToken, cookieString) {
  if (!csrfToken || !cookieString) {
    console.error("CSRF token or cookie is missing.");
    return null;
  }

  try {
    const formData = new FormData();
    formData.append("video_id", videoId);
    formData.append("pid_c", "");
    formData.append("token", csrfToken);

    const response = await fetch("https://javtiful.com/ajax/get_cdn", {
      method: "POST",
      headers: {
        Cookie: cookieString,
        Referer: `https://javtiful.com/video/${videoId}`,
        Origin: "https://javtiful.com",
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        DNT: "1",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        ...formData.getHeaders(),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse response body as JSON:", parseError);
      console.error("Raw response body:", responseText);
      return null;
    }

    return data.playlists || null;
  } catch (error) {
    console.error(`Error getting CDN URL for video ${videoId}:`, error);
    return null;
  }
}

/**
 * Helper function to extract video data from the main page.
 */
async function extractVideoDataFromMainPage() {
  try {
    const response = await fetch("https://javtiful.com/main");
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const videoCards = document.querySelectorAll(".col.pb-3 .card");
    const videos = [];

    videoCards.forEach((card) => {
      try {
        const linkElement = card.querySelector("a.video-tmb");
        if (!linkElement) return;
        const href = linkElement.getAttribute("href");
        if (!href) return;
        const idMatch = href.match(/\/video\/(\d+)\//);
        if (!idMatch) return;
        const videoId = idMatch[1];
        const imgElement = linkElement.querySelector("img");
        const thumbnail =
          imgElement?.getAttribute("data-src") ||
          imgElement?.getAttribute("src") ||
          "";
        const hdLabel =
          linkElement.querySelector(".label-hd")?.textContent || "";
        const duration =
          linkElement.querySelector(".label-duration")?.textContent || "";
        const code =
          linkElement.querySelector(".label-code")?.textContent || "";
        const titleLink = card.querySelector(".video-link");
        const title =
          titleLink?.getAttribute("title") || titleLink?.textContent || "";

        videos.push({
          id: videoId,
          code,
          title,
          thumbnail,
          duration,
          quality: hdLabel,
        });
      } catch (error) {
        console.error("Error parsing video card:", error);
      }
    });

    return videos;
  } catch (error) {
    console.error("Error fetching main page:", error);
    return [];
  }
}

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Create HTTP server
const server = http.createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const url = new URL(req.url, `http://localhost:8080`);

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  // API route to get a list of videos
  if (url.pathname === "/api/videos") {
    try {
      const videos = await extractVideoDataFromMainPage();
      res.writeHead(200, {
        "Content-Type": "application/json",
        ...corsHeaders,
      });
      res.end(JSON.stringify(videos));
    } catch (error) {
      console.error("Error fetching videos:", error);
      res.writeHead(500, {
        "Content-Type": "application/json",
        ...corsHeaders,
      });
      res.end(JSON.stringify({ error: "Failed to fetch videos" }));
    }
    return;
  }

  // API route to get the streaming URL for a specific video
  if (url.pathname === "/api/video-url" && req.method === "POST") {
    try {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const { videoId } = JSON.parse(body);

          if (!videoId) {
            res.writeHead(400, {
              "Content-Type": "application/json",
              ...corsHeaders,
            });
            res.end(JSON.stringify({ error: "Video ID is required" }));
            return;
          }

          console.log(`[1/3] Fetching page for videoId: ${videoId}`);
          const pageResponse = await fetch(
            `https://javtiful.com/video/${videoId}`,
            {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
              },
            },
          );

          if (!pageResponse.ok) {
            throw new Error(
              `Failed to fetch video page: ${pageResponse.status} ${pageResponse.statusText}`,
            );
          }

          const html = await pageResponse.text();
          const dom = new JSDOM(html);
          const document = dom.window.document;

          // 1. Extract CSRF token from the page HTML
          let token = document
            .getElementById("token_full")
            ?.getAttribute("data-csrf-token");

          // Fallback: try to find token in any input with name containing 'token'
          if (!token) {
            const tokenInputs = document.querySelectorAll(
              'input[name*="token"]',
            );
            for (const input of tokenInputs) {
              const tokenValue =
                input.getAttribute("value") ||
                input.getAttribute("data-csrf-token");
              if (tokenValue) {
                token = tokenValue;
                break;
              }
            }
          }

          console.log(`Found CSRF token: ${token ? "YES" : "NO"}`);

          if (!token) {
            throw new Error("Could not find CSRF token on the page.");
          }

          // 2. Extract cookies from the response headers
          const setCookieHeader = pageResponse.headers.get("set-cookie");
          if (!setCookieHeader) {
            throw new Error("Could not find cookies in the response headers.");
          }
          const cookies = setCookieHeader
            .split(",")
            .map((cookie) => cookie.split(";")[0])
            .join("; ");

          console.log(`[2/3] Successfully extracted token and cookies.`);

          // 3. Use the extracted information to get the CDN URL
          const videoUrl = await getVideoCdnUrl(videoId, token, cookies);

          if (!videoUrl) {
            res.writeHead(404, {
              "Content-Type": "application/json",
              ...corsHeaders,
            });
            res.end(
              JSON.stringify({
                error: "Failed to get video URL from CDN endpoint",
              }),
            );
            return;
          }

          console.log(`[3/3] ✅ Success! Got video URL for ${videoId}.`);
          res.writeHead(200, {
            "Content-Type": "application/json",
            ...corsHeaders,
          });
          res.end(JSON.stringify({ videoUrl }));
        } catch (error) {
          console.error(`An error occurred in /api/video-url:`, error);
          res.writeHead(500, {
            "Content-Type": "application/json",
            ...corsHeaders,
          });
          res.end(JSON.stringify({ error: "Failed to fetch video URL" }));
        }
      });
    } catch (error) {
      console.error("Error parsing request:", error);
      res.writeHead(400, {
        "Content-Type": "application/json",
        ...corsHeaders,
      });
      res.end(JSON.stringify({ error: "Invalid request" }));
    }
    return;
  }

  // Default response
  res.writeHead(404);
  res.end("Not found");
});

function startServer(port = 8080) {
  return new Promise((resolve, reject) => {
    server
      .listen(port, () => {
        console.log(`🌐 Server running at http://localhost:${port}`);
        console.log("📺 Video API endpoints:");
        console.log("   GET  /api/videos - Get list of videos");
        console.log("   POST /api/video-url - Get streaming URL for a video");
        resolve(port);
      })
      .on("error", (error) => {
        if (error.code === "EADDRINUSE") {
          console.log(`Port ${port} is in use, trying ${port + 1}`);
          startServer(port + 1)
            .then(resolve)
            .catch(reject);
        } else {
          reject(error);
        }
      });
  });
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer().catch(console.error);
}

module.exports = { startServer };
