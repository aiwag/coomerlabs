import { createFileRoute } from "@tanstack/react-router";
import { EnhancedVideoPlayer } from "../components/EnhancedVideoPlayer";
import { useState, useEffect } from "react";

export const SingleVideoPage = () => {
  const [video, setVideo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        setError(null);

        // Usage of the integrated service
        const result = await window.javtube.getVideos(1, "search", "101132");
        if (!result.success || !result.data || result.data.length === 0) {
          throw new Error("Video not found");
        }

        const videoData = result.data[0];
        setVideo(videoData);
      } catch (err: any) {
        setError(`Failed to load video: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 p-8 text-white">
        <div className="max-w-2xl text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Error</h1>
          <p className="mb-4 text-gray-300">{error}</p>
          <button
            onClick={() => (window.location.href = "/javtube")}
            className="rounded bg-purple-600 px-6 py-2 text-white transition-colors hover:bg-purple-700"
          >
            Back to Videos
          </button>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <EnhancedVideoPlayer
          video={video}
          videoUrl={video.videoUrl || ""}
          poster={video.thumbnail}
          onClose={() => (window.location.href = "/javtube")}
          onTimeUpdate={() => { }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
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
      const result = await window.javtube.getVideos(1, "search", params.videoId);
      if (!result.success || !result.data || result.data.length === 0) {
        throw new Error("Video not found");
      }
      return result.data[0];
    } catch (err) {
      console.error("Failed to fetch video:", err);
      return null;
    }
  },
});
