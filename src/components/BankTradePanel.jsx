// src/components/BankTradePanel.jsx
import "./BankTradePanel.css";
import React, { useState } from "react";
import { api } from "../services/api";
 // 你可以自己写点简单的 flexbox 样式

const RESOURCE_ICONS = {
  wood: "🪵",
  brick: "🧱",
  sheep: "🐑",
  wheat: "🌾",
  ore: "⛏️",
};

const BankTradePanel = ({ gameId, player, onTradeSuccess }) => {
  const [giveRes, setGiveRes] = useState(null);
  const [receiveRes, setReceiveRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleTrade = async () => {
    if (!giveRes || !receiveRes) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const response = await api.tradeWithBank(
        gameId,
        player.player_id,
        { [giveRes]: 4 },
        { [receiveRes]: 1 }
      );

      if (response.success) {
        // 交易成功，清空选择并通知父组件更新全局游戏状态
        setGiveRes(null);
        setReceiveRes(null);
        if (onTradeSuccess) onTradeSuccess(response.game_state);
      } else {
        setErrorMsg(response.error || response.message);
      }
    }  finally {
      setLoading(false);
    }
  };

  return (
    <div className="bank-trade-panel">
      <h3>Bank Trade (4:1)</h3>
      
      {/* 选择交出的资源 */}
      <div className="trade-section">
        <h4>请选择要交出的资源 </h4>
        <div className="resource-buttons">
          {Object.keys(RESOURCE_ICONS).map((res) => {
            const hasEnough = (player.resources?.[res] || 0) >= 4;
            return (
              <button
                key={`give-${res}`}
                className={`res-btn ${giveRes === res ? "selected" : ""}`}
                disabled={!hasEnough}
                onClick={() => setGiveRes(res)}
              >
                {RESOURCE_ICONS[res]} 
                <span className="count-badge">{(player.resources?.[res] || 0)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 选择获得的资源 */}
      <div className="trade-section">
        <h4>请选择要获得的资源 </h4>
        <div className="resource-buttons">
          {Object.keys(RESOURCE_ICONS).map((res) => (
            <button
              key={`receive-${res}`}
              className={`res-btn ${receiveRes === res ? "selected" : ""}`}
              disabled={res === giveRes} // 不能换同种资源
              onClick={() => setReceiveRes(res)}
            >
              {RESOURCE_ICONS[res]}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && <div className="error-message">{errorMsg}</div>}

      <button 
        className="submit-trade-btn"
        disabled={!giveRes || !receiveRes || loading}
        onClick={handleTrade}
      >
        {loading ? "交易中..." : "确认交易"}
      </button>
    </div>
  );
};

export default BankTradePanel;