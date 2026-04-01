// src/services/mockApi.js

const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

let currentMockGameState = null;

const RESOURCE_TYPES = ['wood', 'brick', 'sheep', 'wheat', 'ore'];

const BUILD_COST = {
  road: { wood: 1, brick: 1 },
  settlement: { wood: 1, brick: 1, sheep: 1, wheat: 1 },
  city: { wheat: 2, ore: 3 }
};

const terrainToResource = {
  forest: 'wood',
  hills: 'brick',
  pasture: 'sheep',
  fields: 'wheat',
  mountains: 'ore',
  desert: null
};

function deepClone(data) {
  return JSON.parse(JSON.stringify(data));
}

function positionEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function findPlayer(playerId) {
  return currentMockGameState?.players?.find(p => p.player_id === playerId);
}

function canAfford(player, cost) {
  return Object.entries(cost).every(([key, value]) => (player.resources[key] || 0) >= value);
}

function payCost(player, cost) {
  Object.entries(cost).forEach(([key, value]) => {
    player.resources[key] -= value;
  });
}

function addResources(player, resources) {
  Object.entries(resources).forEach(([key, value]) => {
    player.resources[key] = (player.resources[key] || 0) + value;
  });
}

function updateVictoryPoints() {
  if (!currentMockGameState) return;

  currentMockGameState.players.forEach(player => {
    let points = 0;

    currentMockGameState.vertex_buildings.forEach(building => {
      if (building.player_id === player.player_id) {
        if (building.type === 'settlement') points += 1;
        if (building.type === 'city') points += 2;
      }
    });

    player.victory_points = points;
  });

  const winner = currentMockGameState.players.find(p => p.victory_points >= 10);
  if (winner) {
    currentMockGameState.is_finished = true;
    currentMockGameState.winner_id = winner.player_id;
    currentMockGameState.status = 'finished';
  }
}

function ensureGameReady() {
  if (!currentMockGameState) {
    return { success: false, error: '游戏未初始化' };
  }
  return null;
}

function ensureCurrentPlayer(playerId) {
  if (currentMockGameState.current_player_id !== playerId) {
    return { success: false, error: '还没轮到该玩家行动' };
  }
  return null;
}

function getInitialGameState(players) {
  const formattedPlayers = players.map((p, index) => ({
    player_id: `player_${index + 1}`,
    name: p.name,
    color: p.color,
    is_ai: p.is_ai,
    resources: {
      wood: 4,
      brick: 4,
      sheep: 2,
      wheat: 2,
      ore: 2
    },
    roads_left: 15,
    settlements_left: 5,
    cities_left: 4,
    victory_points: 0
  }));

  return {
    game_id: 'mock_game_888',
    status: 'playing',
    is_finished: false,
    winner_id: null,
    current_player_id: 'player_1',
    players: formattedPlayers,
    vertex_buildings: [],
    edge_buildings: [],
    hex_map: {
      hexagons: generateDefaultMap()
    },
    phase: 'main',
    turn: 1,
    last_dice_roll: null,
    has_rolled_dice: false,
    robber_position: null,
    logs: []
  };
}

// 标准 19 块六边形
function generateDefaultMap() {
  const positions = [
    [-2, 0], [-2, 1], [-2, 2],
    [-1, -1], [-1, 0], [-1, 1], [-1, 2],
    [0, -2], [0, -1], [0, 0], [0, 1], [0, 2],
    [1, -2], [1, -1], [1, 0], [1, 1],
    [2, -2], [2, -1], [2, 0]
  ];

  const terrainPool = [
    'forest', 'forest', 'forest', 'forest',
    'hills', 'hills', 'hills',
    'pasture', 'pasture', 'pasture', 'pasture',
    'fields', 'fields', 'fields', 'fields',
    'mountains', 'mountains', 'mountains',
    'desert'
  ];

  const numberPool = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];

  const shuffledTerrain = [...terrainPool].sort(() => Math.random() - 0.5);
  const shuffledNumbers = [...numberPool].sort(() => Math.random() - 0.5);

  const map = [];
  let numberIndex = 0;

  positions.forEach(([q, r]) => {
    const terrain = shuffledTerrain.pop();
    let number = null;

    if (terrain === 'desert') {
      number = 0;
    } else {
      number = shuffledNumbers[numberIndex++];
    }

    map.push({
      q,
      r,
      terrain,
      number
    });
  });

  return map;
}

