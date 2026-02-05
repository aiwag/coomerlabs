import React from "react";
import DragWindowRegion from "@/components/DragWindowRegion";
import NavigationMenu from "@/components/template/NavigationMenu";

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <DragWindowRegion title="CoomerLabs: Funtimes" />
      <NavigationMenu />
      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        {children}
      </main>
    </div>
  );
}
