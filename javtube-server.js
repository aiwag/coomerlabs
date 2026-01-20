// javtube-server.js - Simple working server for javtube
const http = require("http");
const { JSDOM } = require("jsdom");

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Simple video data extraction with pagination
async function extractVideoData(page = 1, sortType = "main", searchQuery = "") {
  try {
    let url = "";
    if (sortType === "search" && searchQuery) {
      url = `https://javtiful.com/search/videos?search_query=${encodeURIComponent(searchQuery)}&page=${page}`;
    } else if (sortType === "uncensored") {
      url = page > 1 ? `https://javtiful.com/uncensored/page-${page}` : "https://javtiful.com/uncensored";
    } else if (sortType === "main") {
      url = page > 1 ? `https://javtiful.com/main/page-${page}` : "https://javtiful.com/main";
    } else {
      url = page > 1 ? `https://javtiful.com/videos/sort=${sortType}/page-${page}` : `https://javtiful.com/videos/sort=${sortType}`;
    }
    console.log(`Scraping Videos [${sortType}]: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch ${sortType} page ${page}`);
      return [];
    }

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

    console.log(`Found ${videos.length} videos [${sortType}] page ${page}`);
    return videos;
  } catch (error) {
    console.error(`Error fetching ${sortType} page ${page}:`, error);
    return [];
  }
}

// Simple actress data extraction with pagination
async function extractActresses(page = 1) {
  try {
    const url = page > 1 ? `https://javtiful.com/actresses?page=${page}` : "https://javtiful.com/actresses";
    console.log(`Scraping Actresses: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch actresses page ${page}`);
      return [];
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const actressCards = document.querySelectorAll(".channel-item");
    const actresses = [];

    actressCards.forEach((card) => {
      try {
        const linkElement = card.querySelector("a[href^='https://javtiful.com/actress/']");
        if (!linkElement) return;

        const href = linkElement.getAttribute("href");
        const name = card.querySelector(".channel-item__name_details a")?.textContent?.trim() || "";
        const imgElement = card.querySelector("img");
        const thumbnail = imgElement?.getAttribute("src") || "";
        const videoCount = card.querySelector(".channel-item__name_details__total_videos .fw-bold")?.textContent?.trim() || "0";

        actresses.push({
          id: href.split("/").pop(),
          name,
          thumbnail,
          videoCount,
          url: href
        });
      } catch (error) {
        console.error("Error parsing actress card:", error);
      }
    });

    console.log(`Found ${actresses.length} actresses on page ${page}`);
    return actresses;
  } catch (error) {
    console.error(`Error fetching actresses page ${page}:`, error);
    return [];
  }
}

