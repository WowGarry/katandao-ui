import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HexagonMap from "./components/HexagonMap";
import PlayerPanel from "./components/PlayerPanel";
import GameControls from "./components/GameControls";
import GuideOverlay from "./components/GuideOverlay";
import HelpPanel from "./components/HelpPanel";
import SpeechBubble from "./components/SpeechBubble";
import { api } from "./services/api";
import "./Game.css";

const TUTORIAL_STORAGE_KEY = "katandao_tutorial_version";
const TUTORIAL_VERSION = "v1_v2_guide";
const BUILD_MODE_LABEL = {
  settlement: "村庄",
  road: "道路",
  city: "城市",
};

const TUTORIAL_STEPS = [
  {
    target: "start-game-btn",
    title: "开启一局对战",
    body: "开始一局含真人与 AI 的对战，战术参谋会带你完成首个回合。",
  },
  {
    target: "controls-panel",
    requiresGame: true,
    title: "回合指挥区",
    body: "这里是你的行动中枢：掷骰、建造、交易、结束回合都在这里完成。",
  },
  {
    target: "roll-dice-btn",
    requiresGame: true,
    title: "先掷骰再行动",
    body: "常规回合必须先掷骰子，完成资源结算后才能进入后续操作。",
  },
  {
    target: "build-settlement-btn",
    requiresGame: true,
    title: "靠建造拿分",
    body: "通过建造按钮进入放置模式。村庄与城市是胜利点的核心来源。",
  },
  {
    target: "hex-map",
    requiresGame: true,
    title: "看地图热点",
    body: "点击地图高亮的顶点或边即可放置建筑，热点会标出当前推荐位置。",
  },
  {
    target: "coach-hint-chip",
    requiresGame: true,
    title: "跟随参谋建议",
    body: "实时建议来自后端规则判断，每回合更新。点击“执行建议”可直接进入动作。",
  },
  {
    target: "help-button",
    title: "打开战术手册",
    body: "任意时刻可打开手册查看阶段提示、建造成本，并可重播新手引导。",
  },
];

const shouldShowTutorialInitially = () => {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(TUTORIAL_STORAGE_KEY) !== TUTORIAL_VERSION;
};

