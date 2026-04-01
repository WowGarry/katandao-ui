const API_BASE_URL = "http://localhost:5000/api";

const jsonRequest = async (url, options = {}) => {
  const response = await fetch(url, options);
  return response.json();
};

export const api = {
  async createGame(playerCount = 4, players = [], mapType = "standard") {
    return jsonRequest(`${API_BASE_URL}/game/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        player_count: playerCount,
        players,
        map_type: mapType,
      }),
    });
  },

  async getGame(gameId) {
    return jsonRequest(`${API_BASE_URL}/game/${gameId}`);
  },

  async rollDice(gameId, playerId) {
    return jsonRequest(`${API_BASE_URL}/game/${gameId}/roll_dice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player_id: playerId }),
    });
  },

  async build(gameId, playerId, buildingType, position) {
    return jsonRequest(`${API_BASE_URL}/game/${gameId}/build`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        player_id: playerId,
        building_type: buildingType,
        position,
      }),
    });
  },

  async tradeWithBank(gameId, playerId, give, receive) {
    return jsonRequest(`${API_BASE_URL}/game/${gameId}/trade/bank`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        player_id: playerId,
        give,
        receive,
      }),
    });
  },

  async tradeWithPlayer(gameId, player1Id, player2Id, player1Give, player1Receive) {
    return jsonRequest(`${API_BASE_URL}/game/${gameId}/trade/player`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        player1_id: player1Id,
        player2_id: player2Id,
        player1_give: player1Give,
        player1_receive: player1Receive,
      }),
    });
  },

  async moveRobber(gameId, playerId, q, r, stealFromPlayerId) {
    return jsonRequest(`${API_BASE_URL}/game/${gameId}/robber/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        player_id: playerId,
        q,
        r,
        steal_from_player_id: stealFromPlayerId,
      }),
    });
  },

  async endTurn(gameId, playerId) {
    return jsonRequest(`${API_BASE_URL}/game/${gameId}/end_turn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player_id: playerId }),
    });
  },

  async getLogs(gameId) {
    return jsonRequest(`${API_BASE_URL}/game/${gameId}/logs`);
  },

  async getGuideHint(gameId, playerId) {
    return jsonRequest(`${API_BASE_URL}/game/${gameId}/player/${playerId}/guide_hint`);
  },

  async togglePlayerAI(gameId, playerId, isAI) {
    return jsonRequest(`${API_BASE_URL}/game/${gameId}/player/${playerId}/toggle_ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_ai: isAI }),
    });
  },

  async executeAITurn(gameId, playerId, options = {}) {
    return jsonRequest(`${API_BASE_URL}/game/${gameId}/player/${playerId}/ai_turn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        strategy_type: options.strategy_type || "smart",
      }),
    });
  },
};
