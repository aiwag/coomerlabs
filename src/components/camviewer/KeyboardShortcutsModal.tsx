import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Keyboard as KeyboardIcon,
  Plus,
  Search,
  X,
  ChevronRight,
  ChevronLeft,
  Delete,
  Monitor,
  Layers,
  Sparkles,
  Heart,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Copy,
  HelpCircle,
} from "lucide-react";

interface ShortcutItem {
  keys: string[];
  description: string;
  icon?: React.ReactNode;
}

interface ShortcutGroup {
  title: string;
  shortcuts: ShortcutItem[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["↑", "↓", "←", "→"], description: "Navigate streams" },
      { keys: ["Enter"], description: "Focus/expand selected stream" },
    ],
  },
  {
    title: "Stream Actions",
    shortcuts: [
      {
        keys: ["Space"],
        description: "Pause/Play focused stream",
        icon: <Pause size={14} />,
      },
      {
        keys: ["M"],
        description: "Mute/Unmute focused stream",
        icon: <VolumeX size={14} />,
      },
      {
        keys: ["F"],
        description: "Toggle favorite",
        icon: <Heart size={14} />,
      },
      { keys: ["Delete"], description: "Remove focused stream" },
    ],
  },
  {
    title: "Layout & View",
    shortcuts: [
      { keys: ["1"], description: "2x2 Grid", icon: <Layers size={14} /> },
      { keys: ["2"], description: "3x3 Grid", icon: <Layers size={14} /> },
      { keys: ["3"], description: "4x4 Grid", icon: <Layers size={14} /> },
      {
        keys: ["0"],
        description: "Magic Grid (Auto-fit)",
        icon: <Sparkles size={14} />,
      },
      { keys: ["F"], description: "Focus layout" },
      { keys: ["Esc"], description: "Exit focus/fullscreen" },
    ],
  },
  {
    title: "Interface",
    shortcuts: [
      {
        keys: ["Ctrl", "B"],
        description: "Toggle browser sidebar",
        icon: <Search size={14} />,
      },
      { keys: ["Ctrl", "S"], description: "Toggle stream sidebar" },
      {
        keys: ["Ctrl", "N"],
        description: "Add new stream",
        icon: <Plus size={14} />,
      },
      {
        keys: ["Ctrl", "V"],
        description: "Paste stream URL",
        icon: <Copy size={14} />,
      },
      {
        keys: ["Ctrl", "F"],
        description: "Toggle fullscreen",
        icon: <Monitor size={14} />,
      },
      {
        keys: ["?"],
        description: "Show this help",
        icon: <HelpCircle size={14} />,
      },
    ],
  },
];

function KeyBadge({ key: keyChar }: { key: string }) {
  const displayKey = keyChar === " " ? "Space" : keyChar;

  return (
    <kbd className="inline-flex min-w-[24px] items-center justify-center rounded border border-neutral-600 bg-neutral-800 px-1.5 py-0.5 text-xs font-medium text-neutral-200 shadow-sm">
      {displayKey}
    </kbd>
  );
}

export function KeyboardShortcutsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-hidden border-neutral-700 bg-neutral-900 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyboardIcon size={20} className="text-cyan-400" />
            <span>Keyboard Shortcuts</span>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto pr-2">
          {shortcutGroups.map((group) => (
            <div key={group.title} className="mb-6 last:mb-0">
              <h3 className="mb-3 border-b border-neutral-700 pb-2 text-sm font-semibold tracking-wide text-neutral-400 uppercase">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={`${group.title}-${index}`}
                    className="flex items-center justify-between rounded px-2 py-2 transition-colors hover:bg-neutral-800/50"
                  >
                    <div className="flex items-center gap-3">
                      {shortcut.icon && (
                        <span className="text-neutral-500">
                          {shortcut.icon}
                        </span>
                      )}
                      <span className="text-sm text-neutral-300">
                        {shortcut.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          {keyIndex > 0 && (
                            <span className="mx-1 text-xs text-neutral-500">
                              +
                            </span>
                          )}
                          <KeyBadge key={key} />
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-6 rounded-lg border border-neutral-700 bg-neutral-800/50 p-4">
            <p className="text-xs text-neutral-400">
              <strong className="text-neutral-300">Tip:</strong> Keyboard
              shortcuts work when not typing in input fields. Press{" "}
              <kbd className="mx-1 inline-flex min-w-[24px] items-center justify-center rounded border border-neutral-600 bg-neutral-800 px-1.5 py-0.5 text-xs font-medium text-neutral-200">
                ?
              </kbd>
              anytime to see this help.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
