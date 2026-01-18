import React from "react";
import DragWindowRegion from "@/components/DragWindowRegion";
import NavigationMenu from "@/components/template/NavigationMenu";

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DragWindowRegion title="CoomerLabs: Funtimes" />
      <NavigationMenu />
      <main className="flex-1 overflow-hidden">{children}</main>
    </>
  );
}
