import React, { useState, useEffect } from 'react';
import HexagonMap from './components/HexagonMap';
import PlayerPanel from './components/PlayerPanel';
import GameControls from './components/GameControls';
import { api } from './services';
import './Game.css';

const Game = () => {
  const [gameId, setGameId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [buildMode, setBuildMode] = useState(null);
  const [pendingRoadStart, setPendingRoadStart] = useState(null);

  const createNewGame = async () => {
    setLoading(true);
    setError(null);

    try {
      const players = [
        { name: '玩家1', color: '#ef4444', is_ai: false },
        { name: '玩家2', color: '#3b82f6', is_ai: false },
        { name: 'AI对手1', color: '#10b981', is_ai: true },
        { name: 'AI对手2', color: '#f59e0b', is_ai: true }
      ];

      const result = await api.createGame(4, players, 'simple');

      if (result.success) {
        setGameId(result.game_id);
        setGameState(result.game_state);
        setMessage('游戏创建成功！');

        const firstPlayerId = result.game_state.current_player_id;
        const firstPlayer = result.game_state.players.find(p => p.player_id === firstPlayerId);

        if (firstPlayer && firstPlayer.is_ai) {
          setTimeout(() => {
            executeAITurn(result.game_state, firstPlayerId);
          }, 1000);
        }
      } else {
        setError(result.error || '创建游戏失败');
      }
    } catch (err) {
      setError('网络错误：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshGameState = async () => {
    if (!gameId) return;

    try {
      const result = await api.getGame(gameId);
      if (result.success) {
        setGameState(result.game_state);
      }
    } catch (err) {
      console.error('刷新游戏状态失败:', err);
    }
  };

  const handleRollDice = async () => {
    if (!gameId || !gameState) return;

    setLoading(true);
    setError(null);

    try {
      const result = await api.rollDice(gameId, gameState.current_player_id);

      if (result.success) {
        setGameState(result.game_state);
        const player = result.game_state.players.find(
          p => p.player_id === result.game_state.current_player_id
        );
        setMessage(`${player?.name || '玩家'} 掷出了 ${result.dice1} + ${result.dice2} = ${result.total}`);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('掷骰子失败：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBuild = async (buildingType, position) => {
    if (!gameId || !gameState) return;

    setLoading(true);
    setError(null);

    try {
      const result = await api.build(
        gameId,
        gameState.current_player_id,
        buildingType,
        position
      );

      if (result.success) {
        setGameState(result.game_state);
        setMessage(`✅ ${result.message}`);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('建造失败：' + err.message);
      console.error('建造错误:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrade = async (give, receive) => {
    if (!gameId || !gameState) return;

    setLoading(true);
    setError(null);

    try {
      const result = await api.tradeWithBank(
        gameId,
        gameState.current_player_id,
        give,
        receive
      );

      if (result.success) {
        setGameState(result.game_state);
        setMessage(result.message);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('交易失败：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEndTurn = async () => {
    if (!gameId || !gameState) return;

    setLoading(true);
    setError(null);

    try {
      const result = await api.endTurn(gameId, gameState.current_player_id);

      if (result.success) {
        setGameState(result.game_state);
        setMessage(result.message);

        const nextPlayerId = result.game_state.current_player_id;
        const nextPlayer = result.game_state.players.find(p => p.player_id === nextPlayerId);
        if (nextPlayer && nextPlayer.is_ai && !result.game_state.is_finished) {
          setTimeout(() => executeAITurn(result.game_state, nextPlayerId), 1000);
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('结束回合失败：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const executeAITurn = async (currentState, aiPlayerId) => {
    try {
      setLoading(true);

      const aiPlayer = currentState.players.find(p => p.player_id === aiPlayerId);
      const aiName = aiPlayer ? aiPlayer.name : `AI ${aiPlayerId}`;
      setMessage(`${aiName} 正在思考...`);

      const result = await api.executeAITurn(gameId, aiPlayerId, {
        strategy_type: 'smart'
      });

      if (result.success) {
        setGameState(result.game_state);

        const actionMessages = result.actions.map(action => {
          switch (action.type) {
            case 'roll_dice':
              return `掷出了 ${action.dice}`;
            case 'build':
              return `建造了 ${
                action.build_type === 'settlement'
                  ? '村庄'
                  : action.build_type === 'road'
                  ? '道路'
                  : action.build_type === 'city'
                  ? '城市'
                  : action.build_type
              }`;
            case 'end_turn':
              return '结束回合';
            default:
              return `执行了 ${action.type}`;
          }
        });

        setMessage(`${aiName}: ${actionMessages.join(' → ')}`);

        const nextPlayerId = result.game_state.current_player_id;
        const nextPlayer = result.game_state.players.find(p => p.player_id === nextPlayerId);
        if (nextPlayer && nextPlayer.is_ai && !result.game_state.is_finished) {
          setTimeout(() => executeAITurn(result.game_state, nextPlayerId), 1500);
        }
      } else {
        setMessage(`${aiName} 执行失败: ${result.error}`);
        console.error('AI执行失败:', result.error);
      }
    } catch (err) {
      console.error('AI回合执行失败:', err);
      setMessage(`AI执行出错: ${err.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlayerAI = async (playerId, currentIsAI) => {
    if (!gameId || !gameState) return;

    setLoading(true);
    setError(null);
    let handledAI = false;

    try {
      const result = await api.togglePlayerAI(gameId, playerId, !currentIsAI);

      if (result.success) {
        setGameState(result.game_state);
        setMessage(result.message);

        const newIsAI = !currentIsAI;
        if (newIsAI && result.game_state.current_player_id === playerId) {
          handledAI = true;
          setTimeout(() => {
            setLoading(false);
            setTimeout(() => {
              executeAITurn(result.game_state, playerId);
            }, 500);
          }, 500);
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('切换失败：' + err.message);
    } finally {
      if (!handledAI) {
        setLoading(false);
      }
    }
  };

  const handleHexClick = (hex, clickType = 'hex', direction = 0) => {
    console.log('点击地图:', clickType, hex, direction, 'buildMode:', buildMode);

    if (!gameId || !gameState) return;

    if (buildMode) {
      if (buildMode === 'settlement' && clickType === 'vertex') {
        const position = [hex.q, hex.r, direction];
        handleBuild('settlement', position);
        setBuildMode(null);
        setMessage('正在放置村庄...');
      } else if (buildMode === 'road' && clickType === 'edge') {
        const position = [hex.q, hex.r, direction];
        handleBuild('road', position);
        setBuildMode(null);
        setMessage('正在放置道路...');
      } else if (buildMode === 'city' && clickType === 'vertex') {
        const position = [hex.q, hex.r, direction];
        handleBuild('city', position);
        setBuildMode(null);
        setMessage('正在升级城市...');
      } else {
        if (buildMode === 'settlement' || buildMode === 'city') {
          setMessage('❌ 请点击蓝色圆点（顶点）');
        } else if (buildMode === 'road') {
          setMessage('❌ 请点击绿色线条（边缘）');
        }
      }
    } else {
      setMessage(`点击了: ${hex.terrain} (${hex.q}, ${hex.r})`);
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (gameState && !gameState.is_finished && !loading) {
      const currentPlayerId = gameState.current_player_id;
      const currentPlayer = gameState.players.find(p => p.player_id === currentPlayerId);

      if (currentPlayer && currentPlayer.is_ai) {
        const timer = setTimeout(() => {
          executeAITurn(gameState, currentPlayerId);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState?.current_player_id, gameState?.is_finished, loading]);

  return (
    <div className="game-container">
      <header className="game-header">
        <h1 className="game-logo">🏝️ CatanForge - 卡坦岛</h1>
      </header>

      {!gameId ? (
        <div className="start-screen">
          <div className="start-content">
            <h2>欢迎来到卡坦岛！</h2>
            <p>开始一局新游戏，建设你的王国</p>
            <button
              className="start-button"
              onClick={createNewGame}
              disabled={loading}
            >
              {loading ? '创建中...' : '🎮 开始游戏'}
            </button>
          </div>
        </div>
      ) : (
        <div className="game-content">
          <div className="controls-panel">
            <GameControls
              gameState={gameState}
              onRollDice={handleRollDice}
              onBuild={(type) => {
                setBuildMode(type);
                if (type === 'settlement') {
                  setMessage('🏘️ 点击地图上的蓝色圆点放置村庄');
                } else if (type === 'road') {
                  setMessage('🛣️ 点击地图上的绿色线条放置道路');
                } else if (type === 'city') {
                  setMessage('🏰 点击闪烁的橙色圆圈，将村庄升级为城市');
                }
              }}
              onTrade={handleTrade}
              onEndTurn={handleEndTurn}
              buildMode={buildMode}
              onCancelBuild={() => {
                setBuildMode(null);
                setMessage('已取消建造');
              }}
            />
          </div>

          <div className="center-panel">
            {gameState?.hex_map?.hexagons && (
              <HexagonMap
                hexagons={gameState.hex_map.hexagons}
                buildings={gameState.vertex_buildings}
                roads={gameState.edge_buildings}
                onHexClick={handleHexClick}
                buildMode={buildMode}
                currentPhase={gameState.phase}
              />
            )}
          </div>

          {gameState?.players?.map((player, index) => (
            <div
              key={player.player_id}
              className={`player-panel-container player-slot-${index + 1}`}
            >
              <PlayerPanel
                player={player}
                isCurrentPlayer={player.player_id === gameState.current_player_id}
                onToggleAI={handleTogglePlayerAI}
              />
            </div>
          ))}
        </div>
      )}

      {buildMode && (
        <div className="build-mode-hint">
          {buildMode === 'settlement' && '🏘️ 点击蓝色圆点放置村庄'}
          {buildMode === 'road' && '🛣️ 点击绿色线条放置道路'}
          {buildMode === 'city' && '🏰 点击闪烁的橙色圆圈升级城市（必须先有村庄）'}
          <button
            onClick={() => setBuildMode(null)}
            style={{
              marginLeft: '16px',
              padding: '4px 12px',
              background: 'rgba(255,255,255,0.3)',
              border: '1px solid white',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            取消
          </button>
        </div>
      )}

      {message && (
        <div className="message-toast success">
          ✓ {message}
        </div>
      )}

      {error && (
        <div className="message-toast error">
          ✗ {error}
          <button
            className="toast-close"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default Game;