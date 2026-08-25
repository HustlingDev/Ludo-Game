import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, FloatingReaction, PlayerColor } from '../types';
import { COLOR_CONFIG } from '../utils/boardCoordinates';
import { MessageSquare, Send, X, Smile, Sparkles } from 'lucide-react';

interface ChatAndReactionsProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  reactions: FloatingReaction[];
  onSendMessage: (text: string) => void;
  onSendEmoji: (emoji: string) => void;
}

const QUICK_EMOJIS = ['🔥', '😂', '😭', '👏', '🎲', '👑', '💥', '🏃', '😎', '😱'];

export const ChatAndReactions: React.FC<ChatAndReactionsProps> = ({
  isOpen,
  onClose,
  messages,
  reactions,
  onSendMessage,
  onSendEmoji,
}) => {
  const [inputText, setInputText] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <>
      {/* Floating Reaction Particles Overlay */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {reactions.map((r) => {
          const cfg = COLOR_CONFIG[r.senderColor];
          return (
            <div
              key={r.id}
              style={{
                left: `${r.x}%`,
                top: `${r.y}%`,
              }}
              className="absolute flex flex-col items-center animate-float-fade select-none pointer-events-none"
            >
              <span className="text-4xl sm:text-5xl filter drop-shadow-lg animate-wiggle">
                {r.emoji}
              </span>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-900/80 border border-white/20 mt-1 shadow"
                style={{ color: cfg.accentHex }}
              >
                {r.senderName}
              </span>
            </div>
          );
        })}
      </div>

      {/* Quick Reaction Toolbar at Bottom */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-700/80 shadow-2xl">
        <div className="flex items-center gap-1">
          {QUICK_EMOJIS.slice(0, 7).map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSendEmoji(emoji)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl hover:bg-slate-800 active:scale-90 transition-all flex items-center justify-center text-lg sm:text-xl"
              title={`Send ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Slide-over Chat Panel */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-sky-400" />
              <span className="font-bold text-sm text-white">Match Chat & Emojis</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Reaction Emojis Grid */}
          <div className="p-3 bg-slate-950/60 border-b border-slate-800/80">
            <span className="block text-[11px] font-bold text-slate-400 uppercase mb-2">
              Quick Reactions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onSendEmoji(emoji)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-90 text-lg flex items-center justify-center transition"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Feed */}
          <div
            ref={chatScrollRef}
            className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-4">
                <Smile className="w-8 h-8 mb-2 opacity-40" />
                <p>No messages yet.</p>
                <p className="text-[11px]">Say hi to other players!</p>
              </div>
            ) : (
              messages.map((m) => {
                const cfg = COLOR_CONFIG[m.senderColor] || COLOR_CONFIG.red;
                return (
                  <div key={m.id} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[11px]" style={{ color: cfg.accentHex }}>
                        {m.senderName}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {new Date(m.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="bg-slate-800/80 text-slate-200 p-2.5 rounded-2xl rounded-tl-sm border border-slate-700/50 max-w-[90%] break-words">
                      {m.text}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Send Input */}
          <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder="Type message..."
              value={inputText}
              maxLength={150}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-3.5 py-2 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl text-white font-bold transition flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
