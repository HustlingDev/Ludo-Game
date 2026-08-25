import { GameState, Player, PlayerColor, Token, GameMode } from '../types';
import { START_TRACK_INDEX, isSafeTrackIndex } from './boardCoordinates';

export function createDefaultTokens(color: PlayerColor): Token[] {
  return [0, 1, 2, 3].map((id) => ({
    id,
    color,
    state: 'YARD',
    step: -1,
    trackIndex: -1,
    yardIndex: id,
  }));
}

export function createInitialPlayer(
  id: string,
  name: string,
  avatar: string,
  color: PlayerColor,
  type: 'human' | 'bot' = 'human',
  botDifficulty: 'easy' | 'medium' | 'hard' = 'medium',
  isHost: boolean = false
): Player {
  return {
    id,
    name,
    avatar,
    color,
    type,
    botDifficulty,
    isHost,
    isConnected: true,
    tokens: createDefaultTokens(color),
    hasWon: false,
    consecutiveSixes: 0,
  };
}

export function createInitialGameState(
  roomId: string,
  mode: GameMode,
  players: Player[],
  turnTimeLimit: number = 30
): GameState {
  const activeColors = players.map((p) => p.color);
  return {
    roomId,
    mode,
    status: 'playing',
    players,
    activeColorIndex: 0,
    activeColors,
    diceValue: 1,
    hasRolled: false,
    canRoll: true,
    validTokenMoves: [],
    turnTimeLimit,
    turnTimeRemaining: turnTimeLimit,
    winnerOrder: [],
    consecutiveSixes: 0,
    mustSelectToken: false,
    lastMoveDescription: 'Game started! Roll the dice to begin.',
  };
}

/**
 * Calculates which token IDs can legally move with the rolled dice value.
 */
export function getValidTokenMoves(player: Player, diceValue: number): number[] {
  if (player.hasWon) return [];
  const validIds: number[] = [];

  for (const token of player.tokens) {
    if (token.state === 'HOME') {
      continue; // Token is already finished
    }

    if (token.state === 'YARD') {
      if (diceValue === 6) {
        validIds.push(token.id);
      }
      continue;
    }

    // Token is in TRACK (0..50) or HOME_STRETCH (51..55)
    const targetStep = token.step + diceValue;
    if (targetStep <= 56) {
      // 56 is exact landing in Home
      validIds.push(token.id);
    }
  }

  return validIds;
}

/**
 * Executes a token move, handles captures, win checks, and turn transitions.
 */
