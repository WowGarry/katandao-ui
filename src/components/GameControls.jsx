import React from "react";
import "./GameControls.css";

const phaseLabel = {
  roll_dice: "掷骰阶段",
  trade: "交易 / 建造",
  build: "建造阶段",
  setup: "开局部署",
  discard: "弃牌阶段",
  move_robber: "移动强盗",
};

const GameControls = ({
  gameState,
  onRollDice,
  onBuild,
  onTrade,
  onEndTurn,
  buildMode,
  onCancelBuild,
}) => {
  const currentPlayer = gameState?.players?.find(
    (player) => player.player_id === gameState.current_player_id
  );

  const canRollDice = gameState?.phase === "roll_dice";
  const canTrade = gameState?.phase === "trade";
  const canBuild = gameState?.phase === "trade" || gameState?.phase === "build" || gameState?.phase === "setup";

  return (
    <div className="game-controls" data-guide-target="controls-panel">
      <div className="game-status-compact">
        <span className="status-item">
          回合 <strong>{gameState?.round_number || 0}</strong>
        </span>
        <span className="status-divider">|</span>
        <span className="status-item phase">{phaseLabel[gameState?.phase] || gameState?.phase}</span>
        {gameState?.last_dice_roll && gameState?.phase !== "roll_dice" && (
  <>
    <span className="status-divider">|</span>
    <span className="status-item">骰点: {gameState.last_dice_roll}</span>
  </>
)}
      </div>

      {currentPlayer && (
        <div className="current-player-compact" data-guide-target="current-player-chip">
          <div className="player-color-dot" style={{ backgroundColor: currentPlayer.color }} />
          <span>{currentPlayer.name}</span>
        </div>
      )}

      <button
        type="button"
        className="control-button-compact primary"
        data-guide-target="roll-dice-btn"
        onClick={onRollDice}
        disabled={!canRollDice}
      >
        掷骰子
      </button>

      {canBuild && (
        <>
          <button
            type="button"
            className={`control-button-compact ${buildMode === "settlement" ? "active" : "secondary"}`}
            data-guide-target="build-settlement-btn"
            onClick={() => onBuild("settlement")}
          >
            村庄
          </button>
          <button
            type="button"
            className={`control-button-compact ${buildMode === "road" ? "active" : "secondary"}`}
            data-guide-target="build-road-btn"
            onClick={() => onBuild("road")}
          >
            道路
          </button>
          {gameState?.phase !== "setup" && (
            <button
              type="button"
              className={`control-button-compact ${buildMode === "city" ? "active" : "secondary"}`}
              data-guide-target="build-city-btn"
              onClick={() => onBuild("city")}
            >
              城市
            </button>
          )}
          {buildMode && (
            <button
              type="button"
              className="control-button-compact cancel"
              onClick={onCancelBuild}
              data-guide-target="cancel-build-btn"
            >
              取消建造
            </button>
          )}
        </>
      )}

      {canTrade && (
        <button
          type="button"
          className="control-button-compact secondary"
          onClick={() => onTrade({ wood: 4 }, { brick: 1 })}
          data-guide-target="trade-bank-btn"
        >
          4:1 银行交易
        </button>
      )}

      <button
        type="button"
        className="control-button-compact end-turn"
        data-guide-target="end-turn-btn"
        onClick={onEndTurn}
      >
        结束回合
      </button>

      {gameState?.is_finished && (
        <div className="game-over-inline">
          胜者: {gameState.players?.find((p) => p.player_id === gameState.winner_id)?.name || "未知"}
        </div>
      )}
    </div>
  );
};

export default GameControls;
