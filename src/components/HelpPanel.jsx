import React from "react";
import "./HelpPanel.css";

const BUILD_COSTS = [
  { label: "村庄", cost: "木材 1、砖块 1、羊毛 1、小麦 1" },
  { label: "道路", cost: "木材 1、砖块 1" },
  { label: "城市", cost: "小麦 2、矿石 3" },
];

const PHASE_TIPS = {
  roll_dice: "先掷骰子，再进入资源结算与行动阶段。",
  trade: "可进行 4:1 银行交易，或准备本回合建造。",
  build: "消耗资源放置道路、村庄或升级城市。",
  setup: "开局免费放置村庄与道路，决定前期节奏。",
  setup: "当前阶段：设置阶段，先放置定居点。",
  discard: "当掷出 7 点时，手牌超限玩家需要先弃牌。",
  move_robber: "选择目标地块移动强盗，阻断该地块产出。",
};

const HelpPanel = ({ open, onClose, gameState, guideHint, onRestartTutorial }) => {
  return (
    <aside className={`help-panel ${open ? "open" : ""}`} aria-hidden={!open}>
      <div className="help-panel-header">
        <div>
          <h3>战术手册</h3>
          <p>参谋建议 + 规则速查</p>
        </div>
        <button type="button" className="help-close-btn" onClick={onClose}>
          关闭
        </button>
      </div>

      <section className="help-section">
        <h4>当前阶段</h4>
        <p>{PHASE_TIPS[gameState?.phase] || "先看阶段，再决定操作，能显著减少误操作。"}</p>
      </section>

      <section className="help-section">
        <h4>参谋建议</h4>
        {guideHint ? (
          <>
            <p className="hint-title">{guideHint.title}</p>
            <p>{guideHint.reason}</p>
          </>
        ) : (
          <p>对局开始后，参谋会根据局势实时给出建议。</p>
        )}
      </section>

      <section className="help-section">
        <h4>建造成本</h4>
        <ul>
          {BUILD_COSTS.map((item) => (
            <li key={item.label}>
              <strong>{item.label}</strong>: {item.cost}
            </li>
          ))}
        </ul>
      </section>

      <section className="help-section">
        <h4>速查规则</h4>
        <ul>
          <li>率先达到 10 点胜利点即可获胜。</li>
          <li>村庄 1 分，城市 2 分。</li>
          <li>掷出 7 点会触发弃牌与强盗移动。</li>
          <li>道路能扩展落点，是中期滚雪球关键。</li>
        </ul>
      </section>

      <section className="help-section compact">
        <button type="button" className="restart-guide-btn" onClick={onRestartTutorial}>
          重播新手引导
        </button>
      </section>
    </aside>
  );
};

export default HelpPanel;