export function applyTokenMove(
  state: GameState,
  tokenId: number
): {
  newState: GameState;
  capturedColor?: PlayerColor;
  reachedHome?: boolean;
} {
  const activePlayer = state.players.find(
    (p) => p.color === state.activeColors[state.activeColorIndex]
  );
  if (!activePlayer) return { newState: state };

  const token = activePlayer.tokens.find((t) => t.id === tokenId);
  if (!token) return { newState: state };

  const diceVal = state.diceValue;
  let capturedColor: PlayerColor | undefined;
  let reachedHome = false;
  let moveDesc = '';

  const newPlayers = state.players.map((p) => {
    if (p.color !== activePlayer.color) return { ...p, tokens: [...p.tokens] };

    const newTokens = p.tokens.map((t) => {
      if (t.id !== tokenId) return { ...t };

      if (t.state === 'YARD' && diceVal === 6) {
        // Spawn out of yard onto track step 0
        const trackIdx = START_TRACK_INDEX[p.color];
        moveDesc = `${p.name} deployed a token to the track!`;
        return {
          ...t,
          state: 'TRACK' as const,
          step: 0,
          trackIndex: trackIdx,
        };
      }

      const nextStep = t.step + diceVal;
      if (nextStep === 56) {
        // Reached HOME!
        reachedHome = true;
        moveDesc = `🎉 ${p.name}'s token reached Home!`;
        return {
          ...t,
          state: 'HOME' as const,
          step: 56,
          trackIndex: -1,
        };
      } else if (nextStep > 50) {
        // In Home Stretch
        moveDesc = `${p.name} moved a token into the home stretch.`;
        return {
          ...t,
          state: 'HOME_STRETCH' as const,
          step: nextStep,
          trackIndex: -1,
        };
      } else {
        // On Common Track
        const startIdx = START_TRACK_INDEX[p.color];
        const newTrackIdx = (startIdx + nextStep) % 52;
        moveDesc = `${p.name} moved a token ${diceVal} steps.`;
        return {
          ...t,
          state: 'TRACK' as const,
          step: nextStep,
          trackIndex: newTrackIdx,
        };
      }
    });

    // Check if player won
    const allHome = newTokens.every((t) => t.state === 'HOME');
    return {
      ...p,
      tokens: newTokens,
      hasWon: allHome,
    };
  });

  // Handle captures on common track
  const movedToken = newPlayers
    .find((p) => p.color === activePlayer.color)
    ?.tokens.find((t) => t.id === tokenId);

  if (movedToken && movedToken.state === 'TRACK') {
    const landingTrackIdx = movedToken.trackIndex;
    const isSafe = isSafeTrackIndex(landingTrackIdx);

    if (!isSafe) {
      // Check if any opponent token is on this trackIndex
      for (const p of newPlayers) {
        if (p.color === activePlayer.color) continue;
        for (let i = 0; i < p.tokens.length; i++) {
          const oppToken = p.tokens[i];
          if (oppToken.state === 'TRACK' && oppToken.trackIndex === landingTrackIdx) {
            // Captured!
            capturedColor = p.color;
            moveDesc = `💥 ${activePlayer.name} captured ${p.name}'s token!`;
            p.tokens[i] = {
              ...oppToken,
              state: 'YARD',
              step: -1,
              trackIndex: -1,
            };
          }
        }
      }
    }
  }

  // Update Winner list
  const newWinnerOrder = [...state.winnerOrder];
  const updatedActivePlayer = newPlayers.find((p) => p.color === activePlayer.color)!;
  if (updatedActivePlayer.hasWon && !newWinnerOrder.includes(updatedActivePlayer.color)) {
    newWinnerOrder.push(updatedActivePlayer.color);
    updatedActivePlayer.rank = newWinnerOrder.length;
    moveDesc = `👑 ${updatedActivePlayer.name} finished in Rank #${newWinnerOrder.length}!`;
  }

  // Check if game is finished (when only 1 or 0 players left)
  const remainingActive = newPlayers.filter((p) => !p.hasWon);
  const isGameOver = remainingActive.length <= 1 && newPlayers.length > 1;

  if (isGameOver && remainingActive.length === 1) {
    const lastPlayer = remainingActive[0];
    if (!newWinnerOrder.includes(lastPlayer.color)) {
      newWinnerOrder.push(lastPlayer.color);
      lastPlayer.rank = newWinnerOrder.length;
    }
  }

  // Determine who gets next turn:
  // Bonus turn awarded if:
  // 1. Rolled a 6 (and consecutiveSixes < 3)
  // 2. Captured an opponent token
  // 3. Reached home with a token
  const getsBonusRoll =
    (diceVal === 6 || capturedColor !== undefined || reachedHome) &&
    !updatedActivePlayer.hasWon;

  let nextColorIndex = state.activeColorIndex;
  if (!getsBonusRoll) {
    nextColorIndex = getNextActiveColorIndex(
      state.activeColors,
      state.activeColorIndex,
      newPlayers
    );
  }

  const nextState: GameState = {
    ...state,
    status: isGameOver ? 'finished' : 'playing',
    players: newPlayers,
    activeColorIndex: nextColorIndex,
    hasRolled: false,
    canRoll: !isGameOver,
    validTokenMoves: [],
    mustSelectToken: false,
    consecutiveSixes: getsBonusRoll && diceVal === 6 ? state.consecutiveSixes : 0,
    turnTimeRemaining: state.turnTimeLimit,
    winnerOrder: newWinnerOrder,
    lastMoveDescription: moveDesc,
  };

  return {
    newState: nextState,
    capturedColor,
    reachedHome,
  };
}