// 简化资源发放：
// 如果建筑 position 的 [q,r] 与骰子点数对应的 hex [q,r] 相同，就视为相邻。
// 这是 mock 版本，足够先让前端跑通。
function distributeResourcesByDice(total) {
  if (!currentMockGameState || total === 7) return;

  const matchedHexes = currentMockGameState.hex_map.hexagons.filter(hex => hex.number === total);

  matchedHexes.forEach(hex => {
    const resourceType = terrainToResource[hex.terrain];
    if (!resourceType) return;

    currentMockGameState.vertex_buildings.forEach(building => {
      const [bq, br] = building.position;
      if (bq === hex.q && br === hex.r) {
        const player = findPlayer(building.player_id);
        if (!player) return;

        const amount = building.type === 'city' ? 2 : 1;
        player.resources[resourceType] += amount;
      }
    });
  });
}

function hasVertexBuilding(position) {
  return currentMockGameState.vertex_buildings.some(b => positionEqual(b.position, position));
}

function getVertexBuilding(position) {
  return currentMockGameState.vertex_buildings.find(b => positionEqual(b.position, position));
}

function hasRoad(position) {
  return currentMockGameState.edge_buildings.some(b => positionEqual(b.position, position));
}

function getAvailableVertexPositions() {
  const positions = [];
  currentMockGameState.hex_map.hexagons.forEach(hex => {
    for (let dir = 0; dir < 6; dir++) {
      positions.push([hex.q, hex.r, dir]);
    }
  });
  return positions;
}

function getAvailableEdgePositions() {
  const positions = [];
  currentMockGameState.hex_map.hexagons.forEach(hex => {
    for (let dir = 0; dir < 6; dir++) {
      positions.push([hex.q, hex.r, dir]);
    }
  });
  return positions;
}

function logAction(text) {
  currentMockGameState.logs.unshift({
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    text,
    time: new Date().toLocaleTimeString()
  });
  currentMockGameState.logs = currentMockGameState.logs.slice(0, 50);
}

function buildInternal(playerId, buildingType, position, ignoreRollCheck = false) {
  const player = findPlayer(playerId);
  if (!player) return { success: false, error: '玩家不存在' };

  if (!ignoreRollCheck && !currentMockGameState.has_rolled_dice) {
    return { success: false, error: '本回合请先掷骰子' };
  }

  if (buildingType === 'road') {
    if (player.roads_left <= 0) return { success: false, error: '道路已用完' };
    if (!canAfford(player, BUILD_COST.road)) return { success: false, error: '资源不足，无法建造道路' };
    if (hasRoad(position)) return { success: false, error: '该位置已有道路' };

    payCost(player, BUILD_COST.road);
    player.roads_left -= 1;
    currentMockGameState.edge_buildings.push({
      player_id: playerId,
      type: 'road',
      position
    });

    logAction(`${player.name} 建造了道路 ${position.join(',')}`);
    updateVictoryPoints();
    return { success: true, message: `在 ${position.join(',')} 建造道路成功` };
  }

  if (buildingType === 'settlement') {
    if (player.settlements_left <= 0) return { success: false, error: '村庄已用完' };
    if (!canAfford(player, BUILD_COST.settlement)) return { success: false, error: '资源不足，无法建造村庄' };
    if (hasVertexBuilding(position)) return { success: false, error: '该顶点已有建筑' };

    payCost(player, BUILD_COST.settlement);
    player.settlements_left -= 1;
    currentMockGameState.vertex_buildings.push({
      player_id: playerId,
      type: 'settlement',
      position
    });

    logAction(`${player.name} 建造了村庄 ${position.join(',')}`);
    updateVictoryPoints();
    return { success: true, message: `在 ${position.join(',')} 建造村庄成功` };
  }

  if (buildingType === 'city') {
    if (player.cities_left <= 0) return { success: false, error: '城市已用完' };
    if (!canAfford(player, BUILD_COST.city)) return { success: false, error: '资源不足，无法升级城市' };

    const oldBuilding = getVertexBuilding(position);
    if (!oldBuilding) return { success: false, error: '该位置没有可升级的村庄' };
    if (oldBuilding.player_id !== playerId) return { success: false, error: '只能升级自己的村庄' };
    if (oldBuilding.type !== 'settlement') return { success: false, error: '只有村庄可以升级为城市' };

    payCost(player, BUILD_COST.city);
    player.cities_left -= 1;
    player.settlements_left += 1;

    oldBuilding.type = 'city';

    logAction(`${player.name} 将村庄升级为城市 ${position.join(',')}`);
    updateVictoryPoints();
    return { success: true, message: `在 ${position.join(',')} 升级城市成功` };
  }

  return { success: false, error: '未知建筑类型' };
}

