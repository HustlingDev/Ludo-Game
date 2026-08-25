/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLudoGame } from './hooks/useLudoGame';
import { Header } from './components/Header';
import { GameBoard } from './components/GameBoard';
import { PlayerCard } from './components/PlayerCard';
import { Dice3D } from './components/Dice3D';
import { LobbyModal } from './components/LobbyModal';
import { RulesModal } from './components/RulesModal';
import { VictoryModal } from './components/VictoryModal';
import { ChatAndReactions } from './components/ChatAndReactions';
import { SettingsModal } from './components/SettingsModal';
import { FriendsModal } from './components/FriendsModal';
import { StatsModal } from './components/StatsModal';
import { HistoryModal } from './components/HistoryModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { NotificationsModal } from './components/NotificationsModal';
import { WalletModal } from './components/WalletModal';
import { AuthModal } from './components/AuthModal';
import { BottomNav } from './components/BottomNav';

import { ErrorToast } from './components/ErrorToast';
import { COLOR_CONFIG } from './utils/boardCoordinates';
import {
  Users,
  Sparkles,
  Play,
  UserPlus,
  Trash2,
  Copy,
  Flame,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { sounds } from './utils/audio';

export default function App() {
  const {
    gameState,
    profile,
    setProfile,
    settings,
    setSettings,
    stats,
    history,
    friends,
    pendingRequests,
    notifications,
    leaderboard,
    toasts,
    dismissToast,
    activeModal,
    setActiveModal,
    isChatOpen,
    setIsChatOpen,
    chatMessages,
    reactions,
    myPlayerId,
    draggedTokenId,
    hoveredTokenId,
    setDraggedTokenId,
    setHoveredTokenId,
    isRollingAnimation,
    handleRollDice,
    handleMoveToken,
    handleStartLocalGame,
    handleCreateOnlineRoom,
    handleJoinOnlineRoom,
    handleSendFriendRequest,
    handleAcceptFriendRequest,
    handleRejectFriendRequest,
    handleRemoveFriend,
    handleInviteFriendToGame,
    handleMarkAllNotificationsRead,
    handleClearAllNotifications,
    handleNotificationAction,
    handleSendChat,
    handleSendEmoji,
  } = useLudoGame();

  const activeColor =
    gameState.activeColors?.[gameState.activeColorIndex] ||
    gameState.players?.[0]?.color ||
    'red';
  const activePlayer = gameState.players?.find((p) => p.color === activeColor);
  const activeConfig = COLOR_CONFIG[activeColor] || COLOR_CONFIG.red;

  const isMyTurn =
    gameState.mode === 'online_multiplayer'
      ? activePlayer?.id === myPlayerId
      : activePlayer?.type === 'human';

  const hostPlayer = gameState.players.find((p) => p.isHost);
  const isHost = gameState.mode === 'online_multiplayer' ? hostPlayer?.id === myPlayerId : true;

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden pb-16 sm:pb-4 ${
        settings.accessibility.highContrast ? 'contrast-125' : ''
      }`}
    >
      {/* Toast notifications */}
      <ErrorToast toasts={toasts} onDismiss={dismissToast} />

      {/* Top Navbar */}
      <Header
        gameState={gameState}
        theme={settings.appearance.boardTheme}
        setTheme={(t) =>
          setSettings({
            ...settings,
            appearance: { ...settings.appearance, boardTheme: t },
          })
        }
        soundMuted={settings.audio.muteAll}
        setSoundMuted={(m) =>
          setSettings({
            ...settings,
            audio: { ...settings.audio, muteAll: m },
          })
        }
        userRating={profile.rating}
        userName={profile.name}
        pendingRequestsCount={pendingRequests.length}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenRules={() => setActiveModal('rules')}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        onOpenLobby={() => setActiveModal('lobby')}
        onOpenFriends={() => setActiveModal('friends')}
        onOpenLeaderboard={() => setActiveModal('leaderboard')}
        onOpenStats={() => setActiveModal('stats')}
        onOpenHistory={() => setActiveModal('history')}
        onOpenSettings={() => setActiveModal('settings')}
        onOpenNotifications={() => setActiveModal('notifications')}
        onOpenWallet={() => setActiveModal('wallet')}
        onOpenAuth={() => setActiveModal('auth')}
      />

      {/* Main Game Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 md:p-6 flex flex-col items-center justify-center">
        {/* Waiting in Lobby View for Online Game */}
        {gameState.mode === 'online_multiplayer' && gameState.status === 'waiting' ? (
          <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md flex flex-col items-center text-center space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/20 text-sky-400 rounded-full text-xs font-bold border border-sky-500/30">
                <Users className="w-3.5 h-3.5" />
                <span>Room Lobby ({gameState.players.length}/4 Players)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Waiting for Players to Join
              </h2>
              <p className="text-xs text-slate-400">
                Share the 6-character room code with your friends to play together!
              </p>
            </div>

            {/* Room Code Showcase */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center gap-4 w-full max-w-md">
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Room Invite Code
                </span>
                <span className="text-2xl font-mono font-black text-amber-400 tracking-widest">
                  {gameState.roomId}
                </span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(gameState.roomId);
                  sounds.playButton();
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
              >
                <Copy className="w-4 h-4 text-sky-400" />
                <span>Copy Code</span>
              </button>
            </div>

            {/* Joined Players Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
              {(['red', 'green', 'yellow', 'blue'] as const).map((color) => {
                const player = gameState.players.find((p) => p.color === color);
                const cfg = COLOR_CONFIG[color];

                return (
                  <div
                    key={`slot-${color}`}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 min-h-[110px] transition ${
                      player
                        ? 'bg-slate-800/80 border-slate-700'
                        : 'bg-slate-950/40 border-dashed border-slate-800'
                    }`}
                  >
                    {player ? (
                      <>
                        <div
                          className="w-10 h-10 rounded-xl text-xl flex items-center justify-center border border-white/20 shadow"
                          style={{ backgroundColor: cfg.accentHex }}
                        >
                          {player.avatar}
                        </div>
                        <span className="font-bold text-xs text-white truncate max-w-[90px]">
                          {player.name}
                        </span>
                        <span
                          className="text-[10px] capitalize font-medium"
                          style={{ color: cfg.accentHex }}
                        >
                          {player.type === 'bot' ? '🤖 Bot' : player.isHost ? '👑 Host' : 'Player'}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-slate-500 font-medium capitalize">
                          {cfg.name} Slot
                        </span>
                        <span className="text-[10px] text-slate-600">Empty</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Start Button (Host only) */}
            {isHost ? (
              <button
                onClick={() => {
                  sounds.playButton();
                  handleStartLocalGame(
                    'local_pass_play',
                    gameState.players.map((p) => ({
                      name: p.name,
                      avatar: p.avatar,
                      color: p.color,
                      type: p.type,
                      botDifficulty: p.botDifficulty,
                    }))
                  );
                }}
                className="w-full max-w-sm py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-amber-500 hover:brightness-110 active:scale-95 text-white font-black text-sm shadow-xl shadow-sky-500/25 transition flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Match ({gameState.players.length} Players)</span>
              </button>
            ) : (
              <div className="text-xs text-slate-400 flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Waiting for the host to start the game...</span>
              </div>
            )}
          </div>
        ) : (
          /* Active Playing Board Layout */
          <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-3 sm:gap-6">
            {/* Left Player Column */}
            <div className="w-full lg:w-56 flex lg:flex-col gap-2 justify-between order-2 lg:order-1">
              <div className="flex-1 lg:flex-none">
                <PlayerCard
                  player={gameState.players.find((p) => p.color === 'red')}
                  color="red"
                  isActive={activeColor === 'red'}
                  isMe={myPlayerId === gameState.players.find((p) => p.color === 'red')?.id}
                  timeRemaining={gameState.turnTimeRemaining}
                  timeLimit={gameState.turnTimeLimit}
                />
              </div>
              <div className="flex-1 lg:flex-none">
                <PlayerCard
                  player={gameState.players.find((p) => p.color === 'blue')}
                  color="blue"
                  isActive={activeColor === 'blue'}
                  isMe={myPlayerId === gameState.players.find((p) => p.color === 'blue')?.id}
                  timeRemaining={gameState.turnTimeRemaining}
                  timeLimit={gameState.turnTimeLimit}
                />
              </div>
            </div>

            {/* Center: Interactive Board & Action Bar */}
            <div className="flex flex-col items-center gap-2.5 sm:gap-4 order-1 lg:order-2 w-full max-w-[530px]">
              {/* Turn Banner & Status */}
              <div className="w-full bg-slate-900/80 backdrop-blur-md border border-slate-800 p-2.5 rounded-2xl shadow-lg flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-3.5 h-3.5 rounded-full animate-ping shrink-0"
                    style={{ backgroundColor: activeConfig.accentHex }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="font-black text-xs sm:text-sm capitalize truncate"
                        style={{ color: activeConfig.accentHex }}
                      >
                        {activePlayer?.name}'s Turn
                      </span>
                      {isMyTurn && (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-950/50 px-1.5 py-0.2 rounded border border-amber-500/30">
                          YOUR MOVE
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 truncate">
                      {gameState.lastMoveDescription}
                    </p>
                  </div>
                </div>

                {/* Turn Timer Badge */}
                {gameState.turnTimeLimit > 0 && (
                  <div
                    className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border shrink-0 ${
                      gameState.turnTimeRemaining <= 5
                        ? 'bg-rose-950/60 border-rose-500 text-rose-400 animate-pulse'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    ⏱️ {gameState.turnTimeRemaining}s
                  </div>
                )}
              </div>

              {/* The 15x15 Game Board */}
              <GameBoard
                gameState={gameState}
                myPlayerId={myPlayerId}
                theme={settings.appearance.boardTheme}
                draggedTokenId={draggedTokenId}
                hoveredTokenId={hoveredTokenId}
                setDraggedTokenId={setDraggedTokenId}
                setHoveredTokenId={setHoveredTokenId}
                onMoveToken={handleMoveToken}
              />

              {/* Interactive 3D Dice and Guidance Bar */}
              <div className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-3xl p-2.5 sm:p-4 shadow-2xl flex items-center justify-around gap-2 sm:gap-3">
                {/* 3D Dice and Roll Button */}
                <Dice3D
                  value={gameState.diceValue}
                  isRolling={isRollingAnimation}
                  canRoll={gameState.canRoll}
                  activeColor={activeColor}
                  isCurrentPlayerTurn={Boolean(isMyTurn)}
                  consecutiveSixes={gameState.consecutiveSixes}
                  onRoll={handleRollDice}
                />

                {/* Move Guidance Tip */}
                <div className="flex-1 max-w-[240px] text-left p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1 mb-1">
                    <Sparkles className="w-3 h-3" />
                    How to Move
                  </span>
                  <p className="text-[11px] text-slate-300 leading-tight">
                    {gameState.mustSelectToken && isMyTurn ? (
                      <span className="text-emerald-400 font-semibold animate-pulse">
                        👉 Drag a glowing pawn to the target tile, or tap it to move forward!
                      </span>
                    ) : gameState.canRoll && isMyTurn ? (
                      <span>Roll the dice by tapping the cube or Roll button above!</span>
                    ) : (
                      <span>Waiting for {activePlayer?.name} to finish turn...</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Player Column */}
            <div className="w-full lg:w-56 flex lg:flex-col gap-2 justify-between order-3">
              <div className="flex-1 lg:flex-none">
                <PlayerCard
                  player={gameState.players.find((p) => p.color === 'green')}
                  color="green"
                  isActive={activeColor === 'green'}
                  isMe={myPlayerId === gameState.players.find((p) => p.color === 'green')?.id}
                  timeRemaining={gameState.turnTimeRemaining}
                  timeLimit={gameState.turnTimeLimit}
                />
              </div>
              <div className="flex-1 lg:flex-none">
                <PlayerCard
                  player={gameState.players.find((p) => p.color === 'yellow')}
                  color="yellow"
                  isActive={activeColor === 'yellow'}
                  isMe={myPlayerId === gameState.players.find((p) => p.color === 'yellow')?.id}
                  timeRemaining={gameState.turnTimeRemaining}
                  timeLimit={gameState.turnTimeLimit}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Dock */}
      <BottomNav
        activeModal={activeModal}
        pendingRequestsCount={pendingRequests.length}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenLobby={() => setActiveModal('lobby')}
        onOpenFriends={() => setActiveModal('friends')}
        onOpenLeaderboard={() => setActiveModal('leaderboard')}
        onOpenStats={() => setActiveModal('stats')}
        onOpenHistory={() => setActiveModal('history')}
        onOpenSettings={() => setActiveModal('settings')}
        onOpenNotifications={() => setActiveModal('notifications')}
      />

      {/* Modals & Overlays */}
      <LobbyModal
        isOpen={activeModal === 'lobby'}
        profile={profile}
        setProfile={setProfile}
        theme={settings.appearance.boardTheme}
        setTheme={(t) =>
          setSettings({
            ...settings,
            appearance: { ...settings.appearance, boardTheme: t },
          })
        }
        onClose={() => setActiveModal(null)}
        onStartLocalGame={handleStartLocalGame}
        onCreateOnlineRoom={handleCreateOnlineRoom}
        onJoinOnlineRoom={handleJoinOnlineRoom}
      />

      <SettingsModal
        isOpen={activeModal === 'settings'}
        onClose={() => setActiveModal(null)}
        settings={settings}
        onUpdateSettings={setSettings}
      />

      <FriendsModal
        isOpen={activeModal === 'friends'}
        onClose={() => setActiveModal(null)}
        friends={friends}
        pendingRequests={pendingRequests}
        onSendRequest={handleSendFriendRequest}
        onAcceptRequest={handleAcceptFriendRequest}
        onRejectRequest={handleRejectFriendRequest}
        onRemoveFriend={handleRemoveFriend}
        onInviteFriendToGame={handleInviteFriendToGame}
      />

      <StatsModal
        isOpen={activeModal === 'stats'}
        onClose={() => setActiveModal(null)}
        stats={stats}
        userName={profile.name}
        avatar={profile.avatar}
      />

      <HistoryModal
        isOpen={activeModal === 'history'}
        onClose={() => setActiveModal(null)}
        history={history}
      />

      <LeaderboardModal
        isOpen={activeModal === 'leaderboard'}
        onClose={() => setActiveModal(null)}
        entries={leaderboard}
        currentUserRating={profile.rating}
        currentUserName={profile.name}
      />

      <NotificationsModal
        isOpen={activeModal === 'notifications'}
        onClose={() => setActiveModal(null)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        onClearAll={handleClearAllNotifications}
        onActionClick={handleNotificationAction}
      />

      <RulesModal isOpen={activeModal === 'rules'} onClose={() => setActiveModal(null)} />

      <VictoryModal
        gameState={gameState}
        onRestart={() => setActiveModal('lobby')}
        onLeaveToLobby={() => setActiveModal('lobby')}
      />

      <ChatAndReactions
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        reactions={reactions}
        onSendMessage={handleSendChat}
        onSendEmoji={handleSendEmoji}
      />

      <WalletModal
        isOpen={activeModal === 'wallet'}
        onClose={() => setActiveModal(null)}
      />

      <AuthModal
        isOpen={activeModal === 'auth'}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
}
