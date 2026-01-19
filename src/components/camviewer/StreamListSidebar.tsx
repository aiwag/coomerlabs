import React, { useMemo, useState } from "react";
import { Users, Plus, Trash2, Star, Maximize2, ChevronsLeft, ChevronsRight, Save, Bookmark, LayoutTemplate } from "lucide-react";
import { useGridStore } from "@/state/gridStore";
import { getUsernameFromUrl, generateThumbUrl } from "@/utils/formatters";
import { Button } from "@/components/ui/button";

export function StreamListSidebar({
  collapsed = false,
  onToggleCollapse,
}: {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const {
    addStream,
    streamUrls,
    favorites,
    playingStreams,
    removeStream,
    toggleFavorite,
    setFullViewMode,
    presets,
    savePreset,
    loadPreset,
    deletePreset
  } = useGridStore();
  const [newStreamUrl, setNewStreamUrl] = React.useState("");
  const [showAddInput, setShowAddInput] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeTab, setActiveTab] = useState<"streams" | "rooms">("streams");
  const [newPresetName, setNewPresetName] = useState("");
  const [isSavingPreset, setIsSavingPreset] = useState(false);

  const handleAddStream = () => {
    if (newStreamUrl.trim()) {
      addStream(newStreamUrl.trim());
      setNewStreamUrl("");
      setShowAddInput(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const urlPattern = /^https?:\/\/.+/i;
        if (urlPattern.test(text.trim())) {
          addStream(text.trim());
          setNewStreamUrl("");
        }
      }
    } catch (err) {
      console.error("Failed to read clipboard:", err);
    }
  };

  const streamData = useMemo(
    () =>
      streamUrls.map((url, index) => {
        const username = getUsernameFromUrl(url);
        return {
          url,
          username: username ?? `stream-${index}`,
          thumb: generateThumbUrl(username),
          isFavorite: favorites.has(index),
          isPlaying: playingStreams.has(index),
        };
      }),
    [streamUrls, favorites, playingStreams],
  );

  const filteredStreams = useMemo(
    () => streamData.filter(s => s.username.toLowerCase().includes(searchQuery.toLowerCase())),
    [streamData, searchQuery]
  );

  const handleSavePreset = () => {
    if (newPresetName.trim()) {
      savePreset(newPresetName.trim());
      setNewPresetName("");
      setIsSavingPreset(false);
    }
  };

  if (collapsed) {
    return (
      <div className="flex h-full w-14 flex-col items-center border-r border-white/10 bg-black/40 backdrop-blur-sm pt-2">
        <button
          onClick={onToggleCollapse}
          className="mb-2 p-1 text-neutral-500 hover:text-white transition-colors"
          title="Expand Sidebar"
        >
          <ChevronsRight size={16} />
        </button>
        {/* Minimized Tabs */}
        <div className="flex flex-col gap-2 mb-2">
          <button onClick={() => setActiveTab('streams')} className={`p-1.5 rounded ${activeTab === 'streams' ? 'bg-cyan-500/20 text-cyan-500' : 'text-neutral-500'}`}><Users size={16} /></button>
          <button onClick={() => setActiveTab('rooms')} className={`p-1.5 rounded ${activeTab === 'rooms' ? 'bg-cyan-500/20 text-cyan-500' : 'text-neutral-500'}`}><Bookmark size={16} /></button>
        </div>

        {activeTab === 'streams' ? (
          <div className="flex flex-1 flex-col items-center gap-2 py-3 w-full overflow-y-auto custom-scrollbar">
            {streamData.map((stream, index) => (
              <div
                key={index}
                className="relative group cursor-pointer"
                onClick={() => setFullViewMode(index)}
                title={stream.username}
              >
                <div className="w-8 h-8 rounded-md overflow-hidden bg-neutral-800 border border-white/10 group-hover:border-cyan-500 transition-all">
                  <img src={stream.thumb} alt={stream.username} className="w-full h-full object-cover opacity-70 group-hover:opacity-100" />
                </div>
                {stream.isPlaying && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black" />}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center gap-2 py-3 w-full overflow-y-auto custom-scrollbar">
            {presets.map((p, i) => (
              <div key={i} className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-[10px] cursor-pointer hover:bg-white/20" title={p.name} onClick={() => loadPreset(p.name)}>
                {p.name.substring(0, 2).toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full w-48 flex-col border-r border-white/10 bg-black/40 backdrop-blur-sm">
      {/* Header Tabs */}
      <header className="flex items-center justify-between border-b border-white/5 px-2 py-2 gap-1">
        <div className="flex bg-black/40 rounded p-0.5 flex-1">
          <button onClick={() => setActiveTab('streams')} className={`flex-1 text-[10px] font-bold py-1 rounded transition-all ${activeTab === 'streams' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-500 hover:text-neutral-300'}`}>STREAMS</button>
          <button onClick={() => setActiveTab('rooms')} className={`flex-1 text-[10px] font-bold py-1 rounded transition-all ${activeTab === 'rooms' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-500 hover:text-neutral-300'}`}>ROOMS</button>
        </div>
        <button
          onClick={onToggleCollapse}
          className="text-neutral-500 hover:text-white transition-colors p-1"
          title="Collapse Sidebar"
        >
          <ChevronsLeft size={16} />
        </button>
      </header>

      {/* STREAMS TAB CONTENT */}
      {activeTab === 'streams' && (
        <>
          {/* Search Bar */}
          <div className="px-2 py-1.5 border-b border-white/5">
            <input
              type="text"
              placeholder="Search streams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-cyan-500 placeholder:text-neutral-600 transition-all"
            />
          </div>

          {/* Add Input */}
          {showAddInput && (
            <div className="border-b border-white/5 bg-black/20 p-2">
              <input
                type="text"
                placeholder="Paste URL..."
                value={newStreamUrl}
                onChange={(e) => setNewStreamUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddStream()}
                className="w-full rounded border border-white/10 bg-black/50 px-2 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:border-cyan-500/50 focus:outline-none"
                autoFocus
              />
            </div>
          )}

          {/* Stream List */}
          <div className="custom-scrollbar flex-1 space-y-0.5 overflow-y-auto p-1.5">
            {filteredStreams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-neutral-600">
                <Plus size={20} className="mb-2 opacity-50" />
                <p className="text-xs">No streams</p>
              </div>
            ) : (
              filteredStreams.map((stream, index) => (
                <div
                  key={index}
                  className="group relative flex cursor-pointer items-center gap-2 rounded bg-white/5 px-2 py-1 transition-all hover:bg-white/10"
                  onClick={() => setFullViewMode(index)}
                >
                  <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded bg-black">
                    <img
                      src={stream.thumb}
                      alt={stream.username}
                      className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
                    />
                    <div
                      className={`absolute right-0.5 bottom-0.5 h-1 w-1 rounded-full border border-black ${stream.isPlaying ? "bg-green-500" : "bg-neutral-600"
                        }`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-neutral-300 transition-colors group-hover:text-white">
                      {stream.username}
                    </p>
                  </div>

                  <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(index);
                      }}
                      className="p-0.5 text-neutral-500 transition-colors hover:text-yellow-400"
                    >
                      <Star
                        size={10}
                        className={
                          stream.isFavorite ? "fill-yellow-400 text-yellow-400" : ""
                        }
                      />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFullViewMode(index);
                      }}
                      className="p-0.5 text-neutral-500 transition-colors hover:text-cyan-400"
                    >
                      <Maximize2 size={10} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeStream(index);
                      }}
                      className="p-0.5 text-neutral-500 transition-colors hover:text-red-400"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex gap-1 border-t border-white/5 bg-black/20 p-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddInput(!showAddInput)}
              className="h-7 flex-1 p-0 text-xs"
              title="Add URL"
            >
              <Plus size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePaste}
              className="h-7 flex-1 p-0 text-xs"
              title="Paste URL"
            >
              <Users size={14} />
            </Button>
          </div>
        </>
      )}

      {/* ROOMS TAB CONTENT */}
      {activeTab === 'rooms' && (
        <div className="flex flex-1 flex-col">
          {isSavingPreset ? (
            <div className="p-2 border-b border-white/5 flex gap-1">
              <input autoFocus className="flex-1 bg-white/10 rounded px-1 text-xs" placeholder="Room Name" value={newPresetName} onChange={e => setNewPresetName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSavePreset()} />
              <button onClick={handleSavePreset}><Save size={14} className="text-cyan-500" /></button>
            </div>
          ) : (
            <button onClick={() => setIsSavingPreset(true)} className="flex items-center justify-center gap-2 p-2 text-xs text-neutral-400 hover:text-white border-b border-white/5 hover:bg-white/5">
              <Plus size={12} /> Save Current Layout
            </button>
          )}

          <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
            {presets.length === 0 && <p className="text-[10px] text-neutral-600 text-center py-4">No saved rooms</p>}
            {presets.map((p, i) => (
              <div key={i} className="group flex items-center justify-between bg-white/5 rounded px-2 py-1.5 hover:bg-white/10 cursor-pointer" onClick={() => loadPreset(p.name)}>
                <div className="flex items-center gap-2">
                  <LayoutTemplate size={12} className="text-neutral-500" />
                  <span className="text-xs text-neutral-300">{p.name}</span>
                  <span className="text-[9px] text-neutral-600 bg-black/30 px-1 rounded">{p.urls.length}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deletePreset(p.name); }} className="text-neutral-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
