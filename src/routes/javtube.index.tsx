import { createFileRoute } from "@tanstack/react-router";
import { JavTubeView } from "../components/JavTubeView";

export const JavTubeIndex = () => (
  <JavTubeView
    sortType="main"
    title=""
    showSearch={false}
    showHeader={false}
  />
);

export const Route = createFileRoute("/javtube/")({
  component: JavTubeIndex,
});
