import { createFileRoute } from "@tanstack/react-router";
import { JavTubeView } from "../components/JavTubeView";

export const JavTubeTopRated = () => (
  <JavTubeView
    sortType="top_rated"
    title="Top Rated"
    subtitle="Highest Scores"
    showHeader={false}
    showSearch={false}
    gradientFrom="yellow"
    gradientTo="orange"
  />
);

export const Route = createFileRoute("/javtube/top-rated")({
  component: JavTubeTopRated,
});
