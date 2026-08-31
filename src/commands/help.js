const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

const categories = {
  moderation: { label: 'Moderation', emoji: '🛡️', description: 'Ban, kick, timeout, warnings and channel controls.', commands: ['ban','unban','softban','kick','timeout','untimeout','warn','warnings','unwarn','warnings-clear','clear','slowmode','nick','deafen','undeafen','voicekick','modlogs','lock','unlock'] },
  security: { label: 'Security', emoji: '🚨', description: 'AutoMod, anti-raid and anti-nuke protection.', commands: ['automod','antilink','anticaps','antiraid','antinuke','extraowner','mod'] },
  music: { label: 'Music', emoji: '🎵', description: 'Playback, queue controls, filters and Lavalink nodes.', commands: ['play','skip','pause','resume','stop','queue','nowplaying','volume','loop','shuffle','node'] },
  economy: { label: 'Economy', emoji: '💰', description: 'Coins, rewards, work and server leaderboard.', commands: ['balance','daily','weekly','work','beg','pay','leaderboard'] },
  fun: { label: 'Fun', emoji: '🎮', description: 'Lightweight games and fun commands.', commands: ['8ball','coinflip','dice','rps'] },
  tickets: { label: 'Tickets', emoji: '🎫', description: 'Create and manage support tickets.', commands: ['ticket','ticket-close'] },
  utility: { label: 'Utility', emoji: '🔧', description: 'Server, user and bot information.', commands: ['ping','serverinfo','userinfo','avatar','botinfo','uptime','prefix','afk','say'] },
  ai: { label: 'AI', emoji: '🤖', description: 'AI-powered chat via Groq and OpenAI.', commands: ['ai'] },
  movies: { label: 'Movies & TV', emoji: '🎬', description: 'Search movies and shows via TMDB.', commands: ['movie','movies','tv','movie-details'] },
  social: { label: 'Social', emoji: '🐦', description: 'Twitter tweets and web search.', commands: ['tweet','search-tweets','search'] },
  youtube: { label: 'YouTube', emoji: '▶️', description: 'YouTube video search and details.', commands: ['youtube','video'] },
  reactions: { label: 'Roles & Tags', emoji: '🎭', description: 'Reaction roles, tags, sticky messages, temp roles.', commands: ['reactionrole','tag','tags','sticky','unsticky','temprole'] },
  logging: { label: 'Logging', emoji: '📋', description: 'Advanced message and activity logging.', commands: ['setlog','log-edits','log-deletes','log-voice','log-roles'] },
  giveaways: { label: 'Giveaways', emoji: '🎉', description: 'Create and manage giveaways.', commands: ['giveaway','giveaway-end','giveaway-reroll'] },
  owner: { label: 'Owner', emoji: '👑', description: 'Bot-owner and server-owner controls.', commands: ['noprefix','extraowner','mod','setwelcome','setgoodbye','autorole'] },
};

function buildEmbed(categoryKey) {
  const c = categories[categoryKey];
  return new EmbedBuilder()
    .setTitle(`${c.emoji} ${c.label} Commands`)
    .setDescription(`${c.description}\n\n${c.commands.map(x => `**/${x}**`).join('  •  ')}`)
    .setFooter({ text: 'Use the dropdown below to switch categories.' })
    .setTimestamp();
}

function menu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('help-category')
      .setPlaceholder('📚 Select a command category')
      .addOptions(Object.entries(categories).map(([value, c]) => ({
        label: c.label,
        description: c.description.slice(0, 100),
        value,
        emoji: c.emoji,
      })))
  );
}

const command = {
  data: new SlashCommandBuilder().setName('help').setDescription('Open the interactive command help menu'),
  async execute(interaction) {
    const message = await interaction.reply({
      embeds: [buildEmbed('moderation')],
      components: [menu()],
      fetchReply: true,
    });
    const collector = message.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 120000,
    });
    collector.on('collect', async i => {
      await i.update({ embeds: [buildEmbed(i.values[0])], components: [menu()] });
    });
    collector.on('end', async () => {
      await message.edit({ components: [] }).catch(() => {});
    });
  },
};

module.exports = [command];
