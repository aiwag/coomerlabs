import { createFileRoute } from "@tanstack/react-router";
import { JavTubeView } from "../components/JavTubeView";

export const JavTubeMostViewed = () => (
  <JavTubeView
    sortType="most_viewed"
    title="Most Viewed"
    subtitle="Trending Now"
    gradientFrom="green"
    gradientTo="emerald"
  />
);

export const Route = createFileRoute("/javtube/most-viewed")({
  component: JavTubeMostViewed,
});
