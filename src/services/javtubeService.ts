import { JSDOM } from "jsdom";

interface VideoData {
  id: string;
  code: string;
  title: string;
  thumbnail: string;
  duration: string;
  quality: string;
}

interface Actress {
  id: string;
  name: string;
  thumbnail: string;
  videoCount: string;
  url: string;
}

export type SortType =
  | "main"
  | "top_favorites"
  | "uncensored"
  | "censored"
  | "trending"
  | "most_viewed"
  | "top_rated"
  | "being_watched"
  | "search"
  | "all";

export class JavtubeService {
  private baseUrl = "https://javtiful.com";
  private commonHeaders = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache"
  };

  async extractVideoData(page = 1, sortType: SortType = "main", searchQuery = ""): Promise<VideoData[]> {
    try {
      let url = "";
      if (sortType === "search" && searchQuery) {
        url = `${this.baseUrl}/search/videos?search_query=${encodeURIComponent(searchQuery)}&page=${page}`;
      } else if (sortType === "uncensored") {
        url = page > 1 ? `${this.baseUrl}/uncensored/page-${page}` : `${this.baseUrl}/uncensored`;
      } else if (sortType === "censored") {
        url = page > 1 ? `${this.baseUrl}/censored/page-${page}` : `${this.baseUrl}/censored`;
      } else if (sortType === "trending") {
        url = page > 1 ? `${this.baseUrl}/trending/page-${page}` : `${this.baseUrl}/trending`;
      } else if (sortType === "main" || sortType === "all") {
        url = page > 1 ? `${this.baseUrl}/main/page-${page}` : `${this.baseUrl}/main`;
      } else {
        url = page > 1 ? `${this.baseUrl}/videos/sort=${sortType}/page-${page}` : `${this.baseUrl}/videos/sort=${sortType}`;
      }

      console.log(`[JavtubeService] Fetching videos [${sortType}]: ${url}`);
      const response = await fetch(url, { headers: this.commonHeaders });
      if (!response.ok) {
        console.error(`[JavtubeService] Failed to fetch videos: ${response.status} ${response.statusText}`);
        return [];
      }

      const html = await response.text();
      const dom = new JSDOM(html);
      const document = dom.window.document;

      // Try to find video cards using multiple selector possibilities
      let videoCards = document.querySelectorAll(".col.pb-3 .card");
      if (videoCards.length === 0) {
        videoCards = document.querySelectorAll(".card.shadow-sm");
      }

      const videos: VideoData[] = [];

      videoCards.forEach((card) => {
        try {
          const linkElement = card.querySelector("a.video-tmb");
          if (!linkElement) return;

          const href = linkElement.getAttribute("href");
          if (!href) return;

          // More robust ID matching (handles both /video/123 and /video/123/slug)
          const idMatch = href.match(/\/video\/(\d+)/);
          if (!idMatch) return;

          const videoId = idMatch[1];
          const imgElement = linkElement.querySelector("img");
          const thumbnail = imgElement?.getAttribute("data-src") || imgElement?.getAttribute("src") || "";
          const hdLabel = card.querySelector(".label-hd, .label-fhd")?.textContent?.trim() || "";
          const duration = card.querySelector(".label-duration")?.textContent?.trim() || "";
          const code = card.querySelector(".label-code")?.textContent?.trim() || "";
          const titleLink = card.querySelector(".video-link");
          const title = titleLink?.getAttribute("title") || titleLink?.textContent?.trim() || "";

          videos.push({ id: videoId, code, title, thumbnail, duration, quality: hdLabel });
        } catch (e) {
          // Skip card on error
          console.warn("[JavtubeService] Error parsing video card:", e);
        }
      });

      console.log(`[JavtubeService] Extracted ${videos.length} videos`);
      return videos;
    } catch (err) {
      console.error("[JavtubeService] extractVideoData error:", err);
      return [];
    }
  }

  async extractActresses(page = 1): Promise<Actress[]> {
    try {
      const url = page > 1 ? `${this.baseUrl}/actresses?page=${page}` : `${this.baseUrl}/actresses`;

      console.log(`[JavtubeService] Fetching actresses: ${url}`);
      const response = await fetch(url, { headers: this.commonHeaders });
      if (!response.ok) return [];

      const html = await response.text();
      const dom = new JSDOM(html);
      const document = dom.window.document;
      const actressCards = document.querySelectorAll(".channel-item");
      const actresses: Actress[] = [];

      actressCards.forEach((card) => {
        try {
          const linkElement = card.querySelector("a[href*='/actress/']");
          if (!linkElement) return;

          const href = linkElement.getAttribute("href") || "";
          const fullUrl = href.startsWith("http") ? href : `${this.baseUrl}${href}`;

          const name = card.querySelector(".channel-item__name_details a, h4")?.textContent?.trim() || "";
          const imgElement = card.querySelector("img");
          const thumbnail = imgElement?.getAttribute("data-src") || imgElement?.getAttribute("src") || "";
          const videoCount = card.querySelector(".channel-item__name_details__total_videos .fw-bold, .total-videos")?.textContent?.trim() || "0";

          actresses.push({
            id: fullUrl.split("/").filter(Boolean).pop() || "",
            name,
            thumbnail,
            videoCount,
            url: fullUrl,
          });
        } catch {
          // Skip card on error
        }
      });

      return actresses;
    } catch {
      return [];
    }
  }

  async extractActressVideos(id: string, page = 1): Promise<{ videos: VideoData[]; actress: { name: string; img: string; stats: string } | null }> {
    try {
      const url = page > 1 ? `${this.baseUrl}/actress/${id}?page=${page}` : `${this.baseUrl}/actress/${id}`;

      console.log(`[JavtubeService] Fetching actress videos: ${url}`);
      const response = await fetch(url, { headers: this.commonHeaders });
      if (!response.ok) return { videos: [], actress: null };

      const html = await response.text();
      const dom = new JSDOM(html);
      const document = dom.window.document;

      const header = document.querySelector(".col-12 .shadow.p-3, .channel-item__details, #channel-content .content-section-title");
      let actressInfo = null;
      if (header) {
        const name = header.querySelector("h4, .fw-semibold")?.textContent?.trim() || id;
        const img = header.querySelector("img")?.getAttribute("src") || header.querySelector("img")?.getAttribute("data-src") || "";
        const stats = header.querySelector(".channel-item__name_details__total_videos, .total-videos")?.textContent?.trim() || "";
        actressInfo = { name, img, stats };
      }

      const videoCards = document.querySelectorAll(".col.pb-3 .card, .card.shadow-sm");
      const videos: VideoData[] = [];

      videoCards.forEach((card) => {
        try {
          const linkElement = card.querySelector("a.video-tmb");
          if (!linkElement) return;

          const href = linkElement.getAttribute("href");
          if (!href) return;

          const videoIdMatch = href.match(/\/video\/(\d+)/);
          if (!videoIdMatch) return;

          const videoId = videoIdMatch[1];
          const imgElement = linkElement.querySelector("img");
          const thumbnail = imgElement?.getAttribute("data-src") || imgElement?.getAttribute("src") || "";
          const hdLabel = card.querySelector(".label-hd, .label-fhd")?.textContent?.trim() || "";
          const duration = card.querySelector(".label-duration")?.textContent?.trim() || "";
          const code = card.querySelector(".label-code")?.textContent?.trim() || "";
          const titleLink = card.querySelector(".video-link");
          const title = titleLink?.getAttribute("title") || titleLink?.textContent?.trim() || "";

          videos.push({ id: videoId, code, title, thumbnail, duration, quality: hdLabel });
        } catch {
          // Skip card on error
        }
      });

      return { videos, actress: actressInfo };
    } catch {
      return { videos: [], actress: null };
    }
  }

  async getVideoUrl(videoId: string): Promise<string | null> {
    try {
      console.log(`[JavtubeService] Getting video URL for: ${videoId}`);
      const pageResponse = await fetch(`${this.baseUrl}/video/${videoId}`, {
        headers: {
          ...this.commonHeaders,
          "Referer": this.baseUrl
        },
      });

      if (!pageResponse.ok) {
        console.error(`[JavtubeService] Failed to fetch video page: ${pageResponse.status}`);
        return null;
      }

      // Update base URL based on the response URL to handle redirects (e.g. to jp.javtiful.com)
      const finalUrl = pageResponse.url;
      let currentBaseUrl = this.baseUrl;
      try {
        const urlObj = new URL(finalUrl);
        currentBaseUrl = `${urlObj.protocol}//${urlObj.host}`;
        console.log(`[JavtubeService] Updated base URL to: ${currentBaseUrl}`);
      } catch (e) {
        console.warn("[JavtubeService] Failed to parse final URL, keeping default");
      }

      // Extract cookies
      const setCookieHeader = pageResponse.headers.get("set-cookie");
      let cookieString = "";
      if (setCookieHeader) {
        if (typeof setCookieHeader === 'string') {
          // Basic comma split (flawed for dates but works for simple session cookies usually found here)
          // Better: use a regex or library if available, but for now stick to the working logic from standalone
          cookieString = setCookieHeader.split(",").map((c: string) => c.split(";")[0]).join("; ");
        } else if (Array.isArray(setCookieHeader)) {
          // @ts-ignore
          cookieString = setCookieHeader.map((c: string) => c.split(";")[0]).join("; ");
        }
      }

      const html = await pageResponse.text();
      const dom = new JSDOM(html);
      const document = dom.window.document;

      // ---------------------------------------------------------
      // STRATEGY 0: AJAX API
      // ---------------------------------------------------------
      try {
        // 1. Extract CSRF Token
        let token = document.getElementById("token_full")?.getAttribute("data-csrf-token");
        if (!token) {
          const tokenInput = document.querySelector('input[name*="token"]');
          token = tokenInput?.getAttribute("value") || tokenInput?.getAttribute("data-csrf-token");
        }

        if (token) {
          console.log(`[JavtubeService] Found CSRF Token: ${token}, attempting API fetch to ${currentBaseUrl}...`);

          const formData = new FormData();
          formData.append("video_id", videoId);
          formData.append("pid_c", "");
          formData.append("token", token);

          const apiResponse = await fetch(`${currentBaseUrl}/ajax/get_cdn`, {
            method: "POST",
            headers: {
              ...this.commonHeaders,
              "Cookie": cookieString,
              "Referer": `${currentBaseUrl}/video/${videoId}`,
              "Origin": currentBaseUrl,
              "X-Requested-With": "XMLHttpRequest" // Often needed for AJAX
            },
            body: formData
          });

          if (apiResponse.ok) {
            const apiData = await apiResponse.json();
            console.log("[JavtubeService] API response:", apiData);

            // The API returns { playlists: "http..." } or similar
            if (apiData.playlists) {
              return apiData.playlists;
            }
            if (apiData.video_url) {
              return apiData.video_url;
            }
          } else {
            console.warn(`[JavtubeService] API fetch failed: ${apiResponse.status}`);
          }
        }
      } catch (e) {
        console.error("[JavtubeService] API Strategy failed:", e);
      }

      // ---------------------------------------------------------
      // FALLBACK STRATEGIES (Existing Logic)
      // ---------------------------------------------------------

      // Strategy 1: Check video elements (both <video src> and <source src>)
      const videoElements = document.querySelectorAll("video, video source");
      for (const el of videoElements) {
        const src = el.getAttribute("src");
        if (src && (src.includes(".mp4") || src.includes(".m3u8") || src.includes("token=") || src.includes("/stream/"))) {
          if (src.startsWith("http") || src.startsWith("//")) {
            return src.startsWith("//") ? `https:${src}` : src;
          }
          return `${this.baseUrl}${src.startsWith("/") ? "" : "/"}${src}`;
        }
      }

      // Strategy 2: Check download buttons
      const downloadLinks = document.querySelectorAll('a[href*="download"], a[href*=".mp4"]');
      for (const link of downloadLinks) {
        const href = link.getAttribute("href");
        if (href && (href.includes("http") || href.startsWith("/"))) {
          if (href.startsWith("http")) return href;
          return `${this.baseUrl}${href}`;
        }
      }

      // Strategy 3: Script variables (Common patterns)
      const scripts = document.querySelectorAll("script");
      for (const script of scripts) {
        const content = script.textContent || "";
        const urlMatch = content.match(/(?:file|source|src|video_url|stream_url)\s*[:=]\s*["']((?:https?:\/|\/)[^"']+\.(?:mp4|m3u8)[^"']*)["']/i);
        if (urlMatch) {
          let url = urlMatch[1];
          if (url.startsWith("/")) url = `${this.baseUrl}${url}`;
          return url;
        }
      }

      // Strategy 4: Brute force regex
      const bruteForceMatch = html.match(/https?:\/\/[^"'\s]+\.(?:mp4|m3u8)[^"'\s]*/i);
      if (bruteForceMatch) {
        return bruteForceMatch[0];
      }

      // Strategy 5: Check for iframes (Embeds)
      const iframes = document.querySelectorAll("iframe");
      for (const iframe of iframes) {
        const src = iframe.getAttribute("src");
        if (src && (src.includes("embed") || src.includes("player"))) {
          // Just logging for now, scraping nested iframes is complex
          console.log("[JavtubeService] Found potential embed iframe:", src);
        }
      }

      console.warn("[JavtubeService] All strategies failed.");
      return null;
    } catch (err) {
      console.error("[JavtubeService] getVideoUrl error:", err);
      return null;
    }
  }
}

export const javtubeService = new JavtubeService();
