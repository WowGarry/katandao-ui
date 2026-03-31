import React from 'react';
import './HexagonMap.css';

/**
 * 六边形地图组件
 */
const HexagonMap = ({ hexagons, buildings, roads, onHexClick, buildMode, currentPhase }) => {
  // 调试：打印建筑和道路数据
  console.log('HexagonMap渲染:', {
    buildings,
    roads,
    buildingsCount: buildings ? Object.keys(buildings).length : 0,
    roadsCount: roads ? Object.keys(roads).length : 0
  });
  // 计算六边形在SVG中的位置
  const hexToPixel = (q, r) => {
    const size = 60; // 六边形大小
    const x = size * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
    const y = size * (3 / 2 * r);
    return { x: x + 450, y: y + 450 }; // 加偏移量使地图居中
  };

  // 生成六边形路径
  const generateHexPath = (centerX, centerY, size = 60) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const x = centerX + size * Math.cos(angle);
      const y = centerY + size * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return `M ${points.join(' L ')} Z`;
  };

  // 获取地形颜色
  const getTerrainColor = (terrain) => {
    const colors = {
      forest: '#228B22',    // 森林 - 深绿
      hills: '#8B4513',     // 山丘 - 棕色
      pasture: '#90EE90',   // 牧场 - 浅绿
      fields: '#FFD700',    // 农田 - 金黄
      mountains: '#808080', // 山脉 - 灰色
      desert: '#F4A460'     // 沙漠 - 沙褐色
    };
    return colors[terrain] || '#cccccc';
  };

  // 获取资源图标
  const getResourceIcon = (resource) => {
    const icons = {
      wood: '🌲',
      brick: '🧱',
      sheep: '🐑',
      wheat: '🌾',
      ore: '⛏️',
      desert: '🏜️'
    };
    return icons[resource] || '';
  };

  // 获取点数颜色（6和8是红色）
  const getNumberColor = (number) => {
    return (number === 6 || number === 8) ? '#dc2626' : '#1f2937';
  };

  // 计算六边形顶点位置
  const getVertexPosition = (centerX, centerY, direction, size = 60) => {
    const angle = (Math.PI / 3) * direction - Math.PI / 2;
    return {
      x: centerX + size * Math.cos(angle),
      y: centerY + size * Math.sin(angle)
    };
  };

  // 计算六边形边的中点位置
  const getEdgePosition = (centerX, centerY, direction, size = 60) => {
    const angle1 = (Math.PI / 3) * direction - Math.PI / 2;
    const angle2 = (Math.PI / 3) * ((direction + 1) % 6) - Math.PI / 2;
    return {
      x: centerX + size * (Math.cos(angle1) + Math.cos(angle2)) / 2,
      y: centerY + size * (Math.sin(angle1) + Math.sin(angle2)) / 2
    };
  };

  const isSetupOrBuildMode = currentPhase === 'setup' || buildMode;

  return (
    <div className="hexagon-map-container">
      <svg width="950" height="750" viewBox="0 0 900 900" preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* 六边形阴影 */}
          <filter id="hexShadow">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3"/>
          </filter>
          {/* 强盗阴影 */}
          <filter id="robberShadow">
            <feDropShadow dx="1" dy="1" stdDeviation="2" floodOpacity="0.5"/>
          </filter>
        </defs>

        {hexagons && hexagons.map((hex, index) => {
          const { x, y } = hexToPixel(hex.q, hex.r);
          const path = generateHexPath(x, y);

          return (
            <g 
              key={`hex-${hex.q}-${hex.r}`}
              onClick={() => onHexClick && onHexClick(hex)}
              style={{ cursor: onHexClick ? 'pointer' : 'default' }}
              className="hexagon-group"
            >
              {/* 六边形本体 */}
              <path
                d={path}
                fill={getTerrainColor(hex.terrain)}
                stroke="#2d3748"
                strokeWidth="2"
                filter="url(#hexShadow)"
                className="hexagon-path"
              />

              {/* 资源图标 */}
              <text
                x={x}
                y={y - 10}
                textAnchor="middle"
                fontSize="24"
              >
                {getResourceIcon(hex.resource)}
              </text>

              {/* 骰子点数 */}
              {hex.number && (
                <>
                  <circle
                    cx={x}
                    cy={y + 15}
                    r="18"
                    fill="#f8f9fa"
                    stroke="#2d3748"
                    strokeWidth="1.5"
                  />
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

              {/* 强盗 */}
              {hex.has_robber && (
                <g filter="url(#robberShadow)">
                  <circle cx={x} cy={y} r="15" fill="#1a1a1a" opacity="0.8"/>
                  <text
                    x={x}
                    y={y + 6}
                    textAnchor="middle"
                    fontSize="20"
                  >
                    🦹
                  </text>
                </g>
              )}

              {/* 坐标标签（调试用） */}
              {process.env.NODE_ENV === 'development' && (
                <text
                  x={x}
                  y={y + 40}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#666"
                  opacity="0.5"
                >
                  {hex.q},{hex.r}
                </text>
              )}
            </g>
          );
        })}

        {/* 可点击的顶点（村庄建造模式） */}
        {isSetupOrBuildMode && (!buildMode || buildMode === 'settlement') && hexagons && hexagons.map((hex) => {
          const { x, y } = hexToPixel(hex.q, hex.r);
          return [0, 1, 2, 3, 4, 5].map(direction => {
            const vertex = getVertexPosition(x, y, direction);
            const key = `vertex-${hex.q}-${hex.r}-${direction}`;
            
            return (
              <circle
                key={key}
                cx={vertex.x}
                cy={vertex.y}
                r="9"
                fill="#3b82f6"
                fillOpacity="0.6"
                stroke="white"
                strokeWidth="2"
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onHexClick && onHexClick(hex, 'vertex', direction);
                }}
                className="vertex-clickable"
              />
            );
          });
        })}

        {/* 可点击的已有村庄（城市升级模式） */}
        {buildMode === 'city' && buildings && Object.entries(buildings).map(([key, building]) => {
          if (building.type !== 'settlement') return null;
          
          const pos = building.position || [0, 0, 0];
          const { x, y } = hexToPixel(pos[0], pos[1]);
          const vertex = getVertexPosition(x, y, pos[2]);
          
          return (
            <circle
              key={`upgrade-${key}`}
              cx={vertex.x}
              cy={vertex.y}
              r="20"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3"
              strokeDasharray="6,3"
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                const hex = hexagons.find(h => h.q === pos[0] && h.r === pos[1]);
                if (hex) {
                  onHexClick && onHexClick(hex, 'vertex', pos[2]);
                }
              }}
              className="city-upgrade-highlight"
            >
              <animate
                attributeName="stroke-opacity"
                values="1;0.4;1"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </circle>
          );
        })}

        {/* 可点击的边（道路模式时显示） */}
        {isSetupOrBuildMode && buildMode === 'road' && hexagons && hexagons.map((hex) => {
          const { x, y } = hexToPixel(hex.q, hex.r);
          return [0, 1, 2, 3, 4, 5].map(direction => {
            const v1 = getVertexPosition(x, y, direction);
            const v2 = getVertexPosition(x, y, (direction + 1) % 6);
            const key = `edge-${hex.q}-${hex.r}-${direction}`;
            
            return (
              <line
                key={key}
                x1={v1.x}
                y1={v1.y}
                x2={v2.x}
                y2={v2.y}
                stroke="#10b981"
                strokeWidth="7"
                strokeOpacity="0.6"
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onHexClick && onHexClick(hex, 'edge', direction);
                }}
                className="edge-clickable"
              />
            );
          });
        })}

        {/* 显示已放置的建筑 */}
        {buildings && Object.entries(buildings).map(([key, building]) => {
          console.log('渲染建筑:', key, building);
          const pos = building.position || [0, 0, 0];
          const { x, y } = hexToPixel(pos[0], pos[1]);
          const vertex = getVertexPosition(x, y, pos[2]);
          
          return (
            <g key={`building-${key}`}>
              <circle
                cx={vertex.x}
                cy={vertex.y}
                r="17"
                fill={building.type === 'city' ? '#f59e0b' : '#10b981'}
                stroke="white"
                strokeWidth="3"
              />
              <text
                x={vertex.x}
                y={vertex.y + 7}
                textAnchor="middle"
                fontSize="22"
              >
                {building.type === 'settlement' ? '🏘️' : '🏰'}
              </text>
            </g>
          );
        })}

        {/* 显示已放置的道路 */}
        {roads && Object.entries(roads).map(([key, road]) => {
          console.log('渲染道路:', key, road);
          const pos = road.position || [0, 0, 0];
          const { x, y } = hexToPixel(pos[0], pos[1]);
          const v1 = getVertexPosition(x, y, pos[2]);
          const v2 = getVertexPosition(x, y, (pos[2] + 1) % 6);
          
          return (
            <line
              key={`road-${key}`}
              x1={v1.x}
              y1={v1.y}
              x2={v2.x}
              y2={v2.y}
              stroke="#dc2626"
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

