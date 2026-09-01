/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useLudoGame } from './hooks/useLudoGame';
import { useAuth } from './context/AuthContext';
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
import { MainLobbyView } from './components/MainLobbyView';
import { BottomNav } from './components/BottomNav';
import { GoogleAuthBottomSheet } from './components/GoogleAuthBottomSheet';
import { ErrorToast } from './components/ErrorToast';
import { COLOR_CONFIG } from './utils/boardCoordinates';
import {
  Users,
  Sparkles,
  Play,
  Copy,
  WifiOff,
  Radio,
  MessageSquare,
  Sparkle,
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
    isOnline,
    selectedDiceSkin,
    setSelectedDiceSkin,
    handleRollDice,
    handleMoveToken,
    handleStartStakeGame,
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
    handleExitToLobby,
  } = useLudoGame();

  const {
    user,
    userProfile,
    wallet,
    isAuthenticated,
    isProfileComplete,
  } = useAuth();

  // Sync auth profile to game profile
  useEffect(() => {
    if (userProfile && userProfile.username) {
      setProfile({
        name: userProfile.username,
        avatar: userProfile.avatarEmoji || '👑',
        preferredColor: 'red',
        rating: userProfile.rating || 1200,
      });
    }
  }, [userProfile, setProfile]);

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

  const showAuthSheet = !isAuthenticated || !isProfileComplete;

  return (
    <div
      className={`h-screen w-screen max-h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans select-none ${
        settings.accessibility.highContrast ? 'contrast-125' : ''
      }`}
    >
      {/* Toast notifications */}
      <ErrorToast toasts={toasts} onDismiss={dismissToast} />

      {/* Offline / No Internet Warning Banner */}
      {!isOnline && (
        <div className="w-full bg-rose-600 text-white px-3 py-1.5 flex items-center justify-center gap-2 text-xs font-black shadow-lg animate-pulse shrink-0 z-50">
          <WifiOff className="w-4 h-4" />
          <span>⚠️ No Internet Connection. Reconnecting to Ludo Arena...</span>
        </div>
      )}

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
        onOpenLobby={() => handleExitToLobby()}
        onOpenFriends={() => setActiveModal('friends')}
        onOpenLeaderboard={() => setActiveModal('leaderboard')}
        onOpenStats={() => setActiveModal('stats')}
        onOpenHistory={() => setActiveModal('history')}
        onOpenSettings={() => setActiveModal('settings')}
        onOpenNotifications={() => setActiveModal('notifications')}
        onOpenWallet={() => setActiveModal('wallet')}
        onOpenAuth={() => setActiveModal('auth')}
        onOpenAdmin={() => setActiveModal('admin')}
        onExitToLobby={handleExitToLobby}
      />

      {/* Main Game Screen (Static & Zero-Scroll Layout) */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-1 sm:p-2.5 flex flex-col items-center justify-center overflow-hidden">
        {/* CASE 1: Main Lobby */}
        {gameState.status === 'lobby' ? (
          <MainLobbyView
            profile={profile}
            setProfile={setProfile}
            userRating={profile.rating}
            userBalanceUGX={wallet?.availableBalance || 0}
            selectedDiceSkin={selectedDiceSkin}
            setSelectedDiceSkin={setSelectedDiceSkin}
            onStartStakeGame={handleStartStakeGame}
            onCreateOnlineRoom={handleCreateOnlineRoom}
            onJoinOnlineRoom={handleJoinOnlineRoom}
            onOpenWallet={() => setActiveModal('wallet')}
            onOpenLeaderboard={() => setActiveModal('leaderboard')}
            onOpenRules={() => setActiveModal('rules')}
            onOpenStats={() => setActiveModal('stats')}
          />
        ) : gameState.mode === 'online_multiplayer' && gameState.status === 'waiting' ? (
          /* CASE 2: Waiting in Online Room Lobby */
          <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-md flex flex-col items-center text-center space-y-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/20 text-sky-400 rounded-full text-xs font-bold border border-sky-500/30">
                <Users className="w-3.5 h-3.5" />
                <span>Room Lobby ({gameState.players.length}/4 Players)</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Waiting for Players to Join
              </h2>
              <p className="text-xs text-slate-400">
                Share the 6-character room code with your friends to play together!
              </p>
            </div>

            {/* Room Code Showcase */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center gap-4 w-full max-w-md">
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Room Invite Code
                </span>
                <span className="text-xl font-mono font-black text-amber-400 tracking-widest">
                  {gameState.roomId}
                </span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(gameState.roomId);
                  sounds.playButton();
                }}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
              >
                <Copy className="w-4 h-4 text-sky-400" />
                <span>Copy Code</span>
              </button>
            </div>

            {/* Joined Players Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
              {(['red', 'green', 'yellow', 'blue'] as const).map((color) => {
                const player = gameState.players.find((p) => p.color === color);
                const cfg = COLOR_CONFIG[color];

                return (
                  <div
                    key={`slot-${color}`}
                    className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1 min-h-[95px] transition ${
                      player
                        ? 'bg-slate-800/80 border-slate-700'
                        : 'bg-slate-950/40 border-dashed border-slate-800'
                    }`}
                  >
                    {player ? (
                      <>
                        <div
                          className="w-9 h-9 rounded-xl text-lg flex items-center justify-center border border-white/20 shadow"
                          style={{ backgroundColor: cfg.accentHex }}
                        >
                          {player.avatar}
                        </div>
                        <span className="font-bold text-xs text-white truncate max-w-[85px]">
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

            {/* Actions: Start & Leave */}
            <div className="flex gap-2.5 w-full max-w-sm">
              <button
                onClick={handleExitToLobby}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition"
              >
                Exit
              </button>

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
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:brightness-110 active:scale-95 text-white font-black text-xs shadow-lg transition flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Start Match</span>
                </button>
              ) : (
                <div className="flex-1 text-xs text-slate-400 flex items-center justify-center gap-1.5 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Waiting for host to start...</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* CASE 3: Active Playing Arena (Static & Non-Scrolling) */
          <div className="w-full h-full max-h-[calc(100vh-8.5rem)] flex flex-col lg:flex-row items-center justify-center gap-2 sm:gap-4 overflow-hidden">
            {/* Left Player Column */}
            <div className="w-full lg:w-48 shrink-0 flex lg:flex-col gap-1.5 justify-between order-2 lg:order-1">
              {gameState.players.length === 2 ? (
                <div className="w-full">
                  <PlayerCard
                    player={gameState.players[0]}
                    color={gameState.players[0]?.color || 'red'}
                    isActive={activeColor === gameState.players[0]?.color}
                    isMe={myPlayerId === gameState.players[0]?.id}
                    timeRemaining={gameState.turnTimeRemaining}
                    timeLimit={gameState.turnTimeLimit}
                  />
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>

            {/* Center: Interactive Board & Action Bar */}
            <div className="flex flex-col items-center gap-1.5 sm:gap-2.5 order-1 lg:order-2 w-full max-w-[480px] shrink-0">
              {/* Turn Banner & Status */}
              <div className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl shadow-md flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full animate-ping shrink-0"
                    style={{ backgroundColor: activeConfig.accentHex }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="font-black text-xs capitalize truncate"
                        style={{ color: activeConfig.accentHex }}
                      >
                        {activePlayer?.name}'s Turn
                      </span>
                      {isMyTurn && (
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/40">
                          YOUR MOVE
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-300 truncate">
                      {gameState.lastMoveDescription}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleExitToLobby}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 hover:text-white border border-slate-700 transition"
                  >
                    Exit
                  </button>

                  {/* Turn Timer Badge */}
                  {gameState.turnTimeLimit > 0 && (
                    <div
                      className={`px-2 py-0.5 rounded-lg text-xs font-mono font-black border ${
                        gameState.turnTimeRemaining <= 5
                          ? 'bg-rose-950/80 border-rose-500 text-rose-400 animate-pulse'
                          : 'bg-slate-800 border-slate-700 text-amber-400'
                      }`}
                    >
                      ⏱️ {gameState.turnTimeRemaining}s
                    </div>
                  )}
                </div>
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

              {/* Interactive 3D Dice and In-Match Emoji Reactions Panel */}
              <div className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-2xl p-2 sm:p-2.5 shadow-xl flex items-center justify-between gap-2.5">
                {/* 3D Dice and Roll Button */}
                <Dice3D
                  value={gameState.diceValue}
                  isRolling={isRollingAnimation}
                  canRoll={gameState.canRoll}
                  activeColor={activeColor}
                  isCurrentPlayerTurn={Boolean(isMyTurn)}
                  consecutiveSixes={gameState.consecutiveSixes}
                  diceSkin={selectedDiceSkin}
                  onRoll={handleRollDice}
                />

                {/* Match Chat & Reactions on the Ongoing Game Screen */}
                <div className="flex-1 flex flex-col items-end gap-1 p-1.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="w-full flex items-center justify-between px-1">
                    <span className="text-[9px] uppercase font-black text-amber-400 flex items-center gap-1">
                      <Sparkle className="w-2.5 h-2.5" />
                      <span>Reactions</span>
                    </span>
                    <button
                      onClick={() => setIsChatOpen(true)}
                      className="text-[10px] font-black text-sky-400 hover:text-sky-300 transition flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Match Chat</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    {['🔥', '😂', '😭', '👏', '👑', '🎲'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleSendEmoji(emoji)}
                        className="w-7 h-7 rounded-lg bg-slate-800/90 hover:bg-slate-700 active:scale-90 flex items-center justify-center text-sm border border-slate-700/60 transition shadow-sm"
                        title={`Send ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Player Column */}
            <div className="w-full lg:w-48 shrink-0 flex lg:flex-col gap-1.5 justify-between order-3">
              {gameState.players.length === 2 ? (
                <div className="w-full">
                  <PlayerCard
                    player={gameState.players[1]}
                    color={gameState.players[1]?.color || 'yellow'}
                    isActive={activeColor === gameState.players[1]?.color}
                    isMe={myPlayerId === gameState.players[1]?.id}
                    timeRemaining={gameState.turnTimeRemaining}
                    timeLimit={gameState.turnTimeLimit}
                  />
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Dock (only in lobby) */}
      {gameState.status === 'lobby' && (
        <BottomNav
          activeModal={activeModal}
          pendingRequestsCount={pendingRequests.length}
          unreadNotificationsCount={unreadNotificationsCount}
          onOpenLobby={() => handleExitToLobby()}
          onOpenFriends={() => setActiveModal('friends')}
          onOpenLeaderboard={() => setActiveModal('leaderboard')}
          onOpenStats={() => setActiveModal('stats')}
          onOpenHistory={() => setActiveModal('history')}
          onOpenSettings={() => setActiveModal('settings')}
          onOpenNotifications={() => setActiveModal('notifications')}
        />
      )}

      {/* Google Auth & Profile Setup Bottom Sheet */}
      <GoogleAuthBottomSheet isOpen={showAuthSheet} />

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
        onRestart={handleExitToLobby}
        onLeaveToLobby={handleExitToLobby}
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
