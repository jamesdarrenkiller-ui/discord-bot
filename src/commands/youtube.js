const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { search, getVideoDetails } = require('../services/youtube');
const { youtubeApiKey } = require('../config');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('youtube')
      .setDescription('Search YouTube videos')
      .addStringOption(o => o.setName('query').setDescription('Search query').setRequired(true))
      .addIntegerOption(o => o.setName('count').setDescription('Number of results (1-10)').setMinValue(1).setMaxValue(10)),
    async execute(i) {
      if (!youtubeApiKey) return i.reply({ content: '❌ YouTube API key not configured.', ephemeral: true });

      await i.deferReply();
      try {
        const count = i.options.getInteger('count') || 5;
        const results = await search(i.options.getString('query', true), count);
        if (!results.length) return i.editReply('❌ No videos found.');

        const lines = results.map((v, idx) =>
          `**${idx + 1}.** [${v.title}](${v.url})\n📺 ${v.channel}`
        ).join('\n\n');

        return i.editReply({ embeds: [new EmbedBuilder().setTitle('🔍 YouTube Search').setDescription(lines).setColor(0xFF0000)] });
      } catch (e) {
        return i.editReply(`❌ Error: ${e.message}`);
      }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('video')
      .setDescription('Get details about a YouTube video')
      .addStringOption(o => o.setName('url').setDescription('YouTube video URL or ID').setRequired(true)),
    async execute(i) {
      if (!youtubeApiKey) return i.reply({ content: '❌ YouTube API key not configured.', ephemeral: true });

      await i.deferReply();
      try {
        const raw = i.options.getString('url', true);
        // Extract video ID from URL or use as-is
        const match = raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
        const videoId = match ? match[1] : raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 11);

        if (!videoId || videoId.length !== 11) return i.editReply('❌ Invalid YouTube URL or ID.');

        const details = await getVideoDetails(videoId);
        if (!details) return i.editReply('❌ Video not found.');

        const embed = new EmbedBuilder()
          .setTitle(details.title)
          .setDescription(details.description.slice(0, 400))
          .addFields(
            { name: 'Channel', value: details.channel, inline: true },
            { name: 'Views', value: details.views.toLocaleString(), inline: true },
            { name: 'Likes', value: details.likes.toLocaleString(), inline: true },
            { name: 'Duration', value: details.duration, inline: true },
          )
          .setURL(details.url)
          .setColor(0xFF0000);
        if (details.thumbnail) embed.setThumbnail(details.thumbnail);

        return i.editReply({ embeds: [embed] });
      } catch (e) {
        return i.editReply(`❌ Error: ${e.message}`);
      }
    },
  },
];
