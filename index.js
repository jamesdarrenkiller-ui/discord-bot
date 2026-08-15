require('dotenv').config();
const { Client, GatewayIntentBits, PermissionsBitField, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Check bot latency'),
  new SlashCommandBuilder().setName('serverinfo').setDescription('Show server information'),
  new SlashCommandBuilder().setName('userinfo').setDescription('Show information about a user').addUserOption(o => o.setName('user').setDescription('User to inspect').setRequired(false)),
  new SlashCommandBuilder().setName('avatar').setDescription('Show a user avatar').addUserOption(o => o.setName('user').setDescription('User').setRequired(false)),
  new SlashCommandBuilder().setName('say').setDescription('Make the bot say something').addStringOption(o => o.setName('message').setDescription('Message').setRequired(true)),
  new SlashCommandBuilder().setName('kick').setDescription('Kick a member').addUserOption(o => o.setName('user').setDescription('Member').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false)),
  new SlashCommandBuilder().setName('ban').setDescription('Ban a member').addUserOption(o => o.setName('user').setDescription('Member').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false)),
  new SlashCommandBuilder().setName('timeout').setDescription('Timeout a member').addUserOption(o => o.setName('user').setDescription('Member').setRequired(true)).addIntegerOption(o => o.setName('minutes').setDescription('Minutes').setRequired(true).setMinValue(1).setMaxValue(40320)),
  new SlashCommandBuilder().setName('clear').setDescription('Delete messages').addIntegerOption(o => o.setName('amount').setDescription('1-100 messages').setRequired(true).setMinValue(1).setMaxValue(100)),
  new SlashCommandBuilder().setName('lock').setDescription('Lock the current channel'),
  new SlashCommandBuilder().setName('unlock').setDescription('Unlock the current channel'),
  new SlashCommandBuilder().setName('8ball').setDescription('Ask the magic 8-ball').addStringOption(o => o.setName('question').setDescription('Question').setRequired(true)),
  new SlashCommandBuilder().setName('roll').setDescription('Roll a dice').addIntegerOption(o => o.setName('sides').setDescription('Number of sides').setRequired(false).setMinValue(2).setMaxValue(100)),
  new SlashCommandBuilder().setName('help').setDescription('Show bot commands'),
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function registerCommands() {
  if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) return;
  const route = process.env.GUILD_ID
    ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
    : Routes.applicationCommands(process.env.CLIENT_ID);
  await rest.put(route, { body: commands });
  console.log('Slash commands registered.');
}

