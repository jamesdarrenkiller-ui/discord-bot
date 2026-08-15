const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function voiceChannel(interaction) {
  return interaction.member?.voice?.channel;
}

function sameChannel(interaction, queue) {
  const channel = voiceChannel(interaction);
  const connection = queue?.channel;
  return !connection || !channel || connection.id === channel.id;
}

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('play')
      .setDescription('Play or queue a song')
      .addStringOption(o => o.setName('query').setDescription('Song name or supported URL').setRequired(true)),
    async execute(interaction) {
      const channel = voiceChannel(interaction);
      if (!channel) return interaction.reply({ content: '❌ Join a voice channel first.', ephemeral: true });

      await interaction.deferReply();
      try {
        const { track } = await interaction.client.player.play(channel, interaction.options.getString('query', true), {
          nodeOptions: { metadata: { channel: interaction.channel } },
        });
        return interaction.editReply(`🎶 Queued **${track.cleanTitle}**`);
      } catch (error) {
        console.error(error);
        return interaction.editReply('❌ I could not find or play that track.');
      }
    },
  },
  {
    data: new SlashCommandBuilder().setName('skip').setDescription('Skip the current song'),
    async execute(interaction) {
      const queue = interaction.client.player.nodes.get(interaction.guildId);
      if (!queue?.isPlaying()) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });
      if (!sameChannel(interaction, queue)) return interaction.reply({ content: '❌ Join my voice channel first.', ephemeral: true });
      queue.node.skip();
      return interaction.reply('⏭️ Skipped.');
    },
  },
  {
    data: new SlashCommandBuilder().setName('pause').setDescription('Pause the music'),
    async execute(interaction) {
      const queue = interaction.client.player.nodes.get(interaction.guildId);
      if (!queue?.isPlaying()) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });
      if (!sameChannel(interaction, queue)) return interaction.reply({ content: '❌ Join my voice channel first.', ephemeral: true });
      queue.node.pause();
      return interaction.reply('⏸️ Paused.');
    },
  },
  {
    data: new SlashCommandBuilder().setName('resume').setDescription('Resume the music'),
    async execute(interaction) {
      const queue = interaction.client.player.nodes.get(interaction.guildId);
      if (!queue) return interaction.reply({ content: '❌ Nothing is queued.', ephemeral: true });
      if (!sameChannel(interaction, queue)) return interaction.reply({ content: '❌ Join my voice channel first.', ephemeral: true });
      queue.node.resume();
      return interaction.reply('▶️ Resumed.');
    },
  },
  {
    data: new SlashCommandBuilder().setName('stop').setDescription('Stop music and clear the queue'),
    async execute(interaction) {
      const queue = interaction.client.player.nodes.get(interaction.guildId);
      if (!queue) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });
      if (!sameChannel(interaction, queue)) return interaction.reply({ content: '❌ Join my voice channel first.', ephemeral: true });
      queue.delete();
      return interaction.reply('⏹️ Music stopped and queue cleared.');
    },
  },
  {
    data: new SlashCommandBuilder().setName('queue').setDescription('Show the current music queue'),
    async execute(interaction) {
      const queue = interaction.client.player.nodes.get(interaction.guildId);
      if (!queue?.currentTrack) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });
      const tracks = queue.tracks.toArray().slice(0, 10);
      const lines = tracks.length ? tracks.map((t, i) => `${i + 1}. **${t.cleanTitle}**`).join('\n') : 'No more songs queued.';
      const embed = new EmbedBuilder().setTitle('🎵 Music Queue').addFields(
        { name: 'Now Playing', value: `**${queue.currentTrack.cleanTitle}**` },
        { name: 'Up Next', value: lines },
      );
      return interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('volume')
      .setDescription('Set music volume')
      .addIntegerOption(o => o.setName('level').setDescription('1-100').setRequired(true).setMinValue(1).setMaxValue(100)),
    async execute(interaction) {
      const queue = interaction.client.player.nodes.get(interaction.guildId);
      if (!queue?.isPlaying()) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });
      if (!sameChannel(interaction, queue)) return interaction.reply({ content: '❌ Join my voice channel first.', ephemeral: true });
      const level = interaction.options.getInteger('level', true);
      queue.node.setVolume(level);
      return interaction.reply(`🔊 Volume set to **${level}%**.`);
    },
  },
  {
    data: new SlashCommandBuilder().setName('nowplaying').setDescription('Show the current song'),
    async execute(interaction) {
      const queue = interaction.client.player.nodes.get(interaction.guildId);
      if (!queue?.currentTrack) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });
      return interaction.reply(`🎵 Now playing **${queue.currentTrack.cleanTitle}**`);
    },
  },
];
