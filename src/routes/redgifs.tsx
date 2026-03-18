// RedGifs - Layout Route with Tabs
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Header } from '../components/redgifs/Header';

const RedgifsLayout = () => {
  return (
    <div className="h-screen flex flex-col bg-[var(--app-bg)] text-white overflow-hidden">
      <Header />
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export const Route = createFileRoute('/redgifs')({
  component: RedgifsLayout,
});
