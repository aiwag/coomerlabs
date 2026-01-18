import React, { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useGridStore } from "@/state/gridStore";
import { SortableWebview } from "./SortableWebview";

export function WaterfallLayout() {
  const { streamUrls, handleDragEnd } = useGridStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <DndContext
      sensors={useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
      )}
      onDragStart={(e) => setActiveId(e.active.id as string)}
      onDragEnd={(e) => {
        handleDragEnd(e);
        setActiveId(null);
      }}
    >
      <SortableContext
        items={streamUrls}
        strategy={verticalListSortingStrategy}
      >
        <div className="custom-scrollbar flex h-full w-full flex-col gap-1 overflow-y-auto p-2">
          {streamUrls.map((url, index) => (
            <SortableWebview
              key={url}
              id={url}
              url={url}
              index={index}
              isDragging={activeId === url}
              isDraggable={true}
              width="100%"
              height="192px"
              top={0}
              left={0}
              viewMode="waterfall"
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeId ? <DraggingItem url={activeId} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function DraggingItem({ url }: { url: string }) {
  const username = url.match(/chaturbate\.com\/([^/]+)/)?.[1] ?? "unknown";
  return (
    <div className="relative w-full overflow-hidden rounded-lg border-2 border-cyan-500 bg-cyan-500 shadow-2xl">
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-lg font-semibold text-white">{username}</p>
      </div>
    </div>
  );
}
