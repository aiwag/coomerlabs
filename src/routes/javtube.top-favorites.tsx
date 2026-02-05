import { createFileRoute } from "@tanstack/react-router";
import { JavTubeView } from "../components/JavTubeView";

export const JavTubeTopFavorites = () => (
  <JavTubeView
    sortType="top_favorites"
    title="Top Favorites"
    showHeader={false}
    showSearch={false}
    gradientFrom="blue"
    gradientTo="purple"
  />
);

export const Route = createFileRoute("/javtube/top-favorites")({
  component: JavTubeTopFavorites,
});
