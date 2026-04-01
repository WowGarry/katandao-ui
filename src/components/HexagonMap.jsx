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
  desert: "🏜️",
};

const HexagonMap = ({
  hexagons,
  buildings,
  roads,
  onHexClick,
  buildMode,
  currentPhase,
  hintAction,
  hintPositions,
}) => {
  const isSetupOrBuildMode = currentPhase === "setup" || Boolean(buildMode);
  const hintKeySet = useMemo(
    () => new Set((hintPositions || []).map((pos) => `${pos[0]},${pos[1]},${pos[2]}`)),
    [hintPositions]
  );

  const hexToPixel = (q, r) => {
    const size = 60;
    const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
    const y = size * ((3 / 2) * r);
    return { x: x + 450, y: y + 450 };
  };

  const generateHexPath = (centerX, centerY, size = 60) => {
    const points = [];
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      points.push(`${centerX + size * Math.cos(angle)},${centerY + size * Math.sin(angle)}`);
    }
    return `M ${points.join(" L ")} Z`;
  };

  const getNumberColor = (number) => (number === 6 || number === 8 ? "#c81f1f" : "#1c2430");

  const getVertexPosition = (centerX, centerY, direction, size = 60) => {
    const angle = (Math.PI / 3) * direction - Math.PI / 2;
    return {
      x: centerX + size * Math.cos(angle),
      y: centerY + size * Math.sin(angle),
    };
  };

  const shouldHintVertex = (positionKey) =>
    hintKeySet.has(positionKey) && (hintAction === "build_settlement" || hintAction === "build_city");

  const shouldHintEdge = (positionKey) => hintKeySet.has(positionKey) && hintAction === "build_road";

  return (
    <div className="hexagon-map-container" data-guide-target="hex-map">
      <svg width="950" height="750" viewBox="0 0 900 900" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="hexShadow">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.32" />
          </filter>
          <filter id="robberShadow">
            <feDropShadow dx="1" dy="1" stdDeviation="2" floodOpacity="0.45" />
          </filter>
        </defs>

        {hexagons?.map((hex) => {
          const { x, y } = hexToPixel(hex.q, hex.r);
          return (
            <g
              key={`hex-${hex.q}-${hex.r}`}
              className="hexagon-group"
              onClick={() => onHexClick?.(hex)}
              style={{ cursor: onHexClick ? "pointer" : "default" }}
            >
              <path
                d={generateHexPath(x, y)}
                fill={TERRAIN_COLORS[hex.terrain] || "#8f9ba8"}
                stroke="#202833"
                strokeWidth="2"
                filter="url(#hexShadow)"
                className="hexagon-path"
              />

              <text x={x} y={y - 10} textAnchor="middle" fontSize="23">
                {RESOURCE_ICONS[hex.resource] || ""}
              </text>

              {hex.number && (
                <>
                  <circle cx={x} cy={y + 16} r="18" fill="#f5ede0" stroke="#2f3945" strokeWidth="1.5" />
                  <text
                    x={x}
                    y={y + 22}
                    textAnchor="middle"
                    fontSize="18"
                    fontWeight="bold"
                    fill={getNumberColor(hex.number)}
                  >
                    {hex.number}
                  </text>
                </>
              )}

              {hex.has_robber && (
                <g filter="url(#robberShadow)">
                  <circle cx={x} cy={y} r="15" fill="#1f1f1f" opacity="0.86" />
                  <text x={x} y={y + 7} textAnchor="middle" fontSize="20">
                    🦹
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {isSetupOrBuildMode &&
          (!buildMode || buildMode === "settlement") &&
          hexagons?.flatMap((hex) => {
            const { x, y } = hexToPixel(hex.q, hex.r);
            return [0, 1, 2, 3, 4, 5].map((direction) => {
              const vertex = getVertexPosition(x, y, direction);
              const key = `${hex.q},${hex.r},${direction}`;
              return (
                <circle
                  key={`vertex-${key}`}
                  cx={vertex.x}
                  cy={vertex.y}
                  r="9"
                  fill="#4f86db"
                  fillOpacity="0.7"
                  stroke="#f3fbff"
                  strokeWidth="2"
                  className={`vertex-clickable ${shouldHintVertex(key) ? "hint-target-vertex" : ""}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onHexClick?.(hex, "vertex", direction);
                  }}
                />
              );
            });
          })}

        {isSetupOrBuildMode &&
          buildMode === "road" &&
          hexagons?.flatMap((hex) => {
            const { x, y } = hexToPixel(hex.q, hex.r);
            return [0, 1, 2, 3, 4, 5].map((direction) => {
              const v1 = getVertexPosition(x, y, direction);
              const v2 = getVertexPosition(x, y, (direction + 1) % 6);
              const key = `${hex.q},${hex.r},${direction}`;
              return (
                <line
                  key={`edge-${key}`}
                  x1={v1.x}
                  y1={v1.y}
                  x2={v2.x}
                  y2={v2.y}
                  stroke="#39b478"
                  strokeWidth="7"
                  strokeOpacity="0.66"
                  className={`edge-clickable ${shouldHintEdge(key) ? "hint-target-edge" : ""}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onHexClick?.(hex, "edge", direction);
                  }}
                />
              );
            });
          })}

        {buildMode === "city" &&
          buildings &&
          Object.entries(buildings).map(([key, building]) => {
            if (building.type !== "settlement") {
              return null;
            }
            const [q, r, direction] = building.position || [0, 0, 0];
            const { x, y } = hexToPixel(q, r);
            const vertex = getVertexPosition(x, y, direction);
            const shouldHint = shouldHintVertex(`${q},${r},${direction}`);

            return (
              <circle
                key={`city-upgrade-${key}`}
                cx={vertex.x}
                cy={vertex.y}
                r="22"
                fill="none"
                stroke={shouldHint ? "#f4d389" : "#f7b058"}
                strokeWidth="3"
                strokeDasharray="7,4"
                className={`city-upgrade-highlight ${shouldHint ? "hint-city-ring" : ""}`}
                onClick={(event) => {
                  event.stopPropagation();
                  const sourceHex = hexagons?.find((hex) => hex.q === q && hex.r === r);
                  if (sourceHex) {
                    onHexClick?.(sourceHex, "vertex", direction);
                  }
                }}
              />
            );
          })}

        {buildings &&
          Object.entries(buildings).map(([key, building]) => {
            const [q, r, direction] = building.position || [0, 0, 0];
            const { x, y } = hexToPixel(q, r);
            const vertex = getVertexPosition(x, y, direction);
            const shouldFlashCityUpgrade =
              hintAction === "build_city" &&
              building.type === "settlement" &&
              hintKeySet.has(`${q},${r},${direction}`);

            return (
              <g key={`building-${key}`}>
                <circle
                  cx={vertex.x}
                  cy={vertex.y}
                  r="17"
                  fill={building.type === "city" ? "#f0a638" : "#3bc48a"}
                  stroke="#ffffff"
                  strokeWidth="3"
                />
                <text x={vertex.x} y={vertex.y + 7} textAnchor="middle" fontSize="21">
                  {building.type === "city" ? "🏛️" : "🏘️"}
                </text>
                {shouldFlashCityUpgrade && (
                  <circle cx={vertex.x} cy={vertex.y} r="22" className="hint-city-ring" />
                )}
              </g>
            );
          })}

        {roads &&
          Object.entries(roads).map(([key, road]) => {
            const [q, r, direction] = road.position || [0, 0, 0];
            const { x, y } = hexToPixel(q, r);
            const v1 = getVertexPosition(x, y, direction);
            const v2 = getVertexPosition(x, y, (direction + 1) % 6);
            return (
              <line
                key={`road-${key}`}
                x1={v1.x}
                y1={v1.y}
                x2={v2.x}
                y2={v2.y}
                stroke="#db4a45"
                strokeWidth="9"
                strokeLinecap="round"
              />
            );
          })}
      </svg>
    </div>
  );
};

export default HexagonMap;
