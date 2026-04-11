import React from "react";
import "./GuideOverlay.css";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const GuideOverlay = ({
  visible,
  step,
  stepIndex,
  totalSteps,
  targetRect,
  onNext,
  onPrev,
  onSkip,
}) => {
  if (!visible || !step) {
    return null;
  }

  const hasTarget =
    targetRect &&
    Number.isFinite(targetRect.top) &&
    Number.isFinite(targetRect.left) &&
    targetRect.width > 0 &&
    targetRect.height > 0;

  const spotlightStyle = hasTarget
    ? {
        top: targetRect.top - 8,
        left: targetRect.left - 8,
        width: targetRect.width + 16,
        height: targetRect.height + 16,
      }
    : null;

  const cardWidth = 360;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let top = viewportHeight * 0.22;
  let left = (viewportWidth - cardWidth) / 2;

  if (hasTarget) {
    top = targetRect.bottom + 20;
    if (top + 240 > viewportHeight) {
      top = targetRect.top - 250;
    }
    left = targetRect.left + targetRect.width / 2 - cardWidth / 2;
  }

  const cardStyle = {
    top: clamp(top, 16, viewportHeight - 250),
    left: clamp(left, 14, viewportWidth - cardWidth - 14),
    width: cardWidth,
  };

  return (
    <div className="guide-overlay-root">
      {spotlightStyle && <div className="guide-spotlight" style={spotlightStyle} />}
      <aside className="guide-card" style={cardStyle}>
        <div className="guide-progress">
          引导 {stepIndex + 1} / {totalSteps}
        </div>
        <h3>{step.title}</h3>
        <p>{step.body}</p>
        <div className="guide-actions">
          <button type="button" className="guide-btn ghost" onClick={onSkip}>
            跳过
          </button>
          <button type="button" className="guide-btn ghost" onClick={onPrev} disabled={stepIndex === 0}>
            上一步
          </button>
          <button type="button" className="guide-btn primary" onClick={onNext}>
            {stepIndex === totalSteps - 1 ? "完成" : "下一步"}
          </button>
        </div>
      </aside>
    </div>
  );
};

export default GuideOverlay;
