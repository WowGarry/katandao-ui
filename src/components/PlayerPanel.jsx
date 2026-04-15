import React from "react";
import "./PlayerPanel.css";

const RESOURCE_ICONS = {
  wood: "🪵",
  brick: "🧱",
  sheep: "🐑",
  wheat: "🌾",
  ore: "⛏️",
};

const PlayerPanel = ({ player, isCurrentPlayer, onToggleAI }) => {
  // 1. 计算各数值百分比
  const vpPercent = Math.min((player.victory_points / 10) * 100, 100);
  const roadsPercent = ((15 - player.roads_left) / 15) * 100;
  const settlementsPercent = ((5 - player.settlements_left) / 5) * 100;
  const citiesPercent = ((4 - player.cities_left) / 4) * 100;

  // 2. 根据 VP 分数返回闪烁样式的类名
  const getVpStatusClass = () => {
    if (player.victory_points >= 9) return "vp-critical"; // 9分：红色闪烁
    if (player.victory_points >= 8) return "vp-warning";  // 8分：黄色呼吸
    return "";
  };

  return (
    <div className={`player-panel ${isCurrentPlayer ? "current-player" : ""}`}>
      {/* 头部：玩家信息与 VP 进度条 */}
      <div className="player-header">
        <div className="player-color-indicator" style={{ backgroundColor: player.color }} />
        <div className="player-info">
          <h3 className="player-name">
            {player.name}
            {player.is_ai && <span className="ai-badge">AI</span>}
          </h3>
          
          {/* VP 进度条 - 放在名字下方 */}
          <div className={`vp-progress-container ${getVpStatusClass()}`}>
            <div className="progress-label">
              <span>Victory Points</span>
              <span>{player.victory_points}/10</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill vp-gold" style={{ width: `${vpPercent}%` }} />
            </div>
          </div>
        </div>

        {onToggleAI && (
          <button
            type="button"
            className="toggle-ai-button"
            onClick={() => onToggleAI(player.player_id, player.is_ai)}
          >
            {player.is_ai ? "🤖" : "🧍"}
          </button>
        )}
      </div>

      {/* 资源面板 (保持原有) */}
      <div className="player-resources">
        <h4 className="section-title">Resources ({player.resource_count})</h4>
        <div className="resource-grid">
          {Object.entries(RESOURCE_ICONS).map(([resource, icon]) => (
            <div key={resource} className="resource-item">
              <span className="resource-icon">{icon}</span>
              <span className="resource-count">{player.resources?.[resource] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 建筑面板 - 新增蓝色可视化进度条 */}
      <div className="player-buildings">
        <h4 className="section-title">Construction Progress</h4>
        <div className="building-progress-list">
          {/* Road */}
          <div className="building-progress-item">
            <div className="progress-label">
              <span>Roads</span>
              <span>{15 - player.roads_left}/15</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill building-blue" style={{ width: `${roadsPercent}%` }} />
            </div>
          </div>

          {/* Settlement */}
          <div className="building-progress-item">
            <div className="progress-label">
              <span>Settlements</span>
              <span>{5 - player.settlements_left}/5</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill building-blue" style={{ width: `${settlementsPercent}%` }} />
            </div>
          </div>

          {/* City */}
          <div className="building-progress-item">
            <div className="progress-label">
              <span>Cities</span>
              <span>{4 - player.cities_left}/4</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill building-blue" style={{ width: `${citiesPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 特殊成就卡 */}
      {(player.has_longest_road || player.has_largest_army) && (
        <div className="special-cards">
          {player.has_longest_road && <div className="special-card">Longest Road</div>}
          {player.has_largest_army && <div className="special-card">Largest Army</div>}
        </div>
      )}
    </div>
  );
};

export default PlayerPanel;