async function extractActressVideos(id, page = 1) {
  try {
    const url = page > 1 ? `https://javtiful.com/actress/${id}?page=${page}` : `https://javtiful.com/actress/${id}`;
    console.log(`Scraping Actress Videos: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch actress videos for ${id} page ${page}`);
      return { videos: [], actress: null };
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Extract Actress Info
    let actressInfo = null;
    const header = document.querySelector(".col-12 .shadow.p-3");
    if (header) {
      const name = header.querySelector("h4")?.textContent?.trim() || id;
      const img = header.querySelector("img")?.getAttribute("src") || "";
      const stats = header.querySelector(".channel-item__name_details__total_videos")?.textContent?.trim() || "";
      actressInfo = { name, img, stats };
    }

    const videoCards = document.querySelectorAll(".col.pb-3 .card");
    const videos = [];

    videoCards.forEach((card) => {
      try {
        const linkElement = card.querySelector("a.video-tmb");
        if (!linkElement) return;

        const href = linkElement.getAttribute("href");
        if (!href) return;

        const videoIdMatch = href.match(/\/video\/(\d+)\//);
        if (!videoIdMatch) return;

        const videoId = videoIdMatch[1];
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
        console.error("Error parsing actress video card:", error);
      }
    });

    console.log(`Found ${videos.length} videos for actress ${id} on page ${page}`);
    return { videos, actress: actressInfo };
  } catch (error) {
    console.error(`Error fetching actress videos ${id} page ${page}:`, error);
    return { videos: [], actress: null };
  }
}

// Simple video URL extraction with direct fallback
async function getVideoUrlDirect(videoId) {
  console.log(`Getting video URL for: ${videoId}`);

  try {
    // Try direct page fetch first
    const pageResponse = await fetch(`https://javtiful.com/video/${videoId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    if (!pageResponse.ok) {
      throw new Error(`Failed to fetch video page: ${pageResponse.status}`);
    }

    const html = await pageResponse.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Try multiple strategies to get video URL
    let videoUrl = null;

    // Strategy 1: Look for direct video sources
    const videoElements = document.querySelectorAll("video source");
    for (const source of videoElements) {
      const src = source.getAttribute("src");
      if (
        src &&
        (src.includes("mp4") || src.includes("cdn") || src.includes("stream"))
      ) {
        console.log("Found direct video source:", src);
        videoUrl = src;
        break;
      }
    }

    // Strategy 2: Look for download links
    if (!videoUrl) {
      const downloadLinks = document.querySelectorAll(
        'a[href*="download"], a[href*=".mp4"]',
      );
      for (const link of downloadLinks) {
        const href = link.getAttribute("href");
        if (href && href.includes("http")) {
          console.log("Found download link:", href);
          videoUrl = href;
          break;
        }
      }
    }

    // Strategy 3: Try to construct from CDN if available
    if (!videoUrl) {
      console.log("Trying CDN extraction...");
      const tokenElement = document.getElementById("token_full");
      const token = tokenElement?.getAttribute("data-csrf-token");

      if (token) {
        const cookies = pageResponse.headers.get("set-cookie") || "";
        const formData = new URLSearchParams();
        formData.append("video_id", videoId);
        formData.append("pid_c", "");
        formData.append("token", token);

        try {
          const cdnResponse = await fetch("https://javtiful.com/ajax/get_cdn", {
            method: "POST",
            headers: {
              Cookie: cookies
                .split(",")
                .map((c) => c.split(";")[0])
                .join("; "),
              Referer: `https://javtiful.com/video/${videoId}`,
              Origin: "https://javtiful.com",
              "User-Agent":
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData.toString(),
          });

          if (cdnResponse.ok) {
            const responseText = await cdnResponse.text();
            const data = JSON.parse(responseText);
            videoUrl = data.playlists || data.url || data.videoUrl;
            console.log("✅ Got video URL from CDN:", videoUrl);
          }
        } catch (error) {
          console.log("CDN extraction failed:", error.message);
        }
      }
    }

    if (videoUrl) {
      console.log("✅ Success! Found video URL for", videoId);
      return videoUrl;
    } else {
      throw new Error("Could not find video URL");
    }
  } catch (error) {
    console.error("Error getting video URL:", error.message);
    throw error;
  }
}

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
      const page = parseInt(url.searchParams.get("page")) || 1;
      const sort = url.searchParams.get("sort") || "main";
      const searchQuery = url.searchParams.get("q") || "";
      console.log(`Fetching video list [${sort}] page ${page}...`);
      const videos = await extractVideoData(page, sort, searchQuery);
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

  // API route to get a list of actresses
  if (url.pathname === "/api/actresses") {
    try {
      const page = parseInt(url.searchParams.get("page")) || 1;
      console.log(`Fetching actress list for page ${page}...`);
      const actresses = await extractActresses(page);
      res.writeHead(200, {
        "Content-Type": "application/json",
        ...corsHeaders,
      });
      res.end(JSON.stringify(actresses));
    } catch (error) {
      console.error("Error fetching actresses:", error);
      res.writeHead(500, {
        "Content-Type": "application/json",
        ...corsHeaders,
      });
      res.end(JSON.stringify({ error: "Failed to fetch actresses" }));
    }
    return;
  }
  // API route to get a list of videos for a specific actress
  if (url.pathname === "/api/actress-videos") {
    try {
      const id = url.searchParams.get("id");
      const page = parseInt(url.searchParams.get("page")) || 1;

      if (!id) {
        res.writeHead(400, { "Content-Type": "application/json", ...corsHeaders });
        res.end(JSON.stringify({ error: "Actress ID is required" }));
        return;
      }

      console.log(`Fetching videos for actress ${id} page ${page}...`);
      const data = await extractActressVideos(id, page);
      res.writeHead(200, {
        "Content-Type": "application/json",
        ...corsHeaders,
      });
      res.end(JSON.stringify(data));
    } catch (error) {
      console.error("Error fetching actress videos:", error);
      res.writeHead(500, {
        "Content-Type": "application/json",
        ...corsHeaders,
      });
      res.end(JSON.stringify({ error: "Failed to fetch actress videos" }));
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

          const videoUrl = await getVideoUrlDirect(videoId);

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
                error: "Failed to get video URL - video may not be available",
              }),
            );
          }
        } catch (error) {
          console.error("Error in /api/video-url:", error.message);
          res.writeHead(500, {
            "Content-Type": "application/json",
            ...corsHeaders,
          });
          res.end(JSON.stringify({ error: "Failed to get video URL" }));
        }
      });
    } catch (error) {
      console.error("Error parsing request:", error.message);
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
        console.log(`🎬 JavTube Server running at http://localhost:${port}`);
        console.log("📺 Features:");
        console.log("   ✅ Simple and reliable video URL extraction");
        console.log("   ✅ Multiple fallback strategies");
        console.log("   ✅ Direct video source detection");
        console.log("   ✅ CDN fallback with better error handling");
        console.log("   GET  /api/videos - Get list of videos");
        console.log("   GET  /api/actresses - Get list of actresses");
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

// Start server if this file is run directly
if (require.main === module) {
  startServer().catch(console.error);
}

module.exports = { startServer };
