import React, { useEffect, useState } from "react";
import "./SpeechBubble.css";

const SpeechBubble = ({ speech, onDismiss, autoHideDuration = 4000 }) => {
  const [isVisible, setIsVisible] = useState(!!speech);

  useEffect(() => {
    console.log("[SpeechBubble] 收到speech:", speech); // 调试：检查speech结构
    if (!speech) {
      setIsVisible(false);
      return;
    }
    console.log("[SpeechBubble] speech结构检查:", {
      type: speech.type,
      player_name: speech.player_name,
      content: speech.content?.substring(0, 30),
    }); // 调试：检查关键字段
    setIsVisible(true);

    const timer = setTimeout(() => {
      console.log("[SpeechBubble] 发言自动消失，触发onDismiss");
      setIsVisible(false);
      onDismiss?.();
    }, autoHideDuration);

    return () => clearTimeout(timer);
  }, [speech, autoHideDuration, onDismiss]);

  if (!isVisible || !speech) {
    return null;
  }

  const getSpeechTypeLabel = (type) => {
    const labels = {
      situation: "局势分析",
      build: "建造宣言",
      trade: "交易提议",
      setup: "初始布局",
      chat: "发言",
    };
    return labels[type] || "发言";
  };

  return (
    <div className="speech-bubble-wrapper">
      <div className="speech-bubble">
        <div className="speech-header">
          <span className="player-name">{speech.player_name}</span>
          <span className="speech-type">{getSpeechTypeLabel(speech.type)}</span>
        </div>
        <div className="speech-content">{speech.content}</div>
      </div>
    </div>
  );
};

export default SpeechBubble;
