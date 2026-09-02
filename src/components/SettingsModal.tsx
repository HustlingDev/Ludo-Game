import React, { useState } from 'react';
import { UserSettings, BoardTheme } from '../types';
import {
  X,
  Sliders,
  Volume2,
  VolumeX,
  Music,
  Palette,
  Eye,
  Zap,
  Smartphone,
  Check,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { useAuth } from '../context/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const { userProfile, updateUserProfile, deleteAccountAndData } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState(userProfile?.phone || '');
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const handleSavePhone = async () => {
    if (!phoneNumber.trim()) return;
    setPhoneSaving(true);
    try {
      await updateUserProfile({ phone: phoneNumber.trim() });
      setPhoneSaved(true);
      setTimeout(() => setPhoneSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setPhoneSaving(false);
    }
  };

  const updateSection = <K extends keyof UserSettings>(
    section: K,
    updates: Partial<UserSettings[K]>
  ) => {
    const updated = {
      ...settings,
      [section]: {
        ...settings[section],
        ...updates,
      },
    };
    onUpdateSettings(updated);
  };

  const handleSfxVolume = (val: number) => {
    updateSection('audio', { sfxVolume: val });
    sounds.setSfxVolume(val);
    sounds.playButton();
  };

  const handleBgmVolume = (val: number) => {
    updateSection('audio', { bgmVolume: val });
    sounds.setBgmVolume(val);
  };

  const handleBgmToggle = (enabled: boolean) => {
    updateSection('audio', { bgmEnabled: enabled });
    sounds.toggleBGM(enabled && !settings.audio.muteAll);
  };

  const handleMuteAllToggle = (muted: boolean) => {
    updateSection('audio', { muteAll: muted });
    sounds.setMuteAll(muted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/90 rounded-3xl p-4 sm:p-6 shadow-2xl text-slate-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                Game Settings
              </h3>
              <p className="text-[11px] text-slate-400">Personalize gameplay, audio, and visual themes</p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playButton();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 text-xs sm:text-sm">
          {/* Section 1: Gameplay */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sky-400 font-bold uppercase text-[11px] tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              <span>Gameplay</span>
            </div>

            <div className="space-y-2.5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              {/* Animation Speed */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-xs">Animation Speed</div>
                  <div className="text-[10px] text-slate-400">Pawn movement and dice tumble pace</div>
                </div>
                <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-700">
                  {(['slow', 'normal', 'fast'] as const).map((spd) => (
                    <button
                      key={spd}
                      onClick={() => {
                        sounds.playButton();
                        updateSection('gameplay', { animationSpeed: spd });
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition ${
                        settings.gameplay.animationSpeed === spd
                          ? 'bg-sky-500 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto Move Single Choice */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <div>
                  <div className="font-bold text-white text-xs">Auto-Move Single Choice</div>
                  <div className="text-[10px] text-slate-400">Instantly moves token if only 1 legal choice exists</div>
                </div>
                <button
                  onClick={() => {
                    sounds.playButton();
                    updateSection('gameplay', {
                      autoMoveSingleChoice: !settings.gameplay.autoMoveSingleChoice,
                    });
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    settings.gameplay.autoMoveSingleChoice ? 'bg-sky-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      settings.gameplay.autoMoveSingleChoice ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Confirm Moves */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <div>
                  <div className="font-bold text-white text-xs">Confirm Moves</div>
                  <div className="text-[10px] text-slate-400">Show target highlights before finalizing step</div>
                </div>
                <button
                  onClick={() => {
                    sounds.playButton();
                    updateSection('gameplay', { confirmMoves: !settings.gameplay.confirmMoves });
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    settings.gameplay.confirmMoves ? 'bg-sky-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      settings.gameplay.confirmMoves ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Audio */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold uppercase text-[11px] tracking-wider">
              <Music className="w-3.5 h-3.5" />
              <span>Audio & Sounds</span>
            </div>

            <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              {/* Mute All */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {settings.audio.muteAll ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className="font-bold text-white text-xs">Mute All Audio</span>
                </div>
                <button
                  onClick={() => handleMuteAllToggle(!settings.audio.muteAll)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    settings.audio.muteAll ? 'bg-rose-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      settings.audio.muteAll ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Background Music */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">Background Music (BGM)</span>
                  <button
                    onClick={() => handleBgmToggle(!settings.audio.bgmEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      settings.audio.bgmEnabled && !settings.audio.muteAll ? 'bg-amber-500' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        settings.audio.bgmEnabled && !settings.audio.muteAll ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    disabled={!settings.audio.bgmEnabled || settings.audio.muteAll}
                    value={settings.audio.bgmVolume}
                    onChange={(e) => handleBgmVolume(parseFloat(e.target.value))}
                    className="flex-1 accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
                    {Math.round(settings.audio.bgmVolume * 100)}%
                  </span>
                </div>
              </div>

              {/* Sound Effects */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">Sound Effects (SFX)</span>
                  <button
                    onClick={() => {
                      const newSfx = !settings.audio.sfxEnabled;
                      updateSection('audio', { sfxEnabled: newSfx });
                      sounds.setSfxMuted(!newSfx);
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      settings.audio.sfxEnabled && !settings.audio.muteAll ? 'bg-amber-500' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        settings.audio.sfxEnabled && !settings.audio.muteAll ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    disabled={!settings.audio.sfxEnabled || settings.audio.muteAll}
                    value={settings.audio.sfxVolume}
                    onChange={(e) => handleSfxVolume(parseFloat(e.target.value))}
                    className="flex-1 accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
                    {Math.round(settings.audio.sfxVolume * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Appearance & Board Templates */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-[11px] tracking-wider">
              <Palette className="w-3.5 h-3.5" />
              <span>Board Templates & Theme</span>
            </div>

            <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              <span className="block text-xs font-bold text-white">Board Template Style</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'classic_arrows', name: 'Classic Arrows', desc: 'Traditional arrows & pockets' },
                  { id: 'star_minimal', name: 'Star Minimal', desc: 'Clean circles & star safes' },
                  { id: 'geometric_diamond', name: 'Retro Diamond', desc: 'Rotated diamond yard frames' },
                  { id: 'classic_wood', name: 'Classic Wood', desc: 'Mahogany & brass finish' },
                  { id: 'modern_neon', name: 'Modern Neon', desc: 'Cyberpunk luminous glass' },
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => {
                      sounds.playButton();
                      updateSection('appearance', { boardTheme: tpl.id as BoardTheme });
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition ${
                      settings.appearance.boardTheme === tpl.id
                        ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs text-white">{tpl.name}</div>
                    <div className="text-[9px] text-slate-400 mt-1">{tpl.desc}</div>
                  </button>
                ))}
              </div>

              {/* Theme Mode */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <span className="font-bold text-white text-xs">App Interface Mode</span>
                <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-700">
                  {(['dark', 'light', 'system'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        sounds.playButton();
                        updateSection('appearance', { theme: mode });
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition ${
                        settings.appearance.theme === mode
                          ? 'bg-emerald-500 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Registered Mobile Money Account */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-[11px] tracking-wider">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Registered Mobile Money Number</span>
            </div>

            <div className="space-y-2.5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              <div>
                <div className="font-bold text-white text-xs">Uganda Mobile Money Number</div>
                <div className="text-[10px] text-slate-400">
                  Used for deposits & withdrawals (MTN / Airtel Uganda)
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 0770000000 or +256..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleSavePhone}
                  disabled={phoneSaving || !phoneNumber.trim()}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition"
                >
                  {phoneSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Saved</span>
                    </>
                  ) : phoneSaving ? (
                    <span>Saving...</span>
                  ) : (
                    <span>Update</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Section 5: Accessibility */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-rose-400 font-bold uppercase text-[11px] tracking-wider">
              <Eye className="w-3.5 h-3.5" />
              <span>Accessibility</span>
            </div>

            <div className="space-y-2.5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-xs">Reduced Motion</div>
                  <div className="text-[10px] text-slate-400">Minimal animations for low-end devices</div>
                </div>
                <button
                  onClick={() => {
                    sounds.playButton();
                    updateSection('accessibility', {
                      reducedMotion: !settings.accessibility.reducedMotion,
                    });
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    settings.accessibility.reducedMotion ? 'bg-rose-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      settings.accessibility.reducedMotion ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <div>
                  <div className="font-bold text-white text-xs">Larger Text & High Contrast</div>
                  <div className="text-[10px] text-slate-400">Enhanced readability for game labels</div>
                </div>
                <button
                  onClick={() => {
                    sounds.playButton();
                    updateSection('accessibility', {
                      highContrast: !settings.accessibility.highContrast,
                      largerText: !settings.accessibility.largerText,
                    });
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    settings.accessibility.highContrast ? 'bg-rose-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      settings.accessibility.highContrast ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Section 6: Account & Data Privacy (Reset / Delete) */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2 text-rose-400 font-bold uppercase text-[11px] tracking-wider">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Data Management & Privacy</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-900/50 space-y-3">
              <div>
                <div className="font-bold text-white text-xs">Delete My Account & Game Data</div>
                <div className="text-[10px] text-slate-400 leading-relaxed">
                  Permanently wipe all your saved match records, statistics, profile identifiers, and cached wallet records from the game.
                </div>
              </div>

              {!deleteConfirm ? (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playButton();
                    setDeleteConfirm(true);
                  }}
                  className="w-full py-2.5 px-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-rose-200 border border-rose-500/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete & Reset All My Data</span>
                </button>
              ) : (
                <div className="space-y-2 p-2.5 rounded-xl bg-slate-950/80 border border-rose-500/60">
                  <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Confirm Data Deletion?</span>
                  </div>
                  <p className="text-[10px] text-slate-300">
                    This action will immediately erase all saved local states and log you out.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isDeletingData}
                      onClick={async () => {
                        setIsDeletingData(true);
                        try {
                          await deleteAccountAndData();
                          onClose();
                        } finally {
                          setIsDeletingData(false);
                          setDeleteConfirm(false);
                        }
                      }}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition shadow"
                    >
                      {isDeletingData ? 'Deleting...' : 'Yes, Delete Everything'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(false)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              sounds.playButton();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-lg transition"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
