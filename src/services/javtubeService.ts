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

type SortType = "main" | "top_favorites" | "uncensored" | "most_viewed" | "top_rated" | "being_watched" | "search";

export class JavtubeService {
  private baseUrl = "https://javtiful.com";

  async extractVideoData(page = 1, sortType: SortType = "main", searchQuery = ""): Promise<VideoData[]> {
    try {
      let url = "";
      if (sortType === "search" && searchQuery) {
        url = `${this.baseUrl}/search/videos?search_query=${encodeURIComponent(searchQuery)}&page=${page}`;
      } else if (sortType === "uncensored") {
        url = page > 1 ? `${this.baseUrl}/uncensored/page-${page}` : `${this.baseUrl}/uncensored`;
      } else if (sortType === "main") {
        url = page > 1 ? `${this.baseUrl}/main/page-${page}` : `${this.baseUrl}/main`;
      } else {
        url = page > 1 ? `${this.baseUrl}/videos/sort=${sortType}/page-${page}` : `${this.baseUrl}/videos/sort=${sortType}`;
      }

      const response = await fetch(url);
      if (!response.ok) return [];

      const html = await response.text();
      const dom = new JSDOM(html);
      const document = dom.window.document;
      const videoCards = document.querySelectorAll(".col.pb-3 .card");
      const videos: VideoData[] = [];

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
          const thumbnail = imgElement?.getAttribute("data-src") || imgElement?.getAttribute("src") || "";
          const hdLabel = linkElement.querySelector(".label-hd")?.textContent || "";
          const duration = linkElement.querySelector(".label-duration")?.textContent || "";
          const code = linkElement.querySelector(".label-code")?.textContent || "";
          const titleLink = card.querySelector(".video-link");
          const title = titleLink?.getAttribute("title") || titleLink?.textContent || "";

          videos.push({ id: videoId, code, title, thumbnail, duration, quality: hdLabel });
        } catch {
          // Skip card on error
        }
      });

      return videos;
    } catch {
      return [];
    }
  }

  async extractActresses(page = 1): Promise<Actress[]> {
    try {
      const url = page > 1 ? `${this.baseUrl}/actresses?page=${page}` : `${this.baseUrl}/actresses`;

      const response = await fetch(url);
      if (!response.ok) return [];

      const html = await response.text();
      const dom = new JSDOM(html);
      const document = dom.window.document;
      const actressCards = document.querySelectorAll(".channel-item");
      const actresses: Actress[] = [];

      actressCards.forEach((card) => {
        try {
          const linkElement = card.querySelector("a[href^='https://javtiful.com/actress/']");
          if (!linkElement) return;

          const href = linkElement.getAttribute("href");
          if (!href) return;

          const name = card.querySelector(".channel-item__name_details a")?.textContent?.trim() || "";
          const imgElement = card.querySelector("img");
          const thumbnail = imgElement?.getAttribute("src") || "";
          const videoCount = card.querySelector(".channel-item__name_details__total_videos .fw-bold")?.textContent?.trim() || "0";

          actresses.push({
            id: href.split("/").pop() || "",
            name,
            thumbnail,
            videoCount,
            url: href,
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

      const response = await fetch(url);
      if (!response.ok) return { videos: [], actress: null };

      const html = await response.text();
      const dom = new JSDOM(html);
      const document = dom.window.document;

      const header = document.querySelector(".col-12 .shadow.p-3");
      let actressInfo = null;
      if (header) {
        const name = header.querySelector("h4")?.textContent?.trim() || id;
        const img = header.querySelector("img")?.getAttribute("src") || "";
        const stats = header.querySelector(".channel-item__name_details__total_videos")?.textContent?.trim() || "";
        actressInfo = { name, img, stats };
      }

      const videoCards = document.querySelectorAll(".col.pb-3 .card");
      const videos: VideoData[] = [];

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
          const thumbnail = imgElement?.getAttribute("data-src") || imgElement?.getAttribute("src") || "";
          const hdLabel = linkElement.querySelector(".label-hd")?.textContent || "";
          const duration = linkElement.querySelector(".label-duration")?.textContent || "";
          const code = linkElement.querySelector(".label-code")?.textContent || "";
          const titleLink = card.querySelector(".video-link");
          const title = titleLink?.getAttribute("title") || titleLink?.textContent || "";

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
      const pageResponse = await fetch(`${this.baseUrl}/video/${videoId}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (!pageResponse.ok) return null;

      const html = await pageResponse.text();
      const dom = new JSDOM(html);
      const document = dom.window.document;

      const videoElements = document.querySelectorAll("video source");
      for (const source of videoElements) {
        const src = source.getAttribute("src");
        if (src && (src.includes("mp4") || src.includes("cdn") || src.includes("stream"))) {
          return src;
        }
      }

      const downloadLinks = document.querySelectorAll('a[href*="download"], a[href*=".mp4"]');
      for (const link of downloadLinks) {
        const href = link.getAttribute("href");
        if (href && href.includes("http")) {
          return href;
        }
      }

      return null;
    } catch {
      return null;
    }
  }
}

export const javtubeService = new JavtubeService();
