// Fapello SettingsPanel Component
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useSettings } from './hooks';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel = ({ isOpen, onClose }: SettingsPanelProps) => {
  const { settings, updateSetting } = useSettings();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Viewer Settings</h2>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {[
                { key: 'autoPlay', label: 'Auto-play videos' },
                { key: 'showThumbnails', label: 'Show thumbnails' },
                { key: 'highQuality', label: 'High quality images' },
                { key: 'compactView', label: 'Compact view' },
                { key: 'infiniteScroll', label: 'Infinite scroll' },
                { key: 'showControls', label: 'Show controls' }
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-gray-300">{label}</span>
                  <button
                    onClick={() => updateSetting(key, !settings[key as keyof typeof settings])}
                    className={`w-12 h-6 rounded-full transition-colors ${settings[key as keyof typeof settings] ? 'bg-blue-600' : 'bg-gray-600'}`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform ${settings[key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-0.5'}`}
                    />
                  </button>
                </div>
              ))}

              <div className="pt-4 mt-4 border-t border-gray-700">
                <label className="block text-gray-300 mb-2">
                  Slideshow speed: {settings.slideshowSpeed / 1000}s
                </label>
                <input
                  type="range"
                  min="1000"
                  max="10000"
                  step="1000"
                  value={settings.slideshowSpeed}
                  onChange={(e) => updateSetting('slideshowSpeed', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
