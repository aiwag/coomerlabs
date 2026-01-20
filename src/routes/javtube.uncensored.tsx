import { createFileRoute } from "@tanstack/react-router";
import { JavTubeView } from "../components/JavTubeView";

export const JavTubeUncensored = () => (
  <JavTubeView
    sortType="uncensored"
    title="Uncensored"
    subtitle="Uncut Collection"
    gradientFrom="blue"
    gradientTo="cyan"
  />
);

export const Route = createFileRoute("/javtube/uncensored")({
  component: JavTubeUncensored,
});
