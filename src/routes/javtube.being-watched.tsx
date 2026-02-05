import { createFileRoute } from "@tanstack/react-router";
import { JavTubeView } from "../components/JavTubeView";

export const JavTubeBeingWatched = () => (
  <JavTubeView
    sortType="being_watched"
    title="Being Watched"
    showHeader={false}
    showSearch={false}
    gradientFrom="pink"
    gradientTo="red"
  />
);

export const Route = createFileRoute("/javtube/being-watched")({
  component: JavTubeBeingWatched,
});
