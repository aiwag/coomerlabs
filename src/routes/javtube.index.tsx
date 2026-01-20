import { createFileRoute } from "@tanstack/react-router";
import { JavTubeView } from "../components/JavTubeView";

export const JavTubeIndex = () => (
  <JavTubeView
    sortType="main"
    title=""
    showSearch={true}
    showHeader={false}
  />
);

export const Route = createFileRoute("/javtube/")({
  component: JavTubeIndex,
});