const Game = () => {
  const [gameId, setGameId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [buildMode, setBuildMode] = useState(null);

  const [helpOpen, setHelpOpen] = useState(false);
  const [guideHint, setGuideHint] = useState(null);
  const [hintLoading, setHintLoading] = useState(false);

  const [showTutorial, setShowTutorial] = useState(shouldShowTutorialInitially);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [tutorialTargetRect, setTutorialTargetRect] = useState(null);
  const [currentSpeech, setCurrentSpeech] = useState(null);

  // 【新增】1. 骰子弹窗状态
  const [dicePopup, setDicePopup] = useState(null);

  const aiTurnLockRef = useRef(false);
  const speechQueueRef = useRef([]);

  const currentPlayer = useMemo(
    () => gameState?.players?.find((player) => player.player_id === gameState.current_player_id),
    [gameState]
  );
  const vertexBuildingCount = Object.keys(gameState?.vertex_buildings || {}).length;
  const edgeBuildingCount = Object.keys(gameState?.edge_buildings || {}).length;

  const finishTutorial = () => {
    setShowTutorial(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TUTORIAL_STORAGE_KEY, TUTORIAL_VERSION);
    }
  };

  const restartTutorial = () => {
    setShowTutorial(true);
    setTutorialStepIndex(gameId ? 1 : 0);
    setHelpOpen(false);
  };

  const nextTutorialStep = () => {
    if (tutorialStepIndex >= TUTORIAL_STEPS.length - 1) {
      finishTutorial();
      return;
    }
    setTutorialStepIndex((prev) => prev + 1);
  };

  const previousTutorialStep = () => {
    setTutorialStepIndex((prev) => Math.max(0, prev - 1));
  };

  const createNewGame = async () => {
    setLoading(true);
    setError(null);

    try {
      const players = [
        { name: "玩家 1", color: "#ef4444", is_ai: false },
        { name: "玩家 2", color: "#3b82f6", is_ai: false },
        { name: "AI 对手 1", color: "#10b981", is_ai: true },
        { name: "AI 对手 2", color: "#f59e0b", is_ai: true },
      ];

      const result = await api.createGame(4, players, "simple");
      if (!result.success) {
        setError(result.error || "创建对局失败");
        return;
      }

      setGameId(result.game_id);
      setGameState(result.game_state);
      setMessage("对局已创建，指挥台就绪。");

      if (showTutorial && tutorialStepIndex === 0) {
        setTutorialStepIndex(1);
      }

      const firstPlayer = result.game_state.players.find(
        (player) => player.player_id === result.game_state.current_player_id
      );
      if (firstPlayer?.is_ai) {
        setTimeout(() => {
          executeAITurn(result.game_state, firstPlayer.player_id);
        }, 900);
      }
    } catch (requestError) {
      setError(`创建对局失败: ${requestError.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 【修改】2. 整合了弹窗逻辑的掷骰子函数
  const handleRollDice = async () => {
    if (!gameId || !gameState) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await api.rollDice(gameId, gameState.current_player_id);
      if (!result.success) {
        setError(result.error || "掷骰失败");
        return;
      }

      // 更新游戏状态
      setGameState(result.game_state);
      
      // 【新增逻辑】设置弹窗内容
      setDicePopup({
        dice1: result.dice1,
        dice2: result.dice2,
        total: result.total
      });

      // 3秒后自动关闭（可选）
      setTimeout(() => setDicePopup(null), 3000);

      setMessage(`掷骰结果: ${result.dice1} + ${result.dice2} = ${result.total}`);
    } catch (requestError) {
      setError(`掷骰失败: ${requestError.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBuild = async (buildingType, position) => {
    console.log('[Game] handleBuild', { buildingType, position, gameId, currentPlayerId: gameState?.current_player_id, phase: gameState?.phase });
    if (!gameId || !gameState) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await api.build(gameId, gameState.current_player_id, buildingType, position);
      console.log('[Game] build result', result);
      if (!result.success) {
        setError(result.error || result.message || "建造失败");
        return;
      }

      setGameState(result.game_state);
      setMessage(result.message || `已建造${BUILD_MODE_LABEL[buildingType] || buildingType}`);
    } catch (requestError) {
      console.error('[Game] build request error', requestError);
      setError(`建造失败: ${requestError.message}`);
    } finally {
      setLoading(false);
    }
  };

const handleTrade = async (giveOrState, receive) => {
  if (!gameId || !gameState) return;

  // ✨ 关键逻辑：判断第一个参数是“要给出的资源”还是“新的游戏状态”
  if (giveOrState && giveOrState.players) { 
    // 情况 A: 传入的是 newGameState (来自 BankTradePanel 的成功回调)
    setGameState(giveOrState);
    setMessage("银行交易已执行");
    return; // 直接结束，不需要再调 API
  }

  // 情况 B: 传入的是资源 (原有逻辑)
  setLoading(true);
  setError(null);
  try {
    const result = await api.tradeWithBank(gameId, gameState.current_player_id, giveOrState, receive);
    
    if (!result.success) {
      setError(result.error || result.message || "交易失败");
      return;
    }

    setGameState(result.game_state);
    setMessage(result.message || "银行交易已执行");
  } catch (requestError) {
    setError(`交易失败: ${requestError.message}`);
  } finally {
    setLoading(false);
  }
};

  const handleEndTurn = async () => {
    if (!gameId || !gameState) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await api.endTurn(gameId, gameState.current_player_id);
      if (!result.success) {
        setError(result.error || "结束回合失败");
        return;
      }

      setGameState(result.game_state);
      setMessage(result.message || "回合已结束");

      const nextPlayer = result.game_state.players.find(
        (player) => player.player_id === result.game_state.current_player_id
      );
      if (nextPlayer?.is_ai && !result.game_state.is_finished) {
        setTimeout(() => executeAITurn(result.game_state, nextPlayer.player_id), 900);
      }
    } catch (requestError) {
      setError(`结束回合失败: ${requestError.message}`);
    } finally {
      setLoading(false);
    }
  };

  const executeAITurn = useCallback(
    async (stateSnapshot, aiPlayerId) => {
      if (aiTurnLockRef.current) {
        return;
      }
      aiTurnLockRef.current = true;
      setLoading(true);

      try {
        const aiPlayer = stateSnapshot.players.find((player) => player.player_id === aiPlayerId);
        const aiName = aiPlayer?.name || `AI ${aiPlayerId}`;
        setMessage(`${aiName} 正在思考战术...`);

        const result = await api.executeAITurn(gameId, aiPlayerId, { strategy_type: "smart" });
        if (!result.success) {
          setError(result.error || "AI 回合执行失败");
          return;
        }

        setGameState(result.game_state);
        
        // 处理 AI 发言
        const aiSpeeches = result.ai_speeches || [];
        console.log("[Game] AI发言数据:", aiSpeeches); // 调试：查看是否收到发言
        
        if (aiSpeeches.length > 0) {
          console.log("[Game] 将发言加入队列，共", aiSpeeches.length, "条");
          speechQueueRef.current = [...aiSpeeches]; // 创建新数组副本
          // 立即显示第一条发言
          setCurrentSpeech(aiSpeeches[0]);
          console.log("[Game] 设置当前发言:", aiSpeeches[0]);
        } else {
          console.log("[Game] 没有AI发言");
        }
        
        const actionSummary = (result.actions || [])
          .map((action) => {
            if (action.type === "roll_dice") {
              return `掷出 ${action.total} 点`;
            }
            if (action.type === "build") {
              return action.result
                ? `建造${BUILD_MODE_LABEL[action.build_type] || action.build_type}`
                : "建造失败";
            }
            if (action.type === "trade") {
              return action.result ? "完成银行交易" : "交易失败";
            }
            if (action.type === "end_turn") {
              return "结束回合";
            }
            return action.type;
          })
          .join(" → ");

        setMessage(`${aiName}: ${actionSummary || "已完成回合"}`);

        const nextPlayer = result.game_state.players.find(
          (player) => player.player_id === result.game_state.current_player_id
        );
        if (nextPlayer?.is_ai && !result.game_state.is_finished) {
          setTimeout(() => executeAITurn(result.game_state, nextPlayer.player_id), 1200);
        }
      } catch (requestError) {
        setError(`AI 动作失败: ${requestError.message}`);
      } finally {
        aiTurnLockRef.current = false;
        setLoading(false);
      }
    },
    [gameId]
  );

  const handleTogglePlayerAI = async (playerId, currentIsAI) => {
    if (!gameId || !gameState) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await api.togglePlayerAI(gameId, playerId, !currentIsAI);
      if (!result.success) {
        setError(result.error || "切换 AI 失败");
        return;
      }

      setGameState(result.game_state);
      setMessage(result.message || "玩家模式已更新");

      const switchedPlayer = result.game_state.players.find((player) => player.player_id === playerId);
      if (switchedPlayer?.is_ai && result.game_state.current_player_id === playerId) {
        setTimeout(() => executeAITurn(result.game_state, playerId), 700);
      }
    } catch (requestError) {
      setError(`切换失败: ${requestError.message}`);
    } finally {
      setLoading(false);
    }
  };

  

  const handleHexClick = (hex, clickType = "hex", direction = 0) => {
    if (!gameId || !gameState) {
      return;
    }

    if (buildMode === "settlement" && clickType === "vertex") {
      console.log('[Game] clicked vertex for settlement', { hex, direction, buildMode, phase: gameState.phase });
      handleBuild("settlement", [hex.q, hex.r, direction]);
      setBuildMode(null);
      setMessage("正在放置村庄...");
      return;
    }

    if (buildMode === "road" && clickType === "edge") {
      console.log('[Game] clicked edge for road', { hex, direction, buildMode, phase: gameState.phase });
      handleBuild("road", [hex.q, hex.r, direction]);
      setBuildMode(null);
      setMessage("正在放置道路...");
      return;
    }

    if (buildMode === "city" && clickType === "vertex") {
      console.log('[Game] clicked vertex for city', { hex, direction, buildMode, phase: gameState.phase });
      handleBuild("city", [hex.q, hex.r, direction]);
      setBuildMode(null);
      setMessage("正在升级城市...");
      return;
    }

    if (buildMode) {
      setMessage(buildMode === "road" ? "请点击高亮边缘来放置道路。" : "请点击高亮顶点来放置建筑。");
      return;
    }

    setMessage(`已选地块: ${hex.terrain} (${hex.q}, ${hex.r})`);
  };

  const applyGuideHint = async () => {
    if (!guideHint || loading) {
      return;
    }

    switch (guideHint.action) {
      case "roll_dice":
        await handleRollDice();
        break;
      case "build_settlement":
      case "build_city":
      case "build_road":
        if (guideHint.suggested_build_mode) {
          setBuildMode(guideHint.suggested_build_mode);
          setMessage(
            `参谋模式: 请选择高亮${BUILD_MODE_LABEL[guideHint.suggested_build_mode] || "位置"}点位。`
          );
        }
        break;
      case "trade_with_bank":
        if (guideHint.trade_suggestion?.give && guideHint.trade_suggestion?.receive) {
          await handleTrade(guideHint.trade_suggestion.give, guideHint.trade_suggestion.receive);
        } else {
          setMessage("请打开交易并选择目标资源。");
        }
        break;
      case "end_turn":
        await handleEndTurn();
        break;
      default:
        setHelpOpen(true);
        break;
    }
  };

  useEffect(() => {
    if (!message) {
      return undefined;
    }
    const timer = setTimeout(() => setMessage(""), 3800);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!gameState || gameState.is_finished || loading) {
      return undefined;
    }
    const activePlayer = gameState.players.find((player) => player.player_id === gameState.current_player_id);
    if (!activePlayer?.is_ai) {
      return undefined;
    }

    const timer = setTimeout(() => executeAITurn(gameState, activePlayer.player_id), 1100);
    return () => clearTimeout(timer);
  }, [executeAITurn, gameState, loading]);

  useEffect(() => {
    if (!gameId || !gameState || gameState.is_finished || !currentPlayer || currentPlayer.is_ai) {
      setGuideHint(null);
      setHintLoading(false);
      return undefined;
    }

    let cancelled = false;
    const fetchHint = async () => {
      setHintLoading(true);
      try {
        const result = await api.getGuideHint(gameId, currentPlayer.player_id);
        if (cancelled) {
          return;
        }
        setGuideHint(result.success ? result.hint || null : null);
      } catch {
        if (!cancelled) {
          setGuideHint(null);
        }
      } finally {
        if (!cancelled) {
          setHintLoading(false);
        }
      }
    };

    fetchHint();
    return () => {
      cancelled = true;
    };
  }, [currentPlayer, edgeBuildingCount, gameId, gameState, vertexBuildingCount]);

  useEffect(() => {
    if (!showTutorial) {
      return undefined;
    }

    const updateTargetRect = () => {
      const step = TUTORIAL_STEPS[tutorialStepIndex];
      if (!step) {
        setTutorialTargetRect(null);
        return;
      }
      if (step.requiresGame && !gameId) {
        setTutorialTargetRect(null);
        return;
      }
      const targetElement = document.querySelector(`[data-guide-target="${step.target}"]`);
      setTutorialTargetRect(targetElement ? targetElement.getBoundingClientRect() : null);
    };

    updateTargetRect();
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);
    return () => {
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [showTutorial, tutorialStepIndex, gameId, gameState?.phase, buildMode, helpOpen, guideHint?.action]);

  const hintPositions = Array.isArray(guideHint?.suggested_positions) ? guideHint.suggested_positions : [];


  return (
    <div className="game-container">
      <header className="game-header">
        <h1 className="game-logo">CatanForge 战术指挥台</h1>
        <button
          type="button"
          className="help-launcher"
          data-guide-target="help-button"
          onClick={() => setHelpOpen(true)}
        >
          战术手册
        </button>
      </header>

      {!gameId ? (
        <div className="start-screen">
          <div className="start-content">
            <h2>开启你的卡坦战术局</h2>
            <p>从引导对局开始，用实时提示快速掌握每个阶段的节奏。</p>
            <button
              type="button"
              className="start-button"
              data-guide-target="start-game-btn"
              onClick={createNewGame}
              disabled={loading}
            >
              {loading ? "创建中..." : "开始对局"}
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
                if (type === "settlement") {
                  setMessage("请在地图上选择一个顶点放置村庄。");
                } else if (type === "road") {
                  setMessage("请在地图上选择一条边放置道路。");
                } else if (type === "city") {
                  setMessage("请选择你自己的村庄升级为城市。");
                  setMessage("请选择你已有的村庄进行城市升级。");
                }
              }}
              onTrade={handleTrade}
              onEndTurn={handleEndTurn}
              setGameState={setGameState}
              buildMode={buildMode}
              onCancelBuild={() => {
                setBuildMode(null);
                setMessage("已取消建造模式。");
              }}
            />
          </div>

          <div className="center-panel">
            {gameState?.hex_map?.hexagons && (
              <HexagonMap
                hexagons={gameState.hex_map.hexagons}
                buildings={gameState.vertex_buildings}
                roads={gameState.edge_buildings}
                players={gameState.players}
                currentPlayerId={gameState.current_player_id}
                onHexClick={handleHexClick}
                buildMode={buildMode}
                currentPhase={gameState.phase}
                hintAction={guideHint?.action}
                hintPositions={hintPositions}
                players={gameState.players}
              />
            )}
            
          </div>

          {gameState?.players?.map((player) => (
            <div
              key={player.player_id}
              className="player-panel-container"
              data-guide-target={
                player.player_id === gameState.current_player_id ? "current-player-panel" : undefined
              }
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
          {buildMode === "settlement" && "村庄模式: 点击蓝色顶点"}
          {buildMode === "road" && "道路模式: 点击绿色边缘"}
          {buildMode === "city" && "城市模式: 点击你已有的村庄"}
        </div>
      )}

      {gameId && currentPlayer && !currentPlayer.is_ai && (
        <div className={`coach-hint ${guideHint?.priority || "low"}`} data-guide-target="coach-hint-chip">
          <div className="coach-hint-header">
            <strong>战术参谋</strong>
            {hintLoading && <span className="coach-loading">分析中...</span>}
          </div>
          {guideHint ? (
            <>
              <p className="coach-title">{guideHint.title}</p>
              <p className="coach-body">{guideHint.reason}</p>
              <div className="coach-actions">
                <button type="button" onClick={applyGuideHint}>
                  执行建议
                </button>
                <button type="button" onClick={() => setHelpOpen(true)}>
                  查看解析
                </button>
              </div>
            </>
          ) : (
            <p className="coach-body">参谋正在等待下一条可执行机会。</p>
          )}
        </div>
      )}

      {message && <div className="message-toast success">{message}</div>}

      <SpeechBubble 
        speech={currentSpeech} 
        onDismiss={() => {
          speechQueueRef.current.shift();
          if (speechQueueRef.current.length > 0) {
            setCurrentSpeech(speechQueueRef.current[0]);
          } else {
            setCurrentSpeech(null);
          }
        }}
        autoHideDuration={3500}
      />

      {error && (
        <div className="message-toast error">
          <span>{error}</span>
          <button type="button" className="toast-close" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
        </div>
      )}

      <HelpPanel
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        gameState={gameState}
        guideHint={guideHint}
        onRestartTutorial={restartTutorial}
      />

      <GuideOverlay
        visible={showTutorial}
        step={TUTORIAL_STEPS[tutorialStepIndex]}
        stepIndex={tutorialStepIndex}
        totalSteps={TUTORIAL_STEPS.length}
        targetRect={tutorialTargetRect}
        onPrev={previousTutorialStep}
        onNext={nextTutorialStep}
        onSkip={finishTutorial}
      />

      {dicePopup && (
        <div className="dice-popup-overlay" onClick={() => setDicePopup(null)}>
          <div className="dice-popup-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="dice-popup-title">掷骰结果</h3>
            <div className="dice-faces-container">
              <div className="dice-face">{dicePopup.dice1}</div>
              <div className="dice-face">{dicePopup.dice2}</div>
            </div>
            <div className="dice-popup-total">
              总计: <span>{dicePopup.total}</span>
            </div>
            <button 
              className="control-button-compact primary dice-popup-btn" 
              onClick={() => setDicePopup(null)}
            >
              确定
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
