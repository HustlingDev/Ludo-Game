import React from 'react';
import { UserSettings, BoardTheme } from '../types';
import {
  X,
  Sliders,
  Volume2,
  VolumeX,
  Music,
  Palette,
  ShieldCheck,
  Eye,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { sounds } from '../utils/audio';

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
  if (!isOpen) return null;

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

          {/* Section 4: Privacy & Social */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-[11px] tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Privacy & Social</span>
            </div>

            <div className="space-y-2.5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-xs">Show Online Status</div>
                  <div className="text-[10px] text-slate-400">Let friends see when you are active</div>
                </div>
                <button
                  onClick={() => {
                    sounds.playButton();
                    updateSection('privacy', { onlineStatus: !settings.privacy.onlineStatus });
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    settings.privacy.onlineStatus ? 'bg-indigo-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      settings.privacy.onlineStatus ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <div>
                  <div className="font-bold text-white text-xs">Allow Friend Requests</div>
                  <div className="text-[10px] text-slate-400">Receive requests from other players</div>
                </div>
                <button
                  onClick={() => {
                    sounds.playButton();
                    updateSection('privacy', {
                      allowFriendRequests: !settings.privacy.allowFriendRequests,
                    });
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    settings.privacy.allowFriendRequests ? 'bg-indigo-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      settings.privacy.allowFriendRequests ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <div>
                  <div className="font-bold text-white text-xs">Allow Game Invitations</div>
                  <div className="text-[10px] text-slate-400">Receive direct match invitations</div>
                </div>
                <button
                  onClick={() => {
                    sounds.playButton();
                    updateSection('privacy', {
                      allowGameInvites: !settings.privacy.allowGameInvites,
                    });
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    settings.privacy.allowGameInvites ? 'bg-indigo-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      settings.privacy.allowGameInvites ? 'right-1' : 'left-1'
                    }`}
                  />
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
