// simple-server.js
const http = require("http");
const { JSDOM } = require("jsdom");
const querystring = require("querystring");

// Types
const VideoData = {
  id: String,
  code: String,
  title: String,
  thumbnail: String,
  duration: String,
  quality: String,
  videoUrl: String,
};

// Simple fetch with better error handling
async function safeFetch(url, options = {}) {
  try {
    const response = await fetch(url, {
      timeout: 10000, // 10 second timeout
      ...options,
    });

    if (!response.ok) {
      console.error(`HTTP ${response.status} for ${url}`);
      return null;
    }

    return response;
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error.message);
    return null;
  }
}

// Extract video data from main page
async function extractVideoDataFromMainPage() {
  try {
    const response = await safeFetch("https://javtiful.com/main");
    if (!response) return [];

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

    console.log(`Found ${videos.length} videos on main page`);
    return videos;
  } catch (error) {
    console.error("Error fetching main page:", error);
    return [];
  }
}

// Get video URL with multiple fallback strategies
async function getVideoUrlWithFallback(videoId) {
  console.log(`Attempting to get video URL for: ${videoId}`);

  // Strategy 1: Try original method
  try {
    const pageResponse = await safeFetch(
      `https://javtiful.com/video/${videoId}`,
    );
    if (!pageResponse) throw new Error("Failed to fetch video page");

    const html = await pageResponse.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Find CSRF token - more robust search
    let token = null;
    const tokenElement = document.getElementById("token_full");
    if (tokenElement) {
      token = tokenElement.getAttribute("data-csrf-token");
    }

    // Fallback token search
    if (!token) {
      const tokenInputs = document.querySelectorAll(
        'input[name*="token"], input[data-csrf-token]',
      );
      for (const input of tokenInputs) {
        const foundToken = input.getAttribute("data-csrf-token") || input.value;
        if (foundToken) {
          token = foundToken;
          break;
        }
      }
    }

    if (!token) {
      console.log("No CSRF token found, using fallback strategy");
      // Strategy 2: Try to find direct video links
      const videoElements = document.querySelectorAll("video source");
      for (const source of videoElements) {
        const src = source.getAttribute("src");
        if (src && src.includes("http")) {
          console.log("Found direct video link:", src);
          return src;
        }
      }

      // Strategy 3: Try alternative CDN endpoint
      const videoLinks = document.querySelectorAll(
        'a[href*=".mp4"], a[href*="cdn"], a[href*="stream"]',
      );
      for (const link of videoLinks) {
        const href = link.getAttribute("href");
        if (href && href.includes("http")) {
          console.log("Found alternative video link:", href);
          return href;
        }
      }

      throw new Error("No video source found on page");
    }

    // Get cookies - improved parsing
    const cookies = pageResponse.headers.get("set-cookie") || "";
    const parsedCookies = cookies
      .split(",")
      .map((c) => c.split(";")[0])
      .join("; ");
    console.log(`Found token: ${token ? "YES" : "NO"}`);
    console.log(`Cookies: ${parsedCookies}`);

    // Try CDN endpoint with token
    const formData = new URLSearchParams();
    formData.append("video_id", videoId);
    formData.append("pid_c", "");
    formData.append("token", token);

    const cdnResponse = await safeFetch("https://javtiful.com/ajax/get_cdn", {
      method: "POST",
      headers: {
        Cookie: parsedCookies,
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
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!cdnResponse) throw new Error("Failed to contact CDN endpoint");

    const responseText = await cdnResponse.text();
    console.log("CDN Response:", responseText.substring(0, 200)); // Log first 200 chars

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse CDN response:", parseError);
      throw new Error("Invalid CDN response");
    }

    const videoUrl = data.playlists || data.url || data.videoUrl;
    if (videoUrl) {
      console.log(`✅ Success! Got video URL for ${videoId}`);
      return videoUrl;
    }

    throw new Error("No video URL in CDN response");
  } catch (error) {
    console.error(`Error getting video URL for ${videoId}:`, error.message);
    return null;
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
      console.log("Fetching video list...");
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

          console.log(`\n=== Processing video URL request for: ${videoId} ===`);
          const videoUrl = await getVideoUrlWithFallback(videoId);

          if (videoUrl) {
            res.writeHead(200, {
              "Content-Type": "application/json",
              ...corsHeaders,
            });
            res.end(JSON.stringify({ videoUrl }));
          } else {
            res.writeHead(404, {
              "Content-Type": "application/json",
              ...corsHeaders,
            });
            res.end(
              JSON.stringify({
                error: "Failed to get video URL - tried all fallback methods",
              }),
            );
          }
        } catch (error) {
          console.error("Error in /api/video-url:", error);
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
        console.log(`🌐 Enhanced Server running at http://localhost:${port}`);
        console.log("📺 Enhanced Features:");
        console.log("   ✅ Better error handling and logging");
        console.log("   ✅ Multiple fallback strategies for video URLs");
        console.log("   ✅ Improved CSRF token extraction");
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
