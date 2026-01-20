import { createFileRoute } from "@tanstack/react-router";
import { JavTubeView } from "../components/JavTubeView";

export const JavTubeTopFavorites = () => (
  <JavTubeView
    sortType="top_favorites"
    title="Top Favorites"
    subtitle="Most Loved Videos"
    gradientFrom="red"
    gradientTo="orange"
  />
);

export const Route = createFileRoute("/javtube/top-favorites")({
  component: JavTubeTopFavorites,
});
