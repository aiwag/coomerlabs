import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Users,
  Eye,
  Clock,
  Globe,
  Star,
  Heart,
  MessageCircle,
  Copy,
  ExternalLink,
  X,
  Calendar,
  Video,
} from "lucide-react";

interface StreamDetailModalProps {
  open: boolean;
  onClose: () => void;
  stream: {
    username: string;
    url: string;
    thumbnail?: string;
    viewers?: number;
    followers?: number;
    age?: number;
    region?: string;
    isOnline?: boolean;
    startedAt?: string;
    tags?: string[];
    description?: string;
  };
  onFavorite?: () => void;
  isFavorite?: boolean;
}

export function StreamDetailModal({
  open,
  onClose,
  stream,
  onFavorite,
  isFavorite = false,
}: StreamDetailModalProps) {
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(stream.url);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  const handleOpenStream = () => {
    window.open(stream.url, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg border-neutral-700 bg-neutral-900 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-lg font-bold text-white">
              {stream.username.charAt(0).toUpperCase()}
            </div>
            <span>{stream.username}</span>
            {stream.isOnline && (
              <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-400">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                Online
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Stream details and information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Thumbnail */}
          <div className="relative aspect-video overflow-hidden rounded-lg bg-neutral-800">
            {stream.thumbnail ? (
              <img
                src={stream.thumbnail}
                alt={stream.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-neutral-600">
                <Video size={48} />
              </div>
            )}
            {stream.viewers !== undefined && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg bg-black/70 px-3 py-1.5 text-sm backdrop-blur-sm">
                <Eye size={14} />
                <span className="font-medium">
                  {stream.viewers.toLocaleString()}
                </span>
                <span className="text-neutral-400">viewers</span>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            {stream.followers !== undefined && (
              <div className="rounded-lg bg-neutral-800/50 p-3 text-center">
                <Users size={18} className="mx-auto mb-1 text-cyan-400" />
                <div className="text-lg font-semibold">
                  {stream.followers.toLocaleString()}
                </div>
                <div className="text-xs text-neutral-500">Followers</div>
              </div>
            )}

            {stream.age !== undefined && (
              <div className="rounded-lg bg-neutral-800/50 p-3 text-center">
                <Calendar size={18} className="mx-auto mb-1 text-cyan-400" />
                <div className="text-lg font-semibold">{stream.age}</div>
                <div className="text-xs text-neutral-500">Age</div>
              </div>
            )}

            {stream.region && (
              <div className="rounded-lg bg-neutral-800/50 p-3 text-center">
                <Globe size={18} className="mx-auto mb-1 text-cyan-400" />
                <div className="text-lg font-semibold">{stream.region}</div>
                <div className="text-xs text-neutral-500">Region</div>
              </div>
            )}
          </div>

          {/* Tags */}
          {stream.tags && stream.tags.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-neutral-300">
                Tags
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {stream.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-neutral-800 px-2.5 py-1 text-xs text-neutral-300 transition-colors hover:bg-neutral-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {stream.description && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-neutral-300">
                About
              </h4>
              <p className="text-sm leading-relaxed text-neutral-400">
                {stream.description}
              </p>
            </div>
          )}

          {/* Stream Info */}
          {stream.startedAt && (
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <Clock size={14} />
              <span>
                Started streaming at{" "}
                {new Date(stream.startedAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <div className="flex w-full gap-2">
            <Button
              onClick={handleOpenStream}
              className="flex-1 bg-cyan-600 hover:bg-cyan-500"
            >
              <ExternalLink size={16} className="mr-2" />
              Open Stream
            </Button>

            <Button
              onClick={handleCopyUrl}
              variant="outline"
              className="flex-1"
            >
              <Copy size={16} className="mr-2" />
              Copy URL
            </Button>
          </div>

          <div className="flex w-full gap-2">
            {onFavorite && (
              <Button
                onClick={() => {
                  onFavorite();
                  if (!isFavorite) onClose();
                }}
                variant={isFavorite ? "default" : "outline"}
                className={`flex-1 ${isFavorite ? "bg-yellow-500 text-black hover:bg-yellow-600" : ""}`}
              >
                <Star size={16} className="mr-2" />
                {isFavorite ? "Favorited" : "Add to Favorites"}
              </Button>
            )}

            <Button onClick={onClose} variant="ghost" className="flex-1">
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
