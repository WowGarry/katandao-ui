import React, { useState } from 'react';
import './GameControls.css';

/**
 * 游戏控制面板
 */
const GameControls = ({ 
  gameState, 
  onRollDice, 
  onBuild, 
  onTrade, 
  onEndTurn,
  buildMode,
  onCancelBuild 
}) => {
  const [buildType, setBuildType] = useState('settlement');
  const [tradeGive, setTradeGive] = useState({ wood: 4 });
  const [tradeReceive, setTradeReceive] = useState({ brick: 1 });

  const currentPlayer = gameState?.players?.find(
    p => p.player_id === gameState.current_player_id
  );

  const canRollDice = gameState?.phase === 'roll_dice';
  const canTrade = gameState?.phase === 'trade';
  const canBuild = gameState?.phase === 'build' || gameState?.phase === 'trade';

  const handleBuild = () => {
    if (onBuild) {
      // 简化：随机位置（实际应该由玩家点击地图选择）
      const position = [0, 0, 1];
      onBuild(buildType, position);
    }
  };

  const handleTrade = () => {
    if (onTrade) {
      onTrade(tradeGive, tradeReceive);
    }
  };

  return (
    <div className="game-controls">
      {/* 游戏状态 */}
      <div className="game-status-compact">
        <span className="status-item">
          回合 <strong>{gameState?.round_number || 0}</strong>
        </span>
        <span className="status-divider">|</span>
        <span className="status-item phase">
          {gameState?.phase === 'roll_dice' && '🎲 掷骰子'}
          {gameState?.phase === 'trade' && '💱 交易/建造'}
          {gameState?.phase === 'build' && '🏗️ 建造'}
          {gameState?.phase === 'setup' && '⚙️ 初始设置'}
        </span>
        {gameState?.last_dice_roll && (
          <>
            <span className="status-divider">|</span>
            <span className="status-item">
              🎲 {gameState.last_dice_roll}
            </span>
          </>
        )}
      </div>

      {/* 当前玩家 */}
      {currentPlayer && (
        <div className="current-player-compact">
          <div 
            className="player-color-dot" 
            style={{ backgroundColor: currentPlayer.color }}
          />
          <span>{currentPlayer.name}</span>
        </div>
      )}

      {/* 掷骰子按钮 */}
      <button 
        className="control-button-compact primary"
        onClick={onRollDice}
        disabled={!canRollDice}
      >
        🎲 掷骰子
      </button>

      {/* 建造按钮组 */}
      {(canBuild || gameState?.phase === 'setup') && (
        <>
          <button 
            className={`control-button-compact ${buildMode === 'settlement' ? 'active' : 'secondary'}`}
            onClick={() => onBuild('settlement')}
          >
            🏘️ 村庄
          </button>
          <button 
            className={`control-button-compact ${buildMode === 'road' ? 'active' : 'secondary'}`}
            onClick={() => onBuild('road')}
          >
            🛣️ 道路
          </button>
          {gameState?.phase !== 'setup' && (
            <button 
              className={`control-button-compact ${buildMode === 'city' ? 'active' : 'secondary'}`}
              onClick={() => onBuild('city')}
            >
              🏰 城市
            </button>
          )}
        </>
      )}

      {/* 交易按钮 */}
      {canTrade && (
        <button 
          className="control-button-compact secondary"
          onClick={handleTrade}
        >
          💱 交易 (4:1)
        </button>
      )}

      {/* 结束回合按钮 */}
      <button 
        className="control-button-compact end-turn"
        onClick={onEndTurn}
      >
        ⏭️ 结束回合
      </button>

      {/* 游戏结束 */}
      {gameState?.is_finished && (
        <div className="game-over-inline">
          🎉 {gameState.players?.find(p => p.player_id === gameState.winner_id)?.name} 获胜！
        </div>
      )}
    </div>
  );
};

export default GameControls;

