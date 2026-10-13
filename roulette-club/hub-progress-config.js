window.HUB_PROGRESS = {
  game: 'roulette-club',
  keys: ['rouletteClubStats:v1', 'rouletteClubLeaderboard:v1', 'rouletteClubMusicMuted:v1', 'rouletteClubTutorialSeen'],
  score: function (keys) {
    var stats = JSON.parse(keys['rouletteClubStats:v1'] || '{}');
    var board = JSON.parse(keys['rouletteClubLeaderboard:v1'] || '{}');
    var score = Number(stats.totalScore) || 0;
    Object.values(board.players || {}).forEach(function (player) { score += Number(player.totalScore) || 0; });
    return (Number(stats.matchesCompleted) || 0) * 1e9 + score * 10
      + (keys.rouletteClubTutorialSeen === 'true' ? 1 : 0);
  }
};