function endTurnInternal(playerId) {
  const currentIndex = currentMockGameState.players.findIndex(p => p.player_id === playerId);
  const nextIndex = (currentIndex + 1) % currentMockGameState.players.length;

  currentMockGameState.current_player_id = currentMockGameState.players[nextIndex].player_id;
  currentMockGameState.has_rolled_dice = false;
  currentMockGameState.last_dice_roll = null;
  currentMockGameState.phase = 'main';

  if (nextIndex === 0) {
    currentMockGameState.turn += 1;
  }

  logAction(`回合结束，轮到 ${currentMockGameState.players[nextIndex].name}`);
}

function bankTradeInternal(playerId, give, receive) {
  const player = findPlayer(playerId);
  if (!player) return { success: false, error: '玩家不存在' };

  if (!currentMockGameState.has_rolled_dice) {
    return { success: false, error: '本回合请先掷骰子再交易' };
  }

  if (!give || !receive) {
    return { success: false, error: '交易参数不完整' };
  }

  const { resource: giveResource, amount: giveAmount } = give;
  const { resource: receiveResource, amount: receiveAmount } = receive;

  if (!RESOURCE_TYPES.includes(giveResource) || !RESOURCE_TYPES.includes(receiveResource)) {
    return { success: false, error: '资源类型无效' };
  }

  if (giveResource === receiveResource) {
    return { success: false, error: '不能用同一种资源进行同种交换' };
  }

  if (giveAmount !== 4 || receiveAmount !== 1) {
    return { success: false, error: '当前 mock 仅支持 4:1 银行交易' };
  }

  if ((player.resources[giveResource] || 0) < 4) {
    return { success: false, error: `${giveResource} 资源不足，无法交易` };
  }

  player.resources[giveResource] -= 4;
  player.resources[receiveResource] += 1;

  logAction(`${player.name} 用 4 ${giveResource} 交换了 1 ${receiveResource}`);
  return {
    success: true,
    message: `交易成功：4 ${giveResource} → 1 ${receiveResource}`
  };
}

function getRandomEmptyVertex() {
  const positions = getAvailableVertexPositions();
  const empty = positions.filter(pos => !hasVertexBuilding(pos));
  if (!empty.length) return null;
  return empty[Math.floor(Math.random() * empty.length)];
}

function getRandomEmptyEdge() {
  const positions = getAvailableEdgePositions();
  const empty = positions.filter(pos => !hasRoad(pos));
  if (!empty.length) return null;
  return empty[Math.floor(Math.random() * empty.length)];
}