export function getNextActiveColorIndex(
  activeColors: PlayerColor[],
  currentIndex: number,
  players: Player[]
): number {
  if (activeColors.length === 0) return 0;
  let nextIdx = (currentIndex + 1) % activeColors.length;
  let loops = 0;

  while (loops < activeColors.length) {
    const candidateColor = activeColors[nextIdx];
    const player = players.find((p) => p.color === candidateColor);
    if (player && !player.hasWon && player.isConnected !== false) {
      return nextIdx;
    }
    nextIdx = (nextIdx + 1) % activeColors.length;
    loops++;
  }

  return currentIndex;
}

/**
 * Handle dice roll event and evaluate if player has any valid moves
 */
export function applyDiceRoll(
  state: GameState,
  diceValue: number
): {
  newState: GameState;
  hasValidMoves: boolean;
  autoMovedTokenId?: number;
} {
  const activeColor = state.activeColors[state.activeColorIndex];
  const activePlayer = state.players.find((p) => p.color === activeColor);

  if (!activePlayer || activePlayer.hasWon) {
    return {
      newState: state,
      hasValidMoves: false,
    };
  }

  // Consecutive sixes check
  let consecutiveSixes = diceValue === 6 ? state.consecutiveSixes + 1 : 0;
  let moveDesc = `${activePlayer.name} rolled a ${diceValue}!`;

  if (consecutiveSixes >= 3) {
    // Penalty! 3 consecutive sixes loses turn
    const nextIdx = getNextActiveColorIndex(
      state.activeColors,
      state.activeColorIndex,
      state.players
    );
    return {
      newState: {
        ...state,
        diceValue,
        hasRolled: false,
        canRoll: true,
        validTokenMoves: [],
        mustSelectToken: false,
        consecutiveSixes: 0,
        activeColorIndex: nextIdx,
        turnTimeRemaining: state.turnTimeLimit,
        lastMoveDescription: `⚠️ 3 consecutive sixes! ${activePlayer.name} forfeited the turn.`,
      },
      hasValidMoves: false,
    };
  }

  const validMoves = getValidTokenMoves(activePlayer, diceValue);

  if (validMoves.length === 0) {
    // No legal moves possible -> Pass turn to next player
    const nextIdx = getNextActiveColorIndex(
      state.activeColors,
      state.activeColorIndex,
      state.players
    );
    return {
      newState: {
        ...state,
        diceValue,
        hasRolled: false,
        canRoll: true,
        validTokenMoves: [],
        mustSelectToken: false,
        consecutiveSixes: 0,
        activeColorIndex: nextIdx,
        turnTimeRemaining: state.turnTimeLimit,
        lastMoveDescription: `${moveDesc} No moves available. Turn passed.`,
      },
      hasValidMoves: false,
    };
  }

  return {
    newState: {
      ...state,
      diceValue,
      hasRolled: true,
      canRoll: false,
      validTokenMoves: validMoves,
      mustSelectToken: true,
      consecutiveSixes,
      lastMoveDescription: moveDesc,
    },
    hasValidMoves: true,
  };
}

/**
 * Intelligent AI Move Selector with strategic heuristic evaluation
 */
