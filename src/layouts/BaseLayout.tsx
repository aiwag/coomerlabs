import DragWindowRegion from "@/components/DragWindowRegion";

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <DragWindowRegion title="CoomerLabs: Funtimes" />
      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        {children}
      </main>
    </div>
  );
}
