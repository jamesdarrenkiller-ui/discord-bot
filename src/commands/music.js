const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { searchTracks, formatDuration, getManager } = require('../music/player');

function getOrCreatePlayer(manager, guildId, voiceChannelId, textChannelId) {
  return manager.createPlayer({
    guildId,
    voiceChannelId,
    textChannelId,
    nodeOptions: { selfDeaf: true, volume: 80 },
  });
}

function voiceChannel(i) { return i.member?.voice?.channel; }

module.exports = [
  {
    data: new SlashCommandBuilder().setName('play').setDescription('Play or queue a song')
      .addStringOption(o => o.setName('query').setDescription('Song, artist, playlist or URL').setRequired(true)),
    async execute(i) {
      const vc = voiceChannel(i);
      if (!vc) return i.reply({ content: '❌ Join a voice channel first.', ephemeral: true });

      const m = getManager();
      if (!m) return i.reply({ content: '❌ Music system not ready.', ephemeral: true });

      await i.deferReply();
      try {
        const { tracks, playlist } = await searchTracks(i.options.getString('query', true));
        if (!tracks.length) return i.editReply('❌ No results found.');

        const player = getOrCreatePlayer(m, i.guild.id, vc.id, i.channel.id);
        await player.connect();

        if (playlist) {
          player.queue.add(tracks.map(t => ({ ...t, requester: i.user })));
          if (!player.isPlaying()) await player.play();
          return i.editReply(`🎶 Queued playlist **${playlist.name}** (${playlist.count} tracks)`);
        }

        player.queue.add({ ...tracks[0], requester: i.user });
        if (!player.isPlaying()) await player.play();
        return i.editReply(`🎶 Queued **${tracks[0].info.title}**`);
      } catch (e) {
        console.error('Play error:', e);
        return i.editReply(`❌ Could not play: ${e.message}`);
      }
    },
  },
  {
    data: new SlashCommandBuilder().setName('skip').setDescription('Skip the current song'),
    async execute(i) {
      const m = getManager(); if (!m) return i.reply({ content: '❌ Music not ready.', ephemeral: true });
      const p = m.players.get(i.guild.id);
      if (!p?.queue?.current) return i.reply({ content: '❌ Nothing playing.', ephemeral: true });
      await p.skip();
      return i.reply('⏭️ Skipped.');
    },
  },
  {
    data: new SlashCommandBuilder().setName('pause').setDescription('Pause music'),
    async execute(i) {
      const m = getManager(); if (!m) return i.reply({ content: '❌ Music not ready.', ephemeral: true });
      const p = m.players.get(i.guild.id);
      if (!p?.queue?.current) return i.reply({ content: '❌ Nothing playing.', ephemeral: true });
      await p.pause(true);
      return i.reply('⏸️ Paused.');
    },
  },
  {
    data: new SlashCommandBuilder().setName('resume').setDescription('Resume music'),
    async execute(i) {
      const m = getManager(); if (!m) return i.reply({ content: '❌ Music not ready.', ephemeral: true });
      const p = m.players.get(i.guild.id);
      if (!p) return i.reply({ content: '❌ Nothing queued.', ephemeral: true });
      await p.pause(false);
      return i.reply('▶️ Resumed.');
    },
  },
  {
    data: new SlashCommandBuilder().setName('stop').setDescription('Stop music and clear queue'),
    async execute(i) {
      const m = getManager(); if (!m) return i.reply({ content: '❌ Music not ready.', ephemeral: true });
      const p = m.players.get(i.guild.id);
      if (!p) return i.reply({ content: '❌ Nothing playing.', ephemeral: true });
      p.queue.clear();
      await p.stop();
      return i.reply('⏹️ Stopped and queue cleared.');
    },
  },
  {
    data: new SlashCommandBuilder().setName('queue').setDescription('Show current queue'),
    async execute(i) {
      const m = getManager(); if (!m) return i.reply({ content: '❌ Music not ready.', ephemeral: true });
      const p = m.players.get(i.guild.id);
      if (!p?.queue?.current) return i.reply({ content: '❌ Nothing playing.', ephemeral: true });

      const current = p.queue.current;
      const upcoming = p.queue.tracks.toArray().slice(0, 10);
      const lines = upcoming.length
        ? upcoming.map((t, n) => `${n + 1}. **${t.info.title}** — ${formatDuration(t.info.duration)}`).join('\n')
        : 'No more songs queued.';

      const embed = new EmbedBuilder()
        .setTitle('🎵 Music Queue')
        .addFields(
          { name: 'Now Playing', value: `**${current.info.title}** — ${formatDuration(current.info.duration)}` },
          { name: 'Up Next', value: lines },
        )
        .setFooter({ text: `${p.queue.tracks.size} track(s) total` });

      return i.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder().setName('volume').setDescription('Set volume')
      .addIntegerOption(o => o.setName('level').setDescription('1-100').setRequired(true).setMinValue(1).setMaxValue(100)),
    async execute(i) {
      const m = getManager(); if (!m) return i.reply({ content: '❌ Music not ready.', ephemeral: true });
      const p = m.players.get(i.guild.id);
      if (!p) return i.reply({ content: '❌ Nothing playing.', ephemeral: true });
      const vol = i.options.getInteger('level', true);
      await p.setVolume(vol);
      return i.reply(`🔊 Volume set to **${vol}%**.`);
    },
  },
  {
    data: new SlashCommandBuilder().setName('loop').setDescription('Set loop mode')
      .addStringOption(o => o.setName('mode').setDescription('Loop mode').setRequired(true)
        .addChoices({ name: 'Off', value: 'off' }, { name: 'Track', value: 'track' }, { name: 'Queue', value: 'queue' })),
    async execute(i) {
      const m = getManager(); if (!m) return i.reply({ content: '❌ Music not ready.', ephemeral: true });
      const p = m.players.get(i.guild.id);
      if (!p?.queue?.current) return i.reply({ content: '❌ Nothing playing.', ephemeral: true });
      const mode = i.options.getString('mode', true);
      p.setLoop(mode === 'off' ? 0 : mode === 'track' ? 1 : 2);
      return i.reply(`🔁 Loop: **${mode.charAt(0).toUpperCase() + mode.slice(1)}**.`);
    },
  },
  {
    data: new SlashCommandBuilder().setName('shuffle').setDescription('Shuffle queue'),
    async execute(i) {
      const m = getManager(); if (!m) return i.reply({ content: '❌ Music not ready.', ephemeral: true });
      const p = m.players.get(i.guild.id);
      if (!p?.queue?.current) return i.reply({ content: '❌ Nothing playing.', ephemeral: true });
      if (p.queue.tracks.size < 2) return i.reply({ content: '❌ Need at least 2 tracks.', ephemeral: true });
      p.queue.shuffle();
      return i.reply(`🔀 Shuffled **${p.queue.tracks.size}** tracks.`);
    },
  },
  {
    data: new SlashCommandBuilder().setName('nowplaying').setDescription('Show current song'),
    async execute(i) {
      const m = getManager(); if (!m) return i.reply({ content: '❌ Music not ready.', ephemeral: true });
      const p = m.players.get(i.guild.id);
      if (!p?.queue?.current) return i.reply({ content: '❌ Nothing playing.', ephemeral: true });
      const t = p.queue.current;
      const embed = new EmbedBuilder()
        .setTitle('🎵 Now Playing')
        .setDescription(`**${t.info.title}**`)
        .addFields(
          { name: 'Duration', value: formatDuration(t.info.duration), inline: true },
          { name: 'Author', value: t.info.author || '?', inline: true },
        )
        .setColor(0x57F287);
      if (t.info.thumbnail) embed.setThumbnail(t.info.thumbnail);
      if (t.info.uri) embed.setURL(t.info.uri);
      return i.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder().setName('node').setDescription('Show Lavalink node status'),
    async execute(i) {
      const m = getManager(); if (!m) return i.reply({ content: '❌ Music not ready.', ephemeral: true });
      const nodes = m.nodeManager.nodes;
      if (!nodes.size) return i.reply('❌ No Lavalink nodes connected.');

      const lines = nodes.map(n => {
        const status = n.connected ? '✅' : '❌';
        return `${status} **${n.id}** — ${n.stats?.players || 0} players, uptime ${Math.floor((n.stats?.uptime || 0) / 1000)}s`;
      }).join('\n');

      return i.reply({ embeds: [new EmbedBuilder().setTitle('🎵 Lavalink Nodes').setDescription(lines)] });
    },
  },
];
