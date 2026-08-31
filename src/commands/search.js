const { SlashCommandBuilder } = require('discord.js');
const { braveApiKey } = require('../config');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('search')
      .setDescription('Search the web using Brave Search')
      .addStringOption(o => o.setName('query').setDescription('Search query').setRequired(true))
      .addIntegerOption(o => o.setName('count').setDescription('Number of results (1-10)').setMinValue(1).setMaxValue(10)),
    async execute(i) {
      if (!braveApiKey) return i.reply({ content: '❌ Brave API key not configured.', ephemeral: true });

      await i.deferReply();
      try {
        const count = i.options.getInteger('count') || 5;
        const query = i.options.getString('query', true);

        const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`, {
          headers: { 'Accept': 'application/json', 'X-Subscription-Token': braveApiKey },
        });

        if (!res.ok) throw new Error(`Brave error: ${res.status}`);
        const data = await res.json();
        const results = data.web?.results || [];

        if (!results.length) return i.editReply('❌ No results found.');

        const lines = results.map((r, idx) =>
          `**${idx + 1}.** [${r.title}](${r.url})\n${r.description?.slice(0, 120) || ''}`
        ).join('\n\n');

        return i.editReply({ content: `🔍 **Search: ${query}**\n\n${lines}` });
      } catch (e) {
        return i.editReply(`❌ Error: ${e.message}`);
      }
    },
  },
];
