/**
 * API服务
 */

const API_BASE_URL = 'http://localhost:5000/api';


export const api = {
  /**
   * 创建新游戏
   */
  async createGame(playerCount = 4, players = [], mapType = 'standard') {
    const response = await fetch(`${API_BASE_URL}/game/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        player_count: playerCount,
        players,
        map_type: mapType
      })
    });
    return response.json();
  },

  /**
   * 获取游戏状态
   */
  async getGame(gameId) {
    const response = await fetch(`${API_BASE_URL}/game/${gameId}`);
    return response.json();
  },

  /**
   * 掷骰子
   */
  async rollDice(gameId, playerId) {
    const response = await fetch(`${API_BASE_URL}/game/${gameId}/roll_dice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ player_id: playerId })
    });
    return response.json();
  },

  /**
   * 建造建筑
   */
  async build(gameId, playerId, buildingType, position) {
    const response = await fetch(`${API_BASE_URL}/game/${gameId}/build`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        player_id: playerId,
        building_type: buildingType,
        position
      })
    });
    return response.json();
  },

  /**
   * 与银行交易
   */
  async tradeWithBank(gameId, playerId, give, receive) {
    const response = await fetch(`${API_BASE_URL}/game/${gameId}/trade/bank`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        player_id: playerId,
        give,
        receive
      })
    });
    return response.json();
  },

  /**
   * 玩家之间交易
   */
  async tradeWithPlayer(gameId, player1Id, player2Id, player1Give, player1Receive) {
    const response = await fetch(`${API_BASE_URL}/game/${gameId}/trade/player`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        player1_id: player1Id,
        player2_id: player2Id,
        player1_give: player1Give,
        player1_receive: player1Receive
      })
    });
    return response.json();
  },

  /**
   * 移动强盗
   */
  async moveRobber(gameId, playerId, q, r, stealFromPlayerId) {
    const response = await fetch(`${API_BASE_URL}/game/${gameId}/robber/move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        player_id: playerId,
        q,
        r,
        steal_from_player_id: stealFromPlayerId
      })
    });
    return response.json();
  },

  /**
   * 结束回合
   */
  async endTurn(gameId, playerId) {
    const response = await fetch(`${API_BASE_URL}/game/${gameId}/end_turn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ player_id: playerId })
    });
    return response.json();
  },

  /**
   * 获取游戏日志
   */
  async getLogs(gameId) {
    const response = await fetch(`${API_BASE_URL}/game/${gameId}/logs`);
    return response.json();
  },

  /**
   * 切换玩家类型（真人/AI）
   */
  async togglePlayerAI(gameId, playerId, isAI) {
    const response = await fetch(`${API_BASE_URL}/game/${gameId}/player/${playerId}/toggle_ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_ai: isAI })
    });
    return response.json();
  },

   /**
   * 执行AI玩家的回合
   */

  async executeAITurn(gameId, playerId) {
  const response = await fetch(`${API_BASE_URL}/game/${gameId}/player/${playerId}/ai_turn`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      strategy_type: 'smart'  // 或 'basic', 'random'
    })
  });
  return response.json();
}

};


