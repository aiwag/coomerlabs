import { createFileRoute } from "@tanstack/react-router";
import { JavTubeView } from "../components/JavTubeView";

export const JavTubeMostViewed = () => (
  <JavTubeView
    sortType="most_viewed"
    title="Most Viewed"
    subtitle="Trending Now"
    showHeader={false}
    showSearch={false}
    gradientFrom="purple"
    gradientTo="pink"
  />
);

export const Route = createFileRoute("/javtube/most-viewed")({
  component: JavTubeMostViewed,
});
