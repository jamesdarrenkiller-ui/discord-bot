const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { searchMovies, searchTv, getMovieDetails } = require('../services/tmdb');
const { tmdbApiKey } = require('../config');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('movie')
      .setDescription('Search for a movie on TMDB')
      .addStringOption(o => o.setName('query').setDescription('Movie title').setRequired(true)),
    async execute(i) {
      if (!tmdbApiKey) return i.reply({ content: '❌ TMDB API key not configured.', ephemeral: true });
      await i.deferReply();
      try {
        const results = await searchMovies(i.options.getString('query', true));
        if (!results.length) return i.editReply('❌ No movies found.');

        const m = results[0];
        const embed = new EmbedBuilder()
          .setTitle(`🎬 ${m.title} (${m.year})`)
          .setDescription(m.overview)
          .addFields(
            { name: 'Rating', value: `⭐ ${m.rating}/10`, inline: true },
            { name: 'Year', value: m.year, inline: true },
          )
          .setURL(m.url)
          .setColor(0xFEE75C);
        if (m.poster) embed.setThumbnail(m.poster);

        return i.editReply({ embeds: [embed] });
      } catch (e) {
        return i.editReply(`❌ Error: ${e.message}`);
      }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('movies')
      .setDescription('Search for movies on TMDB')
      .addStringOption(o => o.setName('query').setDescription('Movie title').setRequired(true)),
    async execute(i) {
      if (!tmdbApiKey) return i.reply({ content: '❌ TMDB API key not configured.', ephemeral: true });
      await i.deferReply();
      try {
        const results = await searchMovies(i.options.getString('query', true));
        if (!results.length) return i.editReply('❌ No movies found.');

        const lines = results.map((m, idx) =>
          `**${idx + 1}.** 🎬 **${m.title}** (${m.year}) — ⭐ ${m.rating}\n${m.overview.slice(0, 100)}...`
        ).join('\n\n');

        return i.editReply({ embeds: [new EmbedBuilder().setTitle('🎬 Movie Search Results').setDescription(lines).setColor(0xFEE75C)] });
      } catch (e) {
        return i.editReply(`❌ Error: ${e.message}`);
      }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('tv')
      .setDescription('Search for a TV show on TMDB')
      .addStringOption(o => o.setName('query').setDescription('Show title').setRequired(true)),
    async execute(i) {
      if (!tmdbApiKey) return i.reply({ content: '❌ TMDB API key not configured.', ephemeral: true });
      await i.deferReply();
      try {
        const results = await searchTv(i.options.getString('query', true));
        if (!results.length) return i.editReply('❌ No shows found.');

        const lines = results.map((m, idx) =>
          `**${idx + 1}.** 📺 **${m.title}** (${m.year}) — ⭐ ${m.rating}\n${m.overview.slice(0, 100)}...`
        ).join('\n\n');

        return i.editReply({ embeds: [new EmbedBuilder().setTitle('📺 TV Show Search Results').setDescription(lines).setColor(0x5865F2)] });
      } catch (e) {
        return i.editReply(`❌ Error: ${e.message}`);
      }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('movie-details')
      .setDescription('Get detailed info about a movie')
      .addStringOption(o => o.setName('query').setDescription('Movie title').setRequired(true)),
    async execute(i) {
      if (!tmdbApiKey) return i.reply({ content: '❌ TMDB API key not configured.', ephemeral: true });
      await i.deferReply();
      try {
        const results = await searchMovies(i.options.getString('query', true));
        if (!results.length) return i.editReply('❌ No movies found.');

        const details = await getMovieDetails(results[0].id);
        const embed = new EmbedBuilder()
          .setTitle(`🎬 ${details.title} (${details.year})`)
          .setDescription(details.overview.slice(0, 800))
          .addFields(
            { name: 'Rating', value: `⭐ ${details.rating}/10`, inline: true },
            { name: 'Runtime', value: details.runtime, inline: true },
            { name: 'Genres', value: details.genres, inline: true },
          )
          .setURL(details.url)
          .setColor(0xFEE75C);
        if (details.poster) embed.setThumbnail(details.poster);
        if (details.trailer) embed.addFields({ name: '🎬 Trailer', value: `[Watch](${details.trailer})`, inline: true });

        return i.editReply({ embeds: [embed] });
      } catch (e) {
        return i.editReply(`❌ Error: ${e.message}`);
      }
    },
  },
];
