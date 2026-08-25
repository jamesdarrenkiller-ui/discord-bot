const MODES = {
  off: { bassboost: 0, tremolo: 0, vibrato: 0, rotation: 0, nightcore: 0, eightD: 0, karaoke: 0 },
  jazz: { bassboost: 2, tremolo: 0.08, vibrato: 0.03, rotation: 0.02, nightcore: 0, eightD: 0, karaoke: 0 },
  rock: { bassboost: 6, tremolo: 0.03, vibrato: 0.02, rotation: 0, nightcore: 0, eightD: 0, karaoke: 0 },
  pop: { bassboost: 3, tremolo: 0.02, vibrato: 0, rotation: 0, nightcore: 0, eightD: 0, karaoke: 0 },
  classical: { bassboost: 0, tremolo: 0, vibrato: 0, rotation: 0, nightcore: 0, eightD: 0, karaoke: 0 },
  bass: { bassboost: 12, tremolo: 0, vibrato: 0, rotation: 0, nightcore: 0, eightD: 0, karaoke: 0 },
  nightcore: { bassboost: 2, tremolo: 0, vibrato: 0, rotation: 0, nightcore: 1, eightD: 0, karaoke: 0 },
  '8d': { bassboost: 0, tremolo: 0, vibrato: 0, rotation: 0.08, nightcore: 0, eightD: 1, karaoke: 0 },
  karaoke: { bassboost: 0, tremolo: 0, vibrato: 0, rotation: 0, nightcore: 0, eightD: 0, karaoke: 1 },
};

function availableModes() { return Object.keys(MODES); }

function applyMode(queue, mode) {
  const config = MODES[mode];
  if (!config) throw new Error(`Unknown music mode: ${mode}`);
  const filters = queue.filters;
  if (filters.ffmpeg) {
    filters.ffmpeg.setFilters({
      bassboost: config.bassboost,
      tremolo: config.tremolo,
      vibrato: config.vibrato,
      rotation: config.rotation,
      nightcore: config.nightcore,
      '8D': config.eightD,
      karaoke: config.karaoke,
    });
  }
  return config;
}

module.exports = { MODES, availableModes, applyMode };
