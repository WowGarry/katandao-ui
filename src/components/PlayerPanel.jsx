import React from 'react';
import './PlayerPanel.css';

/**
 * 玩家信息面板
 */
const PlayerPanel = ({ player, isCurrentPlayer, onToggleAI }) => {
  const resourceIcons = {
    wood: '🌲',
    brick: '🧱',
    sheep: '🐑',
    wheat: '🌾',
    ore: '⛏️'
  };

  return (
    <div className={`player-panel ${isCurrentPlayer ? 'current-player' : ''}`}>
      <div className="player-header">
        <div 
          className="player-color-indicator" 
          style={{ backgroundColor: player.color }}
        />
        <div className="player-info">
          <h3 className="player-name">
            {player.name}
            {player.is_ai && <span className="ai-badge">🤖</span>}
          </h3>
          <div className="victory-points">
            ⭐ {player.victory_points} 胜利点
          </div>
        </div>
        {onToggleAI && (
          <button 
            className="toggle-ai-button"
            onClick={() => onToggleAI(player.player_id, player.is_ai)}
            title={player.is_ai ? '切换为真人玩家' : '切换为AI玩家'}
          >
            {player.is_ai ? '🤖' : '👤'}
          </button>
        )}
      </div>

      <div className="player-resources">
        <h4 className="section-title">资源 ({player.resource_count})</h4>
        <div className="resource-grid">
          {Object.entries(resourceIcons).map(([resource, icon]) => (
            <div key={resource} className="resource-item">
              <span className="resource-icon">{icon}</span>
              <span className="resource-count">
                {player.resources[resource] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="player-buildings">
        <h4 className="section-title">建筑</h4>
        <div className="building-counts">
          <div className="building-item">
            <span>🛣️ 道路</span>
            <span>{15 - player.roads_left}/15</span>
          </div>
          <div className="building-item">
            <span>🏘️ 村庄</span>
            <span>{5 - player.settlements_left}/5</span>
          </div>
          <div className="building-item">
            <span>🏰 城市</span>
            <span>{4 - player.cities_left}/4</span>
          </div>
        </div>
      </div>

      {(player.has_longest_road || player.has_largest_army) && (
        <div className="special-cards">
          {player.has_longest_road && (
            <div className="special-card">🛤️ 最长道路</div>
          )}
          {player.has_largest_army && (
            <div className="special-card">⚔️ 最大军队</div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerPanel;

