import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X, Maximize2, Volume2, VolumeX, Settings, Play, Pause,
  SkipBack, SkipForward, ChevronRight, Check, LucideIcon,
  RotateCcw, Sliders, Monitor, ExternalLink, FastForward,
  Rewind, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface EnhancedVideoPlayerProps {
  video: any;
  videoUrl: string;
  poster: string;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onTimeUpdate?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

const PLAYER_ACCENT = "rgb(34, 211, 238)"; // cyan-400

export const EnhancedVideoPlayer: React.FC<EnhancedVideoPlayerProps> = ({
  video,
  videoUrl,
  poster,
  onClose,
  onNext,
  onPrevious,
  onTimeUpdate,
  hasNext = false,
  hasPrevious = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState("720p");
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  const qualities = [
    { label: "360p", value: "360p" },
    { label: "480p", value: "480p" },
    { label: "720p", value: "720p" },
    { label: "1080p", value: "1080p" },
  ];

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showSettings && !showInfo) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying, showSettings, showInfo]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [resetControlsTimeout]);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    if (v.duration) setDuration(v.duration);
    onTimeUpdate?.();
  }, [onTimeUpdate]);

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
      resetControlsTimeout();
    }
  }, [isPlaying, resetControlsTimeout]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    if (videoRef.current) {
      videoRef.current.currentTime = pos * duration;
    }
  };

  const handleMouseMoveProgress = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    setHoverPosition(pos);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " ") { e.preventDefault(); handlePlayPause(); }
      if (e.key === "m") toggleMute();
      if (e.key === "f") handleFullscreen();
      if (e.key === "ArrowRight") { if (videoRef.current) videoRef.current.currentTime += 5; }
      if (e.key === "ArrowLeft") { if (videoRef.current) videoRef.current.currentTime -= 5; }
      if (e.key === "Escape") { if (isFullscreen) handleFullscreen(); else onClose(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePlayPause, isFullscreen]);

  const formatTime = (time: number): string => {
    const h = Math.floor(time / 3600);
    const m = Math.floor((time % 3600) / 60);
    const s = Math.floor(time % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const ControlButton = ({ icon: Icon, onClick, active = false, label }: { icon: LucideIcon, onClick: () => void, active?: boolean, label?: string }) => (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`relative group p-2.5 rounded-2xl transition-all duration-300 ${active ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(34,211,238,0.4)]' : 'hover:bg-white/10 text-white/70 hover:text-white'}`}
      title={label}
    >
      <Icon className={`w-5 h-5 ${active ? 'fill-current' : ''}`} />
      {label && !active && (
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 backdrop-blur-md rounded-lg text-[10px] uppercase tracking-widest font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10">
          {label}
        </span>
      )}
    </button>
  );

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-500`}
      onMouseMove={resetControlsTimeout}
      onClick={handlePlayPause}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-cyan-500/10 to-transparent blur-[120px]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-cyan-500/10 to-transparent blur-[120px]" />
      </div>

      <div className="relative w-full max-w-screen-2xl aspect-video bg-black/50 shadow-2xl ring-1 ring-white/10 rounded-2xl overflow-hidden group/player">
        {/* Video Element */}
        <video
          ref={videoRef}
          key={videoUrl}
          src={videoUrl}
          className="w-full h-full"
          autoPlay
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadStart={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
          onEnded={onNext}
          poster={poster}
        />

        {/* Loading Spinner */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin shadow-[0_0_30px_rgba(34,211,238,0.2)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 animate-pulse">Initializing Stream</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Bar Controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="absolute top-0 left-0 right-0 p-8 flex items-start justify-between z-20 pointer-events-none"
            >
              <div className="flex items-center gap-4 pointer-events-auto">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-black/40">
                  <Play className="w-6 h-6 text-white fill-current" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-white drop-shadow-lg">{video.title || "Unknown Feature"}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-cyan-500 text-black">{quality}</span>
                    <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">{video.code} • {video.duration}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pointer-events-auto">
                <ControlButton icon={Info} onClick={() => setShowInfo(!showInfo)} active={showInfo} label="Video Info" />
                <ControlButton icon={Maximize2} onClick={handleFullscreen} label="Fullscreen (F)" />
                <button
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                  className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-red-500 text-white transition-all flex items-center justify-center group"
                >
                  <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Play/Pause Overlay Indicator (Big Icon) */}
        <AnimatePresence>
          {!showControls && !isPlaying && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                <Play className="w-10 h-10 text-white fill-current ml-2" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video Info Panel */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="absolute top-32 right-8 w-80 glass-card p-8 rounded-3xl border border-white/10 z-30"
              onClick={e => e.stopPropagation()}
            >
              <h4 className="text-sm font-black uppercase tracking-widest text-cyan-400 mb-4 flex items-center gap-2">
                <Info size={14} /> Metadata
              </h4>
              <div className="space-y-4">
                {Object.entries({
                  Title: video.title,
                  Code: video.code,
                  Quality: video.quality,
                  Duration: video.duration,
                  ID: video.id
                }).map(([k, v]) => v && (
                  <div key={k}>
                    <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">{k}</div>
                    <div className="text-xs font-medium text-white/80 line-clamp-2 leading-relaxed">{v}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Bar Controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="absolute bottom-0 left-0 right-0 p-8 pt-20 bg-gradient-to-t from-black via-black/60 to-transparent z-20 pointer-events-none"
              onClick={e => e.stopPropagation()}
            >
              <div className="pointer-events-auto">
                {/* Progress Bar Container */}
                <div
                  className="relative group/progress h-6 mb-6 flex items-center cursor-pointer"
                  onMouseEnter={() => setIsHoveringProgress(true)}
                  onMouseLeave={() => setIsHoveringProgress(false)}
                  onMouseMove={handleMouseMoveProgress}
                  onClick={handleSeek}
                >
                  <div className="absolute inset-x-0 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>

                  {/* Thumb */}
                  <motion.div
                    className="absolute w-4 h-4 rounded-full bg-white border-4 border-cyan-500 shadow-xl opacity-0 group-hover/progress:opacity-100 transition-opacity"
                    style={{ left: `${(currentTime / duration) * 100}%`, transform: 'translateX(-50%)' }}
                  />

                  {/* Hover preview line */}
                  {isHoveringProgress && (
                    <>
                      <div
                        className="absolute h-1.5 bg-white/20 rounded-full pointer-events-none"
                        style={{ width: `${hoverPosition * 100}%` }}
                      />
                      <div
                        className="absolute -top-10 px-3 py-1.5 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl text-[10px] font-black text-white pointer-events-none transition-transform"
                        style={{ left: `${hoverPosition * 100}%`, transform: 'translateX(-50%)' }}
                      >
                        {formatTime(hoverPosition * duration)}
                      </div>
                    </>
                  )}
                </div>

                {/* Control Icons Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <ControlButton icon={hasPrevious ? SkipBack : Rewind} onClick={hasPrevious ? onPrevious! : () => { if (videoRef.current) videoRef.current.currentTime -= 10 }} label={hasPrevious ? "Previous" : "-10s"} />
                      <button
                        onClick={handlePlayPause}
                        className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/40"
                      >
                        {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                      </button>
                      <ControlButton icon={hasNext ? SkipForward : FastForward} onClick={hasNext ? onNext! : () => { if (videoRef.current) videoRef.current.currentTime += 10 }} label={hasNext ? "Next" : "+10s"} />
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-sm font-black tracking-widest tabular-nums py-2 px-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-white">{formatTime(currentTime)}</span>
                        <span className="text-white/20 mx-2">/</span>
                        <span className="text-white/40">{formatTime(duration)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Volume Hub */}
                    <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/5 group/volume">
                      <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
                        {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                      </button>
                      <input
                        type="range" min="0" max="1" step="0.01"
                        value={volume} onChange={handleVolumeChange}
                        className="w-20 accent-cyan-400 opacity-60 group-hover/volume:opacity-100 transition-opacity"
                      />
                    </div>

                    <div className="flex items-center gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/5 relative">
                      {speeds.map(s => (
                        <button
                          key={s}
                          onClick={() => { setPlaybackSpeed(s); if (videoRef.current) videoRef.current.playbackRate = s; }}
                          className={`px-3 py-1.5 text-[10px] font-black rounded-xl transition-all ${playbackSpeed === s ? 'bg-cyan-500 text-black' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>

                    <div className="relative pointer-events-auto">
                      <ControlButton
                        icon={Settings}
                        onClick={() => setShowSettings(!showSettings)}
                        active={showSettings}
                        label="Quality"
                      />

                      <AnimatePresence>
                        {showSettings && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-16 right-0 w-48 glass-card border border-white/10 rounded-[32px] overflow-hidden p-2 z-50"
                          >
                            <div className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/40 border-b border-white/5 mb-1">Select Quality</div>
                            {qualities.map(q => (
                              <button
                                key={q.value}
                                onClick={() => { setQuality(q.value); setShowSettings(false); }}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-[20px] transition-all ${quality === q.value ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                              >
                                <span className="text-xs font-bold tracking-widest">{q.label}</span>
                                {quality === q.value && <Check size={14} />}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