export const api = {
  async createGame(playerCount = 4, players = [], mapType = 'standard') {
    await delay(800);

    const fallbackPlayers = players.length
      ? players
      : Array.from({ length: playerCount }).map((_, index) => ({
          name: `玩家${index + 1}`,
          color: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'][index] || '#999999',
          is_ai: false
        }));

    currentMockGameState = getInitialGameState(fallbackPlayers);
    updateVictoryPoints();

    return {
      success: true,
      game_id: currentMockGameState.game_id,
      game_state: deepClone(currentMockGameState),
      message: 'Mock 游戏创建成功'
    };
  },

  async getGame(gameId) {
    await delay(300);

    const error = ensureGameReady();
    if (error) return error;

    return {
      success: true,
      game_state: deepClone(currentMockGameState)
    };
  },

  async rollDice(gameId, playerId) {
    await delay(500);

    const error = ensureGameReady() || ensureCurrentPlayer(playerId);
    if (error) return error;

    if (currentMockGameState.is_finished) {
      return { success: false, error: '游戏已结束' };
    }

    if (currentMockGameState.has_rolled_dice) {
      return { success: false, error: '本回合已经掷过骰子了' };
    }

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2;

    currentMockGameState.last_dice_roll = { dice1: d1, dice2: d2, total };
    currentMockGameState.has_rolled_dice = true;

    distributeResourcesByDice(total);
    logAction(`${findPlayer(playerId)?.name || playerId} 掷出了 ${d1}+${d2}=${total}`);

    updateVictoryPoints();

    return {
      success: true,
      dice1: d1,
      dice2: d2,
      total,
      game_state: deepClone(currentMockGameState)
    };
  },

  async build(gameId, playerId, buildingType, position) {
    await delay(300);

    const error = ensureGameReady() || ensureCurrentPlayer(playerId);
    if (error) return error;

    if (currentMockGameState.is_finished) {
      return { success: false, error: '游戏已结束' };
    }

    const result = buildInternal(playerId, buildingType, position);

    return {
      ...result,
      game_state: deepClone(currentMockGameState)
    };
  },

  async tradeWithBank(gameId, playerId, give, receive) {
    await delay(300);

    const error = ensureGameReady() || ensureCurrentPlayer(playerId);
    if (error) return error;

    if (currentMockGameState.is_finished) {
      return { success: false, error: '游戏已结束' };
    }

    const result = bankTradeInternal(playerId, give, receive);

    return {
      ...result,
      game_state: deepClone(currentMockGameState)
    };
  },

  async endTurn(gameId, playerId) {
    await delay(300);

    const error = ensureGameReady() || ensureCurrentPlayer(playerId);
    if (error) return error;

    if (currentMockGameState.is_finished) {
      return { success: false, error: '游戏已结束' };
    }

    endTurnInternal(playerId);

    return {
      success: true,
      message: '回合结束',
      game_state: deepClone(currentMockGameState)
    };
  },

  async togglePlayerAI(gameId, playerId, isAI) {
    await delay(200);

    const error = ensureGameReady();
    if (error) return error;

    const player = findPlayer(playerId);
    if (!player) {
      return { success: false, error: '玩家不存在' };
    }

    player.is_ai = isAI;
    logAction(`${player.name} 已切换为${isAI ? 'AI' : '真人'}玩家`);

    return {
      success: true,
      game_state: deepClone(currentMockGameState),
      message: `${player.name} 已切换为${isAI ? 'AI' : '真人'}玩家`
    };
  },

  async executeAITurn(gameId, playerId, options = {}) {
    await delay(1000);

    const error = ensureGameReady() || ensureCurrentPlayer(playerId);
    if (error) return error;

    if (currentMockGameState.is_finished) {
      return { success: false, error: '游戏已结束' };
    }

    const player = findPlayer(playerId);
    if (!player) {
      return { success: false, error: 'AI 玩家不存在' };
    }

    const actions = [];

    // 1. 掷骰
    if (!currentMockGameState.has_rolled_dice) {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const total = d1 + d2;

      currentMockGameState.last_dice_roll = { dice1: d1, dice2: d2, total };
      currentMockGameState.has_rolled_dice = true;
      distributeResourcesByDice(total);

      actions.push({
        type: 'roll_dice',
        dice: `${d1} + ${d2} = ${total}`
      });

      logAction(`${player.name}(AI) 掷出了 ${d1}+${d2}=${total}`);
    }

    // 2. 优先升级城市
    const ownSettlement = currentMockGameState.vertex_buildings.find(
      b => b.player_id === playerId && b.type === 'settlement'
    );

    if (ownSettlement && canAfford(player, BUILD_COST.city) && player.cities_left > 0) {
      const result = buildInternal(playerId, 'city', ownSettlement.position, true);
      if (result.success) {
        actions.push({
          type: 'build',
          build_type: 'city',
          position: ownSettlement.position
        });
      }
    }

    // 3. 尝试建村庄
    if (canAfford(player, BUILD_COST.settlement) && player.settlements_left > 0) {
      const pos = getRandomEmptyVertex();
      if (pos) {
        const result = buildInternal(playerId, 'settlement', pos, true);
        if (result.success) {
          actions.push({
            type: 'build',
            build_type: 'settlement',
            position: pos
          });
        }
      }
    }

    // 4. 尝试建道路
    if (canAfford(player, BUILD_COST.road) && player.roads_left > 0) {
      const pos = getRandomEmptyEdge();
      if (pos) {
        const result = buildInternal(playerId, 'road', pos, true);
        if (result.success) {
          actions.push({
            type: 'build',
            build_type: 'road',
            position: pos
          });
        }
      }
    }

    // 5. 结束回合
    if (!currentMockGameState.is_finished) {
      endTurnInternal(playerId);
      actions.push({ type: 'end_turn' });
    }

    updateVictoryPoints();

    return {
      success: true,
      actions,
      game_state: deepClone(currentMockGameState),
      message: 'AI 回合执行完毕'
    };
  }
};