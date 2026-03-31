import React, { useState, useEffect } from 'react';
import HexagonMap from './components/HexagonMap';
import PlayerPanel from './components/PlayerPanel';
import GameControls from './components/GameControls';
import { api } from './services/api';
import './Game.css';

const Game = () => {
  const [gameId, setGameId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [buildMode, setBuildMode] = useState(null); // 'settlement', 'city', 'road' 或 null
  const [pendingRoadStart, setPendingRoadStart] = useState(null); // 道路的起始点

  // 创建新游戏
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
        
        // 检查第一个玩家是否是AI，如果是则自动开始
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

  // 刷新游戏状态
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

  // 掷骰子
  const handleRollDice = async () => {
    if (!gameId || !gameState) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await api.rollDice(gameId, gameState.current_player_id);
      
      if (result.success) {
        setGameState(result.game_state);
        const player = result.game_state.players.find(p => p.player_id === result.game_state.current_player_id);
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

  // 建造
  const handleBuild = async (buildingType, position) => {
    if (!gameId || !gameState) return;
    
    setLoading(true);
    setError(null);
    try {
      console.log('发送建造请求:', buildingType, position);
      const result = await api.build(
        gameId, 
        gameState.current_player_id, 
        buildingType, 
        position
      );
      
      console.log('建造结果:', result);
      
      if (result.success) {
        setGameState(result.game_state);
        setMessage(`✅ ${result.message}`);
        console.log('更新后的游戏状态:', result.game_state);
        console.log('建筑列表:', result.game_state.vertex_buildings);
        console.log('道路列表:', result.game_state.edge_buildings);
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

  // 交易
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

  // 结束回合
  const handleEndTurn = async () => {
    if (!gameId || !gameState) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await api.endTurn(gameId, gameState.current_player_id);
      
      if (result.success) {
        setGameState(result.game_state);
        setMessage(result.message);
        
        // 如果下一个是AI玩家，自动执行AI回合
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

  // 执行AI回合
  const executeAITurn = async (currentState, aiPlayerId) => {
    try {
      // 设置loading状态为true
      setLoading(true);
      
      const aiPlayer = currentState.players.find(p => p.player_id === aiPlayerId);
      const aiName = aiPlayer ? aiPlayer.name : `AI ${aiPlayerId}`;
      setMessage(`${aiName}正在思考...`);
      
      // 调用api.executeAITurn传入gameId和aiPlayerId
      // 添加策略类型参数
      const result = await api.executeAITurn(gameId, aiPlayerId, {
        strategy_type: 'smart'  // 可以是 'basic', 'smart', 或 'random'
      });
      
      // 如果成功，更新gameState并显示AI执行的动作列表
      if (result.success) {
        setGameState(result.game_state);
        
        // 显示AI执行的动作列表
        const actionMessages = result.actions.map(action => {
          switch (action.type) {
            case 'roll_dice':
              return `掷出了 ${action.dice}`;
            case 'build':
              return `建造了 ${action.build_type === 'settlement' ? '村庄' : action.build_type === 'road' ? '道路' : action.build_type}`;
            case 'end_turn':
              return '结束回合';
            default:
              return `执行了 ${action.type}`;
          }
        });
        
        setMessage(`${aiName}: ${actionMessages.join(' → ')}`);
        
        // 递归检查下一个玩家是否也是AI
        const nextPlayerId = result.game_state.current_player_id;
        const nextPlayer = result.game_state.players.find(p => p.player_id === nextPlayerId);
        if (nextPlayer && nextPlayer.is_ai && !result.game_state.is_finished) {
          setTimeout(() => executeAITurn(result.game_state, nextPlayerId), 1500);
        }
      } else {
        // 如果失败，显示错误信息
        setMessage(`${aiName}执行失败: ${result.error}`);
        console.error('AI执行失败:', result.error);
      }
      
    } catch (err) {
      // 使用try-catch捕获异常并显示错误消息
      console.error('AI回合执行失败:', err);
      setMessage(`AI执行出错: ${err.message || '未知错误'}`);
    } finally {
      // 无论成功或失败，都要取消loading状态
      setLoading(false);
    }
  };

  // 切换玩家类型（真人/AI）
  const handleTogglePlayerAI = async (playerId, currentIsAI) => {
    if (!gameId || !gameState) return;
    
    setLoading(true);
    setError(null);
    let handledAI = false; // 标志是否已经处理了AI自动开始
    
    try {
      const result = await api.togglePlayerAI(gameId, playerId, !currentIsAI);
      
      if (result.success) {
        setGameState(result.game_state);
        setMessage(result.message);
        
        // 如果切换的玩家是当前玩家且切换成了AI，立即触发AI回合
        const newIsAI = !currentIsAI;
        if (newIsAI && result.game_state.current_player_id === playerId) {
          handledAI = true;
          // 当前玩家切换为AI，立即开始AI回合
          setTimeout(() => {
            setLoading(false); // 先关闭loading
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
      // 只有在没有处理AI的情况下才在这里关闭loading
      if (!handledAI) {
        setLoading(false);
      }
    }
  };

  // 点击六边形 - 用于放置建筑
  const handleHexClick = (hex, clickType = 'hex', direction = 0) => {
    console.log('点击地图:', clickType, hex, direction, 'buildMode:', buildMode);
    
    if (!gameId || !gameState) return;
    
    // 如果在建造模式
    if (buildMode) {
      if (buildMode === 'settlement' && clickType === 'vertex') {
        // 点击顶点 - 放置村庄
        const position = [hex.q, hex.r, direction];
        console.log('放置村庄在:', position);
        handleBuild('settlement', position);
        setBuildMode(null);
        setMessage('正在放置村庄...');
      } else if (buildMode === 'road' && clickType === 'edge') {
        // 点击边 - 放置道路
        const position = [hex.q, hex.r, direction];
        console.log('放置道路在:', position);
        handleBuild('road', position);
        setBuildMode(null);
        setMessage('正在放置道路...');
      } else if (buildMode === 'city' && clickType === 'vertex') {
        // 点击顶点 - 升级城市
        const position = [hex.q, hex.r, direction];
        console.log('升级城市在:', position);
        handleBuild('city', position);
        setBuildMode(null);
        setMessage('正在升级城市...');
      } else {
        // 点击了错误的位置
        if (buildMode === 'settlement' || buildMode === 'city') {
          setMessage('❌ 请点击蓝色圆点（顶点）');
        } else if (buildMode === 'road') {
          setMessage('❌ 请点击绿色线条（边缘）');
        }
      }
    } else {
      // 非建造模式，显示信息
      setMessage(`点击了: ${hex.terrain} (${hex.q}, ${hex.r})`);
    }
  };

  // 自动清除消息
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // 自动触发AI回合
  useEffect(() => {
    if (gameState && !gameState.is_finished && !loading) {
      const currentPlayerId = gameState.current_player_id;
      const currentPlayer = gameState.players.find(p => p.player_id === currentPlayerId);
      // 检查当前玩家是否是AI
      if (currentPlayer && currentPlayer.is_ai) {
        const timer = setTimeout(() => {
          executeAITurn(gameState, currentPlayerId);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
    // 注意：不包含gameState?.players在依赖项中，因为它会导致频繁触发
    // 我们依赖current_player_id的变化来触发AI回合
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
          {/* 顶部中间控制面板 */}
          <div className="controls-panel">
            <GameControls 
              gameState={gameState}
              onRollDice={handleRollDice}
              onBuild={(type) => {
                // 进入建造选择模式
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

          {/* 中间地图 */}
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

          {/* 四个角的玩家面板 */}
          {gameState?.players?.map((player, index) => (
            <div key={player.player_id} className="player-panel-container">
              <PlayerPanel 
                player={player}
                isCurrentPlayer={player.player_id === gameState.current_player_id}
                onToggleAI={handleTogglePlayerAI}
              />
            </div>
          ))}
        </div>
      )}

      {/* 建造模式提示 */}
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

      {/* 消息提示 */}
      {message && (
        <div className="message-toast success">
          ✓ {message}
        </div>
      )}

      {/* 错误提示 */}
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

      {/* 加载指示器 */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default Game;

