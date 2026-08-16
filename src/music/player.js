const { Player } = require('discord-player');
const { DefaultExtractors, SpotifyExtractor } = require('@discord-player/extractor');
const { spotifyClientId, spotifyClientSecret } = require('../config');

async function setupMusic(client) {
  const player = new Player(client);

  // Load every default extractor except Spotify, which is registered
  // separately so the supplied Spotify API credentials are used.
  await player.extractors.loadMulti(
    DefaultExtractors.filter((Extractor) => Extractor !== SpotifyExtractor),
  );

  await player.extractors.register(SpotifyExtractor, {
    clientId: spotifyClientId || null,
    clientSecret: spotifyClientSecret || null,
  });

  player.events.on('playerStart', (queue, track) => {
    const channel = queue.metadata?.channel;
    if (channel) channel.send(`🎵 Now playing **${track.cleanTitle}**`).catch(() => {});
  });

  player.events.on('error', (queue, error) => {
    console.error('Music player error:', error);
    queue.metadata?.channel?.send('❌ Music playback failed.').catch(() => {});
  });

  player.events.on('playerError', (queue, error) => {
    console.error('Music player error:', error);
    queue.metadata?.channel?.send('❌ This track could not be played.').catch(() => {});
  });

  client.player = player;
  return player;
}

module.exports = { setupMusic };
