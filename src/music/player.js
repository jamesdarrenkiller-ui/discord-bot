const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');

async function setupMusic(client) {
  const player = new Player(client);
  await player.extractors.loadMulti(DefaultExtractors);

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
