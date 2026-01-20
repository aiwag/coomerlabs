import { createFileRoute } from "@tanstack/react-router";
import { JavTubeView } from "../components/JavTubeView";

export const JavTubeBeingWatched = () => (
  <JavTubeView
    sortType="being_watched"
    title="Being Watched"
    subtitle="Live Activity"
    gradientFrom="red"
    gradientTo="pink"
  />
);

export const Route = createFileRoute("/javtube/being-watched")({
  component: JavTubeBeingWatched,
});
