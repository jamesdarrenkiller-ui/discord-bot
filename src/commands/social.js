const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { postTweet, searchTweets } = require('../services/twitter');
const { requirePermission } = require('../utils/permissions');
const { twitterApiKey } = require('../config');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('tweet')
      .setDescription('Post a tweet from the bot account')
      .addStringOption(o => o.setName('content').setDescription('Tweet text (max 280 chars)').setRequired(true)),
    async execute(i) {
      if (!twitterApiKey) return i.reply({ content: '❌ Twitter API not configured.', ephemeral: true });
      if (!await requirePermission(i, PermissionsBitField.Flags.ManageGuild, 'Manage Server')) return;

      const content = i.options.getString('content', true);
      if (content.length > 280) return i.reply({ content: '❌ Tweet too long (max 280 chars).', ephemeral: true });

      await i.deferReply();
      try {
        const tweet = await postTweet(content);
        return i.editReply(`✅ Tweet posted! ${tweet.url}`);
      } catch (e) {
        return i.editReply(`❌ Failed to tweet: ${e.message}`);
      }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('search-tweets')
      .setDescription('Search recent tweets')
      .addStringOption(o => o.setName('query').setDescription('Search query').setRequired(true))
      .addIntegerOption(o => o.setName('count').setDescription('Number of results (1-10)').setMinValue(1).setMaxValue(10)),
    async execute(i) {
      if (!twitterApiKey) return i.reply({ content: '❌ Twitter API not configured.', ephemeral: true });

      await i.deferReply();
      try {
        const count = i.options.getInteger('count') || 5;
        const results = await searchTweets(i.options.getString('query', true), count);
        if (!results.length) return i.editReply('❌ No tweets found.');

        const lines = results.map((t, idx) =>
          `**${idx + 1}.** ${t.text.slice(0, 150)}\n❤️ ${t.likes} 🔁 ${t.retweets} — [View](${t.url})`
        ).join('\n\n');

        return i.editReply({ content: `🐦 **Search Results**\n\n${lines}` });
      } catch (e) {
        return i.editReply(`❌ Error: ${e.message}`);
      }
    },
  },
];
