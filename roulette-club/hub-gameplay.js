(function () {
  'use strict';
  var disabled = new URLSearchParams(window.location.search).has('qa');
  var events = window.HubGameEvents.create('roulette-club', { disabled: disabled });
  window.RouletteHub = {
    track: function (state, playerId, online, abandoned) {
      if (!state || !state.matchId || !state.players.some(function (player) { return player.id === playerId; })) return;
      var abandonedMatches = events.get('abandonedMatches', []);
      if (!Array.isArray(abandonedMatches)) abandonedMatches = [];
      if (abandoned && !abandonedMatches.includes(state.matchId)) {
        abandonedMatches.push(state.matchId);
        events.set('abandonedMatches', abandonedMatches.slice(-128));
        if (online) { events.set('onlineStreak', 0); events.set('activeOnlineMatch', null); }
      }
      abandoned = abandonedMatches.includes(state.matchId);
      if (online && !state.completedAt && !abandoned) {
        var activeMatch = events.get('activeOnlineMatch', null);
        if (activeMatch && activeMatch !== state.matchId) events.set('onlineStreak', 0);
        if (activeMatch !== state.matchId) events.set('activeOnlineMatch', state.matchId);
      }
      var shot = state.lastEvent;
      if (shot && shot.type === 'shot' && shot.actorId === playerId && shot.selfShot && shot.shell === 'blank') events.achievement('blank_self');
      // A departing player must not close party voice for the remaining table.
      if (!state.completedAt) return;
      var won = !abandoned && state.winnerId === playerId;
      var result = { won: won, mode: online ? 'online' : 'solo', abandoned: !!abandoned };
      if (!abandoned && !state.winnerId) result.draw = true;
      if (!events.runEnd(state.matchId, result)) return;
      if (won) {
        events.achievement('table_survivor');
        if (state.playerCount === 4 && state.weaponSkin === 'shotgun') events.achievement('full_chaos');
      }
      if (online) {
        events.set('activeOnlineMatch', null);
        if (!abandoned) events.achievement('club_table');
        var streak = won ? Number(events.get('onlineStreak', 0)) + 1 : 0;
        events.set('onlineStreak', streak);
        if (streak >= 5) events.achievement('five_online_wins');
      }
    }
  };
})();
