import { createFileRoute } from "@tanstack/react-router";
import { EnhancedVideoPlayer } from "../components/EnhancedVideoPlayer";
import { useState, useEffect } from "react";

export const SingleVideoPage = () => {
  const videoData = Route.useLoaderData() as any;
  const [video, setVideo] = useState<any | null>(videoData);
  const [loading, setLoading] = useState(!videoData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (videoData && !videoData.videoUrl) {
      const fetchVideoUrl = async () => {
        try {
          const result = await window.javtube.getVideoUrl(videoData.id);
          if (result.success && result.data.videoUrl) {
            setVideo({ ...videoData, videoUrl: result.data.videoUrl });
          }
        } catch (err) {
          console.error("Failed to fetch video URL:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchVideoUrl();
    } else if (videoData) {
      setLoading(false);
    }
  }, [videoData]);

  if (loading && !video) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
          <span className="text-xs font-black uppercase tracking-widest text-cyan-500 animate-pulse">Extracting Alpha Stream...</span>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 p-8 text-white">
        <div className="max-w-md text-center glass-card p-12 rounded-[2.5rem] border border-white/10">
          <h1 className="mb-4 text-2xl font-black tracking-tight text-red-500 uppercase">System Error</h1>
          <p className="mb-8 text-sm font-medium text-white/40">{error || "Video protocol not initialized or content unavailable."}</p>
          <button
            onClick={() => (window.location.href = "/javtube")}
            className="w-full rounded-2xl bg-cyan-600 px-6 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-cyan-500 shadow-lg shadow-cyan-500/20"
          >
            Return to Base
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <EnhancedVideoPlayer
        video={video}
        videoUrl={video.videoUrl || ""}
        poster={video.thumbnail}
        onClose={() => (window.location.href = "/javtube")}
        onTimeUpdate={() => { }}
      />
    </div>
  );
};

export const Route = createFileRoute("/video")({
  component: SingleVideoPage,
  loader: async ({ params }) => {
    try {
      // Use the provided videoId from the URL
      const { videoId } = params as any;
      const result = await window.javtube.getVideos(1, "search", videoId);
      if (!result.success || !result.data || result.data.length === 0) {
        return null;
      }
      const video = result.data[0];

      // Attempt to fetch the direct playable URL
      try {
        const urlResult = await window.javtube.getVideoUrl(video.id);
        if (urlResult.success) {
          video.videoUrl = urlResult.data.videoUrl;
        }
      } catch (e) {
        console.warn("Could not fetch video URL in loader, component will retry");
      }

      return video;
    } catch (err) {
      console.error("Failed to fetch video:", err);
      return null;
    }
  },
});
