import React, { useMemo, useState } from "react";
import { Users, Plus, Trash2, Star, Maximize2, ChevronsLeft, ChevronsRight, Save, Bookmark, LayoutTemplate, Search } from "lucide-react";
import { useGridStore } from "@/state/gridStore";
import { getUsernameFromUrl, generateThumbUrl } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { StreamBrowserSidebar } from "@/components/camviewer/browser/StreamBrowserSidebar";

interface StreamListSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeTab: "streams" | "rooms" | "browse";
  onTabChange: (tab: "streams" | "rooms" | "browse") => void;
}

export function StreamListSidebar({ collapsed, onToggleCollapse, activeTab, onTabChange }: StreamListSidebarProps) {
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
  const [newPresetName, setNewPresetName] = useState("");
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [thumbKey, setThumbKey] = useState(Date.now());

  // Auto-refresh thumbnails every 10 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setThumbKey(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

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
        const baseThumb = generateThumbUrl(username);
        const separator = baseThumb.includes('?') ? '&' : '?';
        return {
          url,
          username: username ?? `stream-${index}`,
          thumb: `${baseThumb}${separator}t=${thumbKey}`,
          isFavorite: favorites.has(url),
          isPlaying: playingStreams.has(index),
        };
      }),
    [streamUrls, favorites, playingStreams, thumbKey],
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
      <div className="flex h-full w-14 flex-col items-center glass-sidebar pt-2">
        <button
          onClick={onToggleCollapse}
          className="mb-4 p-2 text-neutral-500 hover:text-white transition-all hover:scale-110 active:scale-90"
          title="Expand Sidebar"
        >
          <ChevronsRight size={18} />
        </button>
        {/* Minimized Tabs */}
        <div className="flex flex-col gap-3 mb-6">
          <button onClick={() => onTabChange('streams')} className={`p-2 rounded-xl transition-all ${activeTab === 'streams' ? 'bg-white/10 text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}`} title="Streams"><Users size={18} /></button>
          <button onClick={() => onTabChange('rooms')} className={`p-2 rounded-xl transition-all ${activeTab === 'rooms' ? 'bg-white/10 text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}`} title="Rooms"><Bookmark size={18} /></button>
          <button onClick={() => onTabChange('browse')} className={`p-2 rounded-xl transition-all ${activeTab === 'browse' ? 'bg-white/10 text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}`} title="Browse"><Search size={18} /></button>
        </div>

        {activeTab === 'streams' ? (
          <div className="flex flex-1 flex-col items-center gap-3 py-3 w-full overflow-y-auto custom-scrollbar">
            {streamData.map((stream, index) => (
              <div
                key={index}
                className="relative group cursor-pointer"
                onClick={() => setFullViewMode(index)}
                title={stream.username}
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/40 border border-white/5 group-hover:border-white/20 group-hover:scale-110 transition-all shadow-xl">
                  <img src={stream.thumb} alt={stream.username} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
                {stream.isPlaying && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black/50 shadow-lg" />}
              </div>
            ))}
          </div>
        ) : activeTab === 'rooms' ? (
          <div className="flex flex-1 flex-col items-center gap-3 py-3 w-full overflow-y-auto custom-scrollbar">
            {presets.map((p, i) => (
              <div key={i} className="w-9 h-9 rounded-xl glass-card flex items-center justify-center text-[10px] font-black cursor-pointer hover:bg-white/10 transition-all hover:scale-105" title={p.name} onClick={() => loadPreset(p.name)}>
                {p.name.substring(0, 2).toUpperCase()}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-neutral-600">
            <Search size={18} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col glass-sidebar">
      {/* Header Tabs */}
      <header className="flex flex-shrink-0 items-center justify-between glass-header p-2 gap-2">
        <div className="flex bg-black/20 rounded-lg p-1 flex-1">
          <button onClick={() => onTabChange('streams')} className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all duration-300 ${activeTab === 'streams' ? 'bg-white/15 text-white shadow-lg backdrop-blur-md' : 'text-neutral-500 hover:text-neutral-300'}`}>STREAMS</button>
          <button onClick={() => onTabChange('rooms')} className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all duration-300 ${activeTab === 'rooms' ? 'bg-white/15 text-white shadow-lg backdrop-blur-md' : 'text-neutral-500 hover:text-neutral-300'}`}>ROOMS</button>
          <button onClick={() => onTabChange('browse')} className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all duration-300 ${activeTab === 'browse' ? 'bg-white/15 text-white shadow-lg backdrop-blur-md' : 'text-neutral-500 hover:text-neutral-300'}`}>BROWSE</button>
        </div>
        <button
          onClick={onToggleCollapse}
          className="text-neutral-500 hover:text-white transition-all p-1.5 hover:scale-110 active:scale-90"
          title="Collapse Sidebar"
        >
          <ChevronsLeft size={16} />
        </button>
      </header>

      {/* STREAMS TAB CONTENT */}
      {activeTab === 'streams' && (
        <>
          {/* Search Bar */}
          <div className="px-3 py-2 border-b border-white/5 bg-black/10">
            <div className="relative group">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-cyan-400 transition-colors" size={12} />
              <input
                type="text"
                placeholder="Find in grid..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg pl-8 pr-2 py-1.5 text-[11px] text-white placeholder:text-neutral-600 transition-all liquid-input"
              />
            </div>
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
                className="w-full px-3 py-1.5 text-xs text-white placeholder:text-neutral-600 transition-all liquid-input"
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
                  className="group relative flex cursor-pointer items-center gap-3 rounded-xl glass-card py-2 px-3 transition-all hover:bg-white/10 border-white/5 hover:border-white/20 active:scale-[0.98]"
                  onClick={() => setFullViewMode(index)}
                >
                  <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-black/40 shadow-inner">
                    <img
                      src={stream.thumb}
                      alt={stream.username}
                      className="h-full w-full object-cover opacity-70 transition-all duration-500 group-hover:scale-110 group-hover:opacity-100"
                    />
                    <div
                      className={`absolute right-1 bottom-1 h-2 w-2 rounded-full border border-black/50 shadow-lg ${stream.isPlaying ? "bg-green-500" : "bg-neutral-600"}`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-neutral-300 tracking-tight group-hover:text-white transition-colors">
                      {stream.username}
                    </p>
                    <p className="text-[10px] text-neutral-500 uppercase font-black tracking-widest mt-0.5">Live</p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(stream.url); }}
                      className="p-1.5 rounded-lg bg-white/5 text-neutral-400 hover:text-yellow-400 hover:bg-white/10"
                    >
                      <Star size={12} className={stream.isFavorite ? "fill-yellow-400 text-yellow-400" : ""} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeStream(index); }}
                      className="p-1.5 rounded-lg bg-white/5 text-neutral-400 hover:text-red-400 hover:bg-white/10"
                    >
                      <Trash2 size={12} />
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
              <input autoFocus className="flex-1 px-2 py-1.5 text-xs liquid-input" placeholder="Room Name" value={newPresetName} onChange={e => setNewPresetName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSavePreset()} />
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

      {/* BROWSE TAB CONTENT */}
      {activeTab === 'browse' && (
        <StreamBrowserSidebar />
      )}
    </div>
  );
}
