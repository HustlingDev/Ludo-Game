import React, { useState } from 'react';
import { Friend, FriendRequest, PlayerColor } from '../types';
import { COLOR_CONFIG } from '../utils/boardCoordinates';
import {
  X,
  Users,
  UserPlus,
  Search,
  Gamepad2,
  Check,
  Trash2,
  Sparkles,
  Circle,
  Clock,
  Shield,
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: Friend[];
  pendingRequests: FriendRequest[];
  onSendRequest: (userName: string) => void;
  onAcceptRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onRemoveFriend: (friendId: string) => void;
  onInviteFriendToGame: (friend: Friend) => void;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  friends,
  pendingRequests,
  onSendRequest,
  onAcceptRequest,
  onRejectRequest,
  onRemoveFriend,
  onInviteFriendToGame,
}) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'add'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [addUserInput, setAddUserInput] = useState('');
  const [invitedFriendId, setInvitedFriendId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInvite = (friend: Friend) => {
    sounds.playButton();
    setInvitedFriendId(friend.id);
    onInviteFriendToGame(friend);
    setTimeout(() => setInvitedFriendId(null), 3000);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUserInput.trim()) return;
    sounds.playButton();
    onSendRequest(addUserInput.trim());
    setAddUserInput('');
    setActiveTab('requests');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/90 rounded-3xl p-4 sm:p-6 shadow-2xl text-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                Friends & Social
              </h3>
              <p className="text-[11px] text-slate-400">Invite friends & play private multiplayer rooms</p>
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

        {/* Tab Navigation */}
        <div className="flex gap-2 py-3 border-b border-slate-800 text-xs font-bold">
          <button
            onClick={() => {
              sounds.playButton();
              setActiveTab('friends');
            }}
            className={`flex-1 py-2 rounded-xl border flex items-center justify-center gap-1.5 transition ${
              activeTab === 'friends'
                ? 'bg-indigo-500 text-white border-indigo-400 shadow-md'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>My Friends ({friends.length})</span>
          </button>

          <button
            onClick={() => {
              sounds.playButton();
              setActiveTab('requests');
            }}
            className={`flex-1 py-2 rounded-xl border flex items-center justify-center gap-1.5 transition relative ${
              activeTab === 'requests'
                ? 'bg-indigo-500 text-white border-indigo-400 shadow-md'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Requests</span>
            {pendingRequests.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-[10px] text-white font-bold flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sounds.playButton();
              setActiveTab('add');
            }}
            className={`flex-1 py-2 rounded-xl border flex items-center justify-center gap-1.5 transition ${
              activeTab === 'add'
                ? 'bg-indigo-500 text-white border-indigo-400 shadow-md'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Add Friend</span>
          </button>
        </div>

        {/* Tab 1: Friends List */}
        {activeTab === 'friends' && (
          <div className="flex-1 overflow-y-auto py-3 space-y-3">
            {/* Search filter */}
            <div className="relative">
              <input
                type="text"
                placeholder="Filter friends by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {filteredFriends.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                <Users className="w-10 h-10 opacity-30" />
                <p className="text-xs">No friends found.</p>
                <button
                  onClick={() => setActiveTab('add')}
                  className="px-4 py-1.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 rounded-xl text-xs font-bold hover:bg-indigo-500/30 transition"
                >
                  Add a Friend Now
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFriends.map((f) => {
                  const cfg = COLOR_CONFIG[f.favoriteColor] || COLOR_CONFIG.red;
                  const isInvited = invitedFriendId === f.id;

                  return (
                    <div
                      key={f.id}
                      className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg border border-white/20 relative shrink-0"
                          style={{ backgroundColor: cfg.accentHex }}
                        >
                          {f.avatar}
                          <div
                            className={`w-3 h-3 rounded-full absolute -bottom-0.5 -right-0.5 border-2 border-slate-900 ${
                              f.status === 'online'
                                ? 'bg-emerald-400'
                                : f.status === 'in_game'
                                ? 'bg-amber-400'
                                : 'bg-slate-500'
                            }`}
                            title={f.status}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="font-bold text-xs sm:text-sm text-white truncate flex items-center gap-1.5">
                            <span>{f.name}</span>
                            <span className="text-[10px] font-mono text-amber-400 px-1 rounded bg-amber-950/60 border border-amber-500/30">
                              ⭐ {f.rating}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <span
                              className={`capitalize font-bold ${
                                f.status === 'online'
                                  ? 'text-emerald-400'
                                  : f.status === 'in_game'
                                  ? 'text-amber-400'
                                  : 'text-slate-500'
                              }`}
                            >
                              {f.status === 'in_game' ? 'In a Match' : f.status}
                            </span>
                            {f.lastSeen && (
                              <>
                                <span>•</span>
                                <span>{f.lastSeen}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleInvite(f)}
                          disabled={isInvited || f.status === 'offline'}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                            isInvited
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : f.status === 'offline'
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                              : 'bg-gradient-to-r from-indigo-500 to-sky-500 hover:brightness-110 text-white shadow-md'
                          }`}
                        >
                          {isInvited ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Invited!</span>
                            </>
                          ) : (
                            <>
                              <Gamepad2 className="w-3.5 h-3.5" />
                              <span>Play</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            sounds.playButton();
                            onRemoveFriend(f.id);
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
                          title="Remove Friend"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Requests */}
        {activeTab === 'requests' && (
          <div className="flex-1 overflow-y-auto py-3 space-y-2">
            {pendingRequests.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                <UserPlus className="w-10 h-10 opacity-30" />
                <p className="text-xs">No pending friend requests.</p>
              </div>
            ) : (
              pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-base">
                      {req.senderAvatar}
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-white">{req.senderName}</div>
                      <div className="text-[10px] text-amber-400 font-mono">Rating: {req.rating}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        sounds.playButton();
                        onAcceptRequest(req.id);
                      }}
                      className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => {
                        sounds.playButton();
                        onRejectRequest(req.id);
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Add Friend Search */}
        {activeTab === 'add' && (
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                Enter Player Username or ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. MasterDice, LudoKing..."
                  value={addUserInput}
                  onChange={(e) => setAddUserInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!addUserInput.trim()}
                  className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl text-white font-bold text-xs transition flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Send Request</span>
                </button>
              </div>
            </form>

            <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-1 text-xs text-slate-400">
              <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Play With Friends Anywhere
              </span>
              <p className="text-[11px] leading-relaxed">
                Add friends to challenge them to competitive or casual 1v1 and 4-player Ludo matches in real time.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