function hasPermission(interaction, permission) {
  return interaction.memberPermissions?.has(permission);
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  client.user.setActivity('/help | Multipurpose Bot');
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    const { commandName } = interaction;

    if (commandName === 'ping') return interaction.reply(`🏓 Pong! ${client.ws.ping}ms`);

    if (commandName === 'serverinfo') {
      const embed = new EmbedBuilder().setTitle(`${interaction.guild.name} Information`).addFields(
        { name: 'Owner', value: `<@${interaction.guild.ownerId}>`, inline: true },
        { name: 'Members', value: `${interaction.guild.memberCount}`, inline: true },
        { name: 'Channels', value: `${interaction.guild.channels.cache.size}`, inline: true },
        { name: 'Created', value: `<t:${Math.floor(interaction.guild.createdTimestamp / 1000)}:D>`, inline: true },
      );
      return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'userinfo') {
      const user = interaction.options.getUser('user') || interaction.user;
      const embed = new EmbedBuilder().setTitle(user.tag).setThumbnail(user.displayAvatarURL({ size: 256 })).addFields(
        { name: 'User ID', value: user.id, inline: true },
        { name: 'Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`, inline: true },
      );
      return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'avatar') {
      const user = interaction.options.getUser('user') || interaction.user;
      return interaction.reply(user.displayAvatarURL({ size: 1024, extension: 'png' }));
    }

    if (commandName === 'say') {
      if (!hasPermission(interaction, PermissionsBitField.Flags.ManageMessages)) return interaction.reply({ content: '❌ You need Manage Messages.', ephemeral: true });
      return interaction.reply({ content: interaction.options.getString('message'), allowedMentions: { parse: [] } });
    }

    if (commandName === 'kick' || commandName === 'ban') {
      const permission = commandName === 'kick' ? PermissionsBitField.Flags.KickMembers : PermissionsBitField.Flags.BanMembers;
      if (!hasPermission(interaction, permission)) return interaction.reply({ content: `❌ You need ${commandName === 'kick' ? 'Kick Members' : 'Ban Members'}.`, ephemeral: true });
      const user = interaction.options.getUser('user', true);
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.reply({ content: '❌ Member not found in this server.', ephemeral: true });
      const reason = interaction.options.getString('reason') || 'No reason provided';
      if (!member.moderatable) return interaction.reply({ content: '❌ I cannot moderate that member.', ephemeral: true });
      if (commandName === 'kick') await member.kick(reason); else await member.ban({ reason });
      return interaction.reply(`✅ ${user.tag} has been ${commandName}ed. Reason: ${reason}`);
    }

    if (commandName === 'timeout') {
      if (!hasPermission(interaction, PermissionsBitField.Flags.ModerateMembers)) return interaction.reply({ content: '❌ You need Moderate Members.', ephemeral: true });
      const user = interaction.options.getUser('user', true);
      const minutes = interaction.options.getInteger('minutes', true);
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member?.moderatable) return interaction.reply({ content: '❌ I cannot timeout that member.', ephemeral: true });
      await member.timeout(minutes * 60 * 1000, `Timeout by ${interaction.user.tag}`);
      return interaction.reply(`✅ ${user.tag} timed out for ${minutes} minute(s).`);
    }

    if (commandName === 'clear') {
      if (!hasPermission(interaction, PermissionsBitField.Flags.ManageMessages)) return interaction.reply({ content: '❌ You need Manage Messages.', ephemeral: true });
      const amount = interaction.options.getInteger('amount', true);
      const deleted = await interaction.channel.bulkDelete(amount, true);
      return interaction.reply({ content: `🧹 Deleted ${deleted.size} message(s).`, ephemeral: true });
    }

    if (commandName === 'lock' || commandName === 'unlock') {
      if (!hasPermission(interaction, PermissionsBitField.Flags.ManageChannels)) return interaction.reply({ content: '❌ You need Manage Channels.', ephemeral: true });
      const everyone = interaction.guild.roles.everyone;
      await interaction.channel.permissionOverwrites.edit(everyone, { SendMessages: commandName === 'unlock' });
      return interaction.reply(commandName === 'lock' ? '🔒 Channel locked.' : '🔓 Channel unlocked.');
    }

    if (commandName === '8ball') {
      const answers = ['Yes.', 'No.', 'Maybe.', 'Definitely.', 'Ask again later.', 'Very likely.', 'I do not think so.'];
      return interaction.reply(`🎱 ${answers[Math.floor(Math.random() * answers.length)]}`);
    }

    if (commandName === 'roll') {
      const sides = interaction.options.getInteger('sides') || 6;
      return interaction.reply(`🎲 You rolled **${Math.floor(Math.random() * sides) + 1}** on a d${sides}.`);
    }

    if (commandName === 'help') {
      const embed = new EmbedBuilder().setTitle('🤖 Multipurpose Bot').setDescription('Moderation, utility and fun commands.').addFields(
        { name: '🛡️ Moderation', value: '`/kick` `/ban` `/timeout` `/clear` `/lock` `/unlock`' },
        { name: '🔧 Utility', value: '`/ping` `/serverinfo` `/userinfo` `/avatar` `/say`' },
        { name: '🎮 Fun', value: '`/8ball` `/roll`' },
      );
      return interaction.reply({ embeds: [embed] });
    }
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) await interaction.followUp({ content: '❌ Something went wrong.', ephemeral: true });
    else await interaction.reply({ content: '❌ Something went wrong.', ephemeral: true });
  }
});

(async () => {
  await registerCommands();
  await client.login(process.env.DISCORD_TOKEN);
})();