export function selectBestBotMove(
  state: GameState,
  botPlayer: Player,
  validMoves: number[]
): number {
  if (validMoves.length === 1) return validMoves[0];
  if (validMoves.length === 0) return 0;

  const diceVal = state.diceValue;
  let bestTokenId = validMoves[0];
  let highestScore = -Infinity;

  for (const tokenId of validMoves) {
    const token = botPlayer.tokens.find((t) => t.id === tokenId);
    if (!token) continue;

    let score = 0;

    // 1. Reaching Home is highest priority (1000 pts)
    if (token.step + diceVal === 56) {
      score += 1000;
    }

    // 2. Deploying a token from Yard on a 6 (300 pts)
    if (token.state === 'YARD' && diceVal === 6) {
      score += 300;
      // Bonus if not many tokens active on the board
      const activeOnBoard = botPlayer.tokens.filter(
        (t) => t.state === 'TRACK' || t.state === 'HOME_STRETCH'
      ).length;
      if (activeOnBoard === 0) score += 200;
    }

    // 3. Capturing an opponent token (600 pts)
    if (token.state === 'TRACK') {
      const nextStep = token.step + diceVal;
      if (nextStep <= 50) {
        const startIdx = START_TRACK_INDEX[botPlayer.color];
        const nextTrackIdx = (startIdx + nextStep) % 52;
        const isSafe = isSafeTrackIndex(nextTrackIdx);

        if (!isSafe) {
          for (const opp of state.players) {
            if (opp.color === botPlayer.color) continue;
            for (const oppToken of opp.tokens) {
              if (oppToken.state === 'TRACK' && oppToken.trackIndex === nextTrackIdx) {
                score += 650;
              }
            }
          }
        } else {
          // Landing on a safe star (150 pts)
          score += 150;
        }
      }
    }

    // 4. Entering the safe home stretch (400 pts)
    if (token.state === 'TRACK' && token.step + diceVal > 50) {
      score += 400;
    }

    // 5. Escaping danger: If an opponent is 1-6 steps behind this token
    if (token.state === 'TRACK' && !isSafeTrackIndex(token.trackIndex)) {
      for (const opp of state.players) {
        if (opp.color === botPlayer.color) continue;
        for (const oppToken of opp.tokens) {
          if (oppToken.state === 'TRACK') {
            const distance = (token.trackIndex - oppToken.trackIndex + 52) % 52;
            if (distance >= 1 && distance <= 6) {
              score += 250; // High incentive to run away!
            }
          }
        }
      }
    }

    // 6. Advancement score: prioritize tokens further along the track
    score += token.step * 4;

    // Add tiny random jitter for bot difficulty variation
    if (botPlayer.botDifficulty === 'easy') {
      score += Math.random() * 400;
    } else if (botPlayer.botDifficulty === 'medium') {
      score += Math.random() * 80;
    } else {
      score += Math.random() * 10;
    }

    if (score > highestScore) {
      highestScore = score;
      bestTokenId = tokenId;
    }
  }

  return bestTokenId;
}

/**
 * Calculates ELO Rating changes after a match
 */
export function calculateEloChange(
  playerRating: number,
  opponentsRatings: number[],
  playerRank: number,
  totalPlayers: number,
  isCompetitive: boolean = true
): number {
  if (!isCompetitive || opponentsRatings.length === 0) return 0;

  const avgOpponentRating =
    opponentsRatings.reduce((a, b) => a + b, 0) / opponentsRatings.length;
  const actualScoresByRank: Record<number, number> = {
    1: 1.0,
    2: totalPlayers >= 3 ? 0.6 : 0.0,
    3: 0.3,
    4: 0.0,
  };
  const actualScore = actualScoresByRank[playerRank] ?? 0.0;
  const expectedScore =
    1 / (1 + Math.pow(10, (avgOpponentRating - playerRating) / 400));
  const kFactor = 32;
  const change = Math.round(kFactor * (actualScore - expectedScore));
  return change;
}

/**
 * Calculates XP gained from a completed match
 */
export function calculateXpGain(
  rank: number,
  captures: number,
  gameMode: GameMode
): number {
  let xp = 50;
  if (rank === 1) xp += 150;
  else if (rank === 2) xp += 75;
  else if (rank === 3) xp += 40;
  xp += captures * 25;
  if (gameMode === 'online_multiplayer') xp = Math.round(xp * 1.5);
  return xp;
}

