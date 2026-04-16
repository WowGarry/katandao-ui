import React, { useMemo } from "react";
import "./HexagonMap.css";

const TERRAIN_COLORS = {
  forest: "#2f6b3f",
  hills: "#8b4f3a",
  pasture: "#78ab63",
  fields: "#d1aa39",
  mountains: "#68737f",
  desert: "#ba9a66",
};

const RESOURCE_ICONS = {
  wood: "🪵",
  brick: "🧱",
  sheep: "🐑",
  wheat: "🌾",
  ore: "⛏️",
  generic: "⚓", // 3:1 普通港口
};

const HexagonMap = ({
  hexagons,
  buildings,
  roads,
  players = [],
  currentPlayerId = null,
  onHexClick,
  buildMode,
  currentPhase,
  hintAction,
  hintPositions,
  players
}) => {
  const isSetupOrBuildMode = currentPhase === "setup" || Boolean(buildMode);
  
  const hintKeySet = useMemo(
    () => new Set((hintPositions || []).map((pos) => `${pos[0]},${pos[1]},${pos[2]}`)),
    [hintPositions]
  );

  // 当前玩家已建的村庄顶点集合（用于 city 模式下高亮与可选）
  const playerSettlementKeys = useMemo(() => {
    const s = new Set();
    Object.values(buildings || {}).forEach((b) => {
      if (b.player_id === currentPlayerId && b.type === 'settlement') {
        const [q, r, dir] = b.position;
        s.add(`${q},${r},${dir}`);
      }
    });
    return s;
  }, [buildings, currentPlayerId]);

  // 计算被占用顶点集合（用于判断某顶点是否可建村庄）
  const occupiedVertexKeys = useMemo(() => {
    const s = new Set();
    Object.values(buildings || {}).forEach((b) => {
      const [q, r, dir] = b.position;
      s.add(`${q},${r},${dir}`);
    });
    return s;
  }, [buildings]);

  const getAdjacentVertexKeys = (q, r, direction) => {
    const adjacent = [
      `${q},${r},${(direction + 1) % 6}`,
      `${q},${r},${(direction - 1 + 6) % 6}`,
    ];
    if (direction === 0) {
      adjacent.push(`${q + 1},${r - 1},3`);
      adjacent.push(`${q},${r - 1},4`);
    } else if (direction === 1) {
      adjacent.push(`${q + 1},${r - 1},4`);
      adjacent.push(`${q + 1},${r},5`);
    } else if (direction === 2) {
      adjacent.push(`${q + 1},${r},5`);
      adjacent.push(`${q},${r + 1},0`);
    } else if (direction === 3) {
      adjacent.push(`${q},${r + 1},0`);
      adjacent.push(`${q - 1},${r + 1},1`);
    } else if (direction === 4) {
      adjacent.push(`${q - 1},${r + 1},1`);
      adjacent.push(`${q - 1},${r},2`);
    } else if (direction === 5) {
      adjacent.push(`${q - 1},${r},2`);
      adjacent.push(`${q},${r - 1},3`);
    }
    return adjacent;
  };

  const hexToPixel = (q, r) => {
    const size = 60;
    const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
    const y = size * ((3 / 2) * r);
    return { x: x + 450, y: y + 450 };
  };

  const getVertexPosition = (centerX, centerY, direction, size = 60) => {
    const angle = (Math.PI / 3) * direction - Math.PI / 2;
    return {
      x: centerX + size * Math.cos(angle),
      y: centerY + size * Math.sin(angle),
    };
  };

  const generateHexPath = (centerX, centerY, size = 60) => {
    const points = [];
    for (let i = 0; i < 6; i += 1) {
      const p = getVertexPosition(centerX, centerY, i, size);
      points.push(`${p.x},${p.y}`);
    }
    return `M ${points.join(" L ")} Z`;
  };

  const getNumberColor = (number) => (number === 6 || number === 8 ? "#ff4d4d" : "#1c2430");

  // 辅助函数：根据坐标判断港口应该朝向哪个方向（面向地图外侧）
  const getHarborDirection = (q, r) => {
    if (q === 0 && r === -2) return 0;
    if (q === 1 && r === -2) return 0;
    if (q === 2 && r === -2) return 1;
    if (q === 2 && r === -1) return 1;
    if (q === 2 && r === 0) return 2;
    if (q === 1 && r === 1) return 2;
    if (q === 0 && r === 2) return 3;
    if (q === -1 && r === 2) return 3;
    if (q === -2 && r === 2) return 4;
    if (q === -2 && r === 1) return 4;
    if (q === -2 && r === 0) return 5;
    if (q === -1 && r === -1) return 5;
    return 0;
  };

  // 使用 useMemo 缓存颜色映射表，防止重复查找
  const playerColorMap = useMemo(() => {
    const map = {};
    // 注意：这里使用 players (复数) 进行遍历
    if (Array.isArray(players)) {
      players.forEach(p => {
        // 使用 String 转换 ID，确保类型一致，并匹配后端字段 player_id
        map[String(p.player_id)] = p.color;
      });
    }
    return map;
  }, [players]);


  return (
    <div className="hexagon-map-container">
      <svg width="950" height="850" viewBox="0 0 900 900" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="hexShadow">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.4" />
          </filter>
          {/* 海洋波纹纹理 */}
          <pattern id="ocean-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M0 50 Q 25 35 50 50 T 100 50" fill="none" stroke="white" strokeOpacity="0.05" />
          </pattern>
        </defs>

        {/* 渲染背景装饰 */}
        <rect width="100%" height="100%" fill="url(#ocean-pattern)" pointerEvents="none" />

        {/* 渲染六边形地块 */}
        {hexagons?.map((hex) => {
          const { x, y } = hexToPixel(hex.q, hex.r);
          return (
            <g key={`hex-${hex.q}-${hex.r}`} className="hexagon-group">
              <path
                d={generateHexPath(x, y)}
                fill={TERRAIN_COLORS[hex.terrain] || "#8f9ba8"}
                stroke="#1a2533"
                strokeWidth="2.5"
                filter="url(#hexShadow)"
                className="hexagon-path"
                onClick={() => onHexClick?.(hex)}
              />

              {/* 渲染港口 (后端新增数据) */}
              {hex.is_port && (
                <g transform={`translate(${x}, ${y})`}>
                   {/* 简单的港口标记：一个小圆圈代表码头 */}
                   <circle 
                    cx={65 * Math.cos((Math.PI/3) * getHarborDirection(hex.q, hex.r) - Math.PI/2)} 
                    cy={65 * Math.sin((Math.PI/3) * getHarborDirection(hex.q, hex.r) - Math.PI/2)} 
                    r="12" 
                    fill="#2c3e50" 
                    stroke="#ecf0f1" 
                    strokeWidth="2"
                  />
                  <text 
                    x={65 * Math.cos((Math.PI/3) * getHarborDirection(hex.q, hex.r) - Math.PI/2)} 
                    y={65 * Math.sin((Math.PI/3) * getHarborDirection(hex.q, hex.r) - Math.PI/2) + 5}
                    textAnchor="middle" 
                    fontSize="12" 
                    fill="white"
                  >
                    {RESOURCE_ICONS[hex.port_type] || RESOURCE_ICONS.generic}
                  </text>
                </g>
              )}

              {/* 资源图标 */}
              <text x={x} y={y - 12} textAnchor="middle" fontSize="26">
                {RESOURCE_ICONS[hex.resource] || ""}
              </text>

              {/* 骰子数字 */}
              {hex.number && (
                <g className="number-token">
                  <circle cx={x} cy={y + 18} r="16" fill="#fdf5e6" stroke="#2c3e50" strokeWidth="1" />
                  <text
                    x={x}
                    y={y + 24}
                    textAnchor="middle"
                    fontSize="16"
                    fontWeight="900"
                    fill={getNumberColor(hex.number)}
                  >
                    {hex.number}
                  </text>
                </g>
              )}

              {/* 强盗 */}
              {hex.has_robber && (
                <text x={x} y={y + 5} textAnchor="middle" fontSize="30" style={{ pointerEvents: 'none' }}>
                  👤
                </text>
              )}
            </g>
          );
        })}

        {/* 渲染道路提示/点击层 */}
        {isSetupOrBuildMode && buildMode === "road" && hexagons?.flatMap((hex) => {
            const { x, y } = hexToPixel(hex.q, hex.r);
            return [0, 1, 2, 3, 4, 5].map((dir) => {
              const v1 = getVertexPosition(x, y, dir);
              const v2 = getVertexPosition(x, y, (dir + 1) % 6);
              const key = `${hex.q},${hex.r},${dir}`;
              return (
                <line
                  key={`edge-guide-${key}`}
                  x1={v1.x} y1={v1.y} x2={v2.x} y2={v2.y}
                  className={`edge-clickable ${hintKeySet.has(key) ? "hint-target-edge" : ""}`}
                  onClick={(e) => { e.stopPropagation(); onHexClick?.(hex, "edge", dir); }}
                />
              );
            });
        })}

        {/* 渲染顶点提示/点击层 */}
        {isSetupOrBuildMode && (!buildMode || buildMode === "settlement") && hexagons?.flatMap((hex) => {
        {isSetupOrBuildMode && (!buildMode || buildMode === "settlement" || buildMode === "city") && hexagons?.flatMap((hex) => {
            const { x, y } = hexToPixel(hex.q, hex.r);
            return [0, 1, 2, 3, 4, 5].map((dir) => {
              const vertex = getVertexPosition(x, y, dir);
              const key = `${hex.q},${hex.r},${dir}`;
              const isOwnerSettlement = playerSettlementKeys.has(key);
              const allowClickCity = buildMode === 'city' ? isOwnerSettlement : true;
              let allowClickSettlement = true;
              if (buildMode === 'settlement') {
                if (occupiedVertexKeys.has(key)) {
                  allowClickSettlement = false;
                } else {
                  const adj = getAdjacentVertexKeys(hex.q, hex.r, dir);
                  for (const a of adj) {
                    if (occupiedVertexKeys.has(a)) {
                      allowClickSettlement = false;
                      break;
                    }
                  }
                }
              }
              const allowClick = buildMode === 'settlement' ? allowClickSettlement : allowClickCity;
              const classNames = ["vertex-clickable"];
              if (hintKeySet.has(key)) classNames.push("hint-target-vertex");
              if (buildMode === 'city' && isOwnerSettlement) classNames.push('owner-settlement');
              if (buildMode === 'city' && !isOwnerSettlement) classNames.push('vertex-disabled');
              if (buildMode === 'settlement' && allowClick) classNames.push('vertex-available');
              if (buildMode === 'settlement' && !allowClick) classNames.push('vertex-disabled');

              return (
                <circle
                  key={`vertex-guide-${key}`}
                  cx={vertex.x} cy={vertex.y} r="8"
                  className={`vertex-clickable ${hintKeySet.has(key) ? "hint-target-vertex" : ""}`}
                  onClick={(e) => { e.stopPropagation(); onHexClick?.(hex, "vertex", dir); }}
                  className={classNames.join(' ')}
                  onClick={(e) => { e.stopPropagation(); if (allowClick) onHexClick?.(hex, "vertex", dir); }}
                />
              );
            });
        })}
{/* 渲染已有的道路 */}
        {roads && Object.entries(roads).map(([key, road]) => {
          if (!road?.position) return null;
          const [q, r, dir] = road.position;
          const { x, y } = hexToPixel(q, r);
          const v1 = getVertexPosition(x, y, dir);
          const v2 = getVertexPosition(x, y, (dir + 1) % 6);
          
          // 从映射表取色，若无则默认为白色 (防止黑屏)
          const roadColor = playerColorMap[String(road.player_id)] || "#ffffff";

          return (
            <line 
              key={`road-built-${key}`} 
              x1={v1.x} y1={v1.y} x2={v2.x} y2={v2.y} 
              className="road-line" 
              style={{ 
                stroke: roadColor, // 关键：同步颜色
                strokeWidth: "8px", 
                strokeLinecap: "round"
              }} 
            />
          );
        })}

        {/* 渲染已有的建筑 */}
        {/* 渲染已有的建筑：按玩家颜色区分 */}
        {buildings && Object.entries(buildings).map(([key, b]) => {
          if (!b?.position) return null;
          const [q, r, dir] = b.position;
          const { x, y } = hexToPixel(q, r);
          const vertex = getVertexPosition(x, y, dir);
<<<<<<< Updated upstream

          const buildColor = playerColorMap[String(b.player_id)] || "#ffffff";

          return (
            <g key={`build-built-${key}`} transform={`translate(${vertex.x}, ${vertex.y})`}>
              <circle 
                r={b.type === "city" ? "17" : "14"} 
                fill={buildColor} // 关键：同步颜色
                stroke="white" 
                strokeWidth="2.5" 
                style={{ filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.4))" }}
              />
              <text textAnchor="middle" y="5" fontSize="16" style={{ pointerEvents: "none" }}>
                {b.type === "city" ? "🏛️" : "🏠"}
=======
          // 找到对应玩家颜色（后端 player 对象中包含 color 字段）
          const owner = players?.find((p) => p.player_id === b.player_id) || {};
          const ownerColor = owner.color || (b.player_id ? `hsl(${(b.player_id * 67) % 360} 60% 45%)` : '#888');

          // 城市绘制为带边框的大圆，村庄为小圆，颜色基于玩家颜色
          const fillColor = ownerColor;
          const strokeColor = '#ffffff';
          const isCity = b.type === 'city';

          return (
            <g key={`build-built-${key}`} transform={`translate(${vertex.x}, ${vertex.y})`} style={{ pointerEvents: 'none' }}>
              <circle r={isCity ? 16 : 12} fill={fillColor} stroke={strokeColor} strokeWidth={isCity ? 3 : 2} />
              <text textAnchor="middle" y="6" fontSize={isCity ? 16 : 14} style={{ pointerEvents: 'none' }}>
                {isCity ? '🏛️' : '🏠'}
>>>>>>> Stashed changes
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default HexagonMap;