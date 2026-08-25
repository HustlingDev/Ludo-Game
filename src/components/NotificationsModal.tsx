import React from 'react';
import { NotificationItem } from '../types';
import {
  X,
  Bell,
  Check,
  Gamepad2,
  Trophy,
  Gift,
  UserPlus,
  Radio,
  Trash2,
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onActionClick: (notification: NotificationItem) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onActionClick,
}) => {
  if (!isOpen) return null;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'game_invite':
        return <Gamepad2 className="w-4 h-4 text-sky-400" />;
      case 'friend_request':
        return <UserPlus className="w-4 h-4 text-indigo-400" />;
      case 'achievement':
        return <Trophy className="w-4 h-4 text-amber-400" />;
      case 'reward':
        return <Gift className="w-4 h-4 text-emerald-400" />;
      case 'friend_online':
      default:
        return <Radio className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/90 rounded-3xl p-4 sm:p-6 shadow-2xl text-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                Notifications
              </h3>
              <p className="text-[11px] text-slate-400">Invites, rewards & social alerts</p>
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

        {/* Action Controls */}
        <div className="flex items-center justify-between py-2 border-b border-slate-800 text-[11px]">
          <button
            onClick={() => {
              sounds.playButton();
              onMarkAllAsRead();
            }}
            className="text-sky-400 hover:underline flex items-center gap-1 font-bold"
          >
            <Check className="w-3.5 h-3.5" />
            Mark all read
          </button>
          <button
            onClick={() => {
              sounds.playButton();
              onClearAll();
            }}
            className="text-slate-500 hover:text-rose-400 flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear all
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
              <Bell className="w-10 h-10 opacity-30" />
              <p className="text-xs">No notifications right now.</p>
              <p className="text-[10px] text-slate-600">You're completely caught up!</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  sounds.playButton();
                  onActionClick(n);
                }}
                className={`p-3 rounded-2xl border flex items-start gap-3 transition cursor-pointer ${
                  n.read
                    ? 'bg-slate-950/50 border-slate-800/80 text-slate-400'
                    : 'bg-slate-950 border-sky-500/30 text-white shadow-sm'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white truncate">{n.title}</span>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0 ml-2" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{n.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
