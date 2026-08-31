const { LavalinkManager, LoadType } = require('lavalink-client');
const { lavalinkNodes, spotifyClientId, spotifyClientSecret } = require('../config');
const { EmbedBuilder } = require('discord.js');

let manager;

function setupMusic(client) {
  manager = new LavalinkManager({
    nodes: lavalinkNodes
      .filter(n => n.url && n.password)
      .map(n => ({
        id: n.name,
        host: n.url,
        port: n.port,
        password: n.password,
        secure: n.secure || false,
        retryAmount: 5,
        retryDelay: 30000,
      })),
    sendGatewayPayload: (id, payload) => {
      const guild = client.guilds.cache.get(id);
      if (guild) guild.shard.send(payload);
    },
    client: {
      id: client.user.id,
      username: client.user.username,
    },
    playerOptions: {
      volume: 80,
      deaf: true,
    },
    nodeOptions: {
      maxAvgPenalty: 1000,
    },
  });

  // Handle incoming raw gateway events
  client.on('raw', (data) => manager.updateVoiceState(data));

  // Track start event
  manager.on('trackStart', async (player, track) => {
    const channel = player.guild?.channels?.cache?.get(player.textChannelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle('🎵 Now Playing')
      .setDescription(`**${track.info.title}**`)
      .addFields(
        { name: 'Duration', value: formatDuration(track.info.duration), inline: true },
        { name: 'Author', value: track.info.author || '?', inline: true },
        { name: 'Requested by', value: track.requester?.toString() || '?', inline: true },
      )
      .setColor(0x57F287);

    if (track.info.thumbnail) embed.setThumbnail(track.info.thumbnail);
    if (track.info.uri) embed.setURL(track.info.uri);

    await channel.send({ embeds: [embed] }).catch(() => {});
  });

  // Track end — auto-play next
  manager.on('trackEnd', async (player, track, payload) => {
    // Lavalink handles queue progression automatically
  });

  // Track error
  manager.on('trackError', async (player, track, error) => {
    console.error(`Music track error (${track.info.title}):`, error);
    const channel = player.guild?.channels?.cache?.get(player.textChannelId);
    if (channel) await channel.send(`❌ Error playing **${track.info.title}**: ${error.message || 'Unknown error'}`).catch(() => {});
  });

  // Node events
  manager.on('nodeConnect', (node) => {
    console.log(`🎵 Lavalink node connected: ${node.id}`);
  });

  manager.on('nodeDisconnect', (node, reason) => {
    console.log(`🎵 Lavalink node disconnected: ${node.id} — ${reason || 'unknown'}`);
  });

  manager.on('nodeError', (node, error) => {
    console.error(`🎵 Lavalink node error (${node.id}):`, error.message);
  });

  // Node ready
  manager.on('nodeReady', (node, stats) => {
    console.log(`🎵 Lavalink node ready: ${node.id} — ${stats.players} players, ${stats.uptime}ms uptime`);
  });

  client.player = manager;
  client.lavalinkManager = manager;
  return manager;
}

async function searchTracks(query, node) {
  const searchNode = node || manager.leastUsedNodes?.first();
  if (!searchNode) throw new Error('No Lavalink nodes available.');

  const result = await manager.search({ query, requester: null }, searchNode);

  switch (result.loadType) {
    case LoadType.TRACK_LOADED:
      return { tracks: [result.data], playlist: null };
    case LoadType.PLAYLIST_LOADED:
      return { tracks: result.data.tracks, playlist: { name: result.data.info.name, count: result.data.tracks.length } };
    case LoadType.SEARCH_RESULT:
      return { tracks: result.data.slice(0, 10), playlist: null };
    case LoadType.NO_MATCHES:
      return { tracks: [], playlist: null };
    case LoadType.LOAD_FAILED:
      throw new Error(`Failed to load: ${result.data?.message || 'Unknown error'}`);
    default:
      return { tracks: [], playlist: null };
  }
}

function formatDuration(ms) {
  if (!ms || ms <= 0) return '0:00';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

module.exports = { setupMusic, searchTracks, formatDuration, getManager: () => manager };
