const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

const categories = {
  moderation: { label: 'Moderation', emoji: '🛡️', description: 'Ban, kick, timeout, warnings and channel controls.', commands: ['ban','unban','softban','kick','timeout','untimeout','warn','warnings','unwarn','warnings-clear','clear','slowmode','nick','deafen','undeafen','voicekick','modlogs','lock','unlock'] },
  security: { label: 'Security', emoji: '🚨', description: 'AutoMod, anti-raid and anti-nuke protection.', commands: ['automod','antispam','antilink','anticaps','antiraid','antinuke','extraowner','mod'] },
  music: { label: 'Music', emoji: '🎵', description: 'Playback, queue controls, filters and sound modes.', commands: ['play','skip','pause','resume','stop','queue','nowplaying','volume','loop','shuffle','mode','modes'] },
  economy: { label: 'Economy', emoji: '💰', description: 'Coins, rewards, work and server leaderboard.', commands: ['balance','daily','weekly','work','beg','pay','leaderboard'] },
  fun: { label: 'Fun', emoji: '🎮', description: 'Lightweight games and fun commands.', commands: ['8ball','coinflip','dice','rps'] },
  tickets: { label: 'Tickets', emoji: '🎫', description: 'Create and manage support tickets.', commands: ['ticket'] },
  utility: { label: 'Utility', emoji: '🔧', description: 'Server, user and bot information.', commands: ['ping','serverinfo','userinfo','avatar','botinfo','uptime','prefix'] },
  ai: { label: 'AI', emoji: '🤖', description: 'AI-powered chat and assistance.', commands: ['ai'] },
  owner: { label: 'Owner', emoji: '👑', description: 'Bot-owner and server-owner controls.', commands: ['noprefix','extraowner','mod'] },
};

function buildEmbed(categoryKey) {
  const c = categories[categoryKey];
  return new EmbedBuilder().setTitle(`${c.emoji} ${c.label} Commands`).setDescription(`${c.description}\n\n${c.commands.map(x => `**?${x}**`).join('  •  ')}`).setFooter({ text: 'Use the dropdown below to switch categories.' }).setTimestamp();
}

function menu() {
  return new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('help-category').setPlaceholder('📚 Select a command category').addOptions(Object.entries(categories).map(([value,c]) => ({ label:c.label, description:c.description.slice(0,100), value, emoji:c.emoji }))));
}

const command = {
  data: new SlashCommandBuilder().setName('help').setDescription('Open the interactive command help menu'),
  async execute(interaction) {
    const message = await interaction.reply({ embeds: [buildEmbed('moderation')], components: [menu()], fetchReply: true });
    const collector = message.createMessageComponentCollector({ filter: i => i.user.id === interaction.user.id, time: 120000 });
    collector.on('collect', async i => { await i.update({ embeds: [buildEmbed(i.values[0])], components: [menu()] }); });
    collector.on('end', async () => { await message.edit({ components: [] }).catch(() => {}); });
  },
};

module.exports = [command];
