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

        const response = await fetch("http://localhost:8080/api/videos/101132");
        if (!response.ok) {
          throw new Error("Video not found");
        }
        const data = await response.json();
        const videoData = Array.isArray(data) ? data[0] : data;
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
          onTimeUpdate={() => {}}
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
        onTimeUpdate={() => {}}
      />
    </div>
  );
};

export const Route = createFileRoute("/video")({
  component: SingleVideoPage,
  loader: async ({ params }) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/videos/${params.videoId}`,
      );
      if (!response.ok) {
        throw new Error("Video not found");
      }
      return await response.json();
    } catch (err) {
      console.error("Failed to fetch video:", err);
      return null;
    }
  },
});
