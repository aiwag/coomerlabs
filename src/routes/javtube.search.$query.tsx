import { createFileRoute } from "@tanstack/react-router";
import { JavTubeView } from "../components/JavTubeView";

export const JavTubeSearch = () => {
  const { query } = Route.useParams();
  return (
    <JavTubeView
      sortType="search"
      title={`Search: ${query}`}
      subtitle="Search Results"
      initialQuery={query}
      gradientFrom="blue"
      gradientTo="purple"
    />
  );
};

export const Route = createFileRoute("/javtube/search/$query")({
  component: JavTubeSearch,
});
