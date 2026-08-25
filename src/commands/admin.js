const { SlashCommandBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const { requirePermission } = require('../utils/permissions');
const { getGuild } = require('../database/repository');

async function requireServerOwner(interaction) {
  if (interaction.guild.ownerId !== interaction.user.id) {
    await interaction.reply({ content: '❌ Only the server owner can use this command.', ephemeral: true });
    return false;
  }
  return true;
}

function mentionList(ids) {
  return ids.length ? ids.map(id => `<@${id}>`).join(', ') : 'None';
}

const ownerBypass = new SlashCommandBuilder()
  .setName('extraowner')
  .setDescription('Manage trusted extra owners who bypass security')
  .addSubcommand(s => s.setName('add').setDescription('Add an extra owner').addUserOption(o => o.setName('user').setDescription('User').setRequired(true)))
  .addSubcommand(s => s.setName('remove').setDescription('Remove an extra owner').addUserOption(o => o.setName('user').setDescription('User').setRequired(true)))
  .addSubcommand(s => s.setName('list').setDescription('List extra owners'));

const modBypass = new SlashCommandBuilder()
  .setName('mod')
  .setDescription('Manage trusted moderators who bypass security')
  .addSubcommand(s => s.setName('add').setDescription('Add a security-bypass moderator').addUserOption(o => o.setName('user').setDescription('User').setRequired(true)))
  .addSubcommand(s => s.setName('remove').setDescription('Remove a security-bypass moderator').addUserOption(o => o.setName('user').setDescription('User').setRequired(true)))
  .addSubcommand(s => s.setName('list').setDescription('List security-bypass moderators'));

module.exports = [
  { data: ownerBypass, async execute(i) {
    if (!await requireServerOwner(i)) return;
    const g = await getGuild(i.guild.id);
    const action = i.options.getSubcommand();
    if (action === 'list') return i.reply({ content: `👑 **Extra Owners**\n${mentionList(g.extraOwners)}`, ephemeral: true });
    const user = i.options.getUser('user', true);
    if (user.id === i.guild.ownerId) return i.reply({ content: '❌ The server owner already has permanent bypass.', ephemeral: true });
    if (action === 'add') {
      if (!g.extraOwners.includes(user.id)) g.extraOwners.push(user.id);
      await g.save();
      return i.reply(`✅ ${user} is now an **Extra Owner** and bypasses Anti-Nuke/Anti-Raid security checks.`);
    }
    g.extraOwners = g.extraOwners.filter(id => id !== user.id);
    await g.save();
    return i.reply(`✅ Removed ${user} from Extra Owners.`);
  } },
  { data: modBypass, async execute(i) {
    if (!await requireServerOwner(i)) return;
    const g = await getGuild(i.guild.id);
    const action = i.options.getSubcommand();
    if (action === 'list') return i.reply({ content: `🛡️ **Security-Bypass Moderators**\n${mentionList(g.bypassUsers)}`, ephemeral: true });
    const user = i.options.getUser('user', true);
    if (user.id === i.guild.ownerId) return i.reply({ content: '❌ The server owner already has permanent bypass.', ephemeral: true });
    if (action === 'add') {
      if (!g.bypassUsers.includes(user.id)) g.bypassUsers.push(user.id);
      await g.save();
      return i.reply(`✅ ${user} is now a **Security-Bypass Moderator**.`);
    }
    g.bypassUsers = g.bypassUsers.filter(id => id !== user.id);
    await g.save();
    return i.reply(`✅ Removed ${user} from Security-Bypass Moderators.`);
  } },
  { data:new SlashCommandBuilder().setName('setlog').setDescription('Set the moderation log channel').addChannelOption(o=>o.setName('channel').setDescription('Text channel').addChannelTypes(ChannelType.GuildText).setRequired(true)), async execute(i){if(!await requirePermission(i,PermissionsBitField.Flags.ManageGuild,'Manage Server'))return;const g=await getGuild(i.guild.id);g.logChannelId=i.options.getChannel('channel',true).id;await g.save();return i.reply('📋 Log channel configured.');} },
  { data:new SlashCommandBuilder().setName('setwelcome').setDescription('Set welcome channel').addChannelOption(o=>o.setName('channel').setDescription('Text channel').addChannelTypes(ChannelType.GuildText).setRequired(true)), async execute(i){if(!await requirePermission(i,PermissionsBitField.Flags.ManageGuild,'Manage Server'))return;const g=await getGuild(i.guild.id);g.welcomeChannelId=i.options.getChannel('channel',true).id;await g.save();return i.reply('👋 Welcome channel configured.');} },
  { data:new SlashCommandBuilder().setName('setgoodbye').setDescription('Set goodbye channel').addChannelOption(o=>o.setName('channel').setDescription('Text channel').addChannelTypes(ChannelType.GuildText).setRequired(true)), async execute(i){if(!await requirePermission(i,PermissionsBitField.Flags.ManageGuild,'Manage Server'))return;const g=await getGuild(i.guild.id);g.goodbyeChannelId=i.options.getChannel('channel',true).id;await g.save();return i.reply('👋 Goodbye channel configured.');} },
  { data:new SlashCommandBuilder().setName('autorole').setDescription('Set the automatic member role').addRoleOption(o=>o.setName('role').setDescription('Role').setRequired(true)), async execute(i){if(!await requirePermission(i,PermissionsBitField.Flags.ManageGuild,'Manage Server'))return;const g=await getGuild(i.guild.id);g.autoRoleId=i.options.getRole('role',true).id;await g.save();return i.reply('🎭 Auto-role configured.');} },
  { data:new SlashCommandBuilder().setName('automod').setDescription('Enable or disable AutoMod').addBooleanOption(o=>o.setName('enabled').setDescription('Enabled').setRequired(true)), async execute(i){if(!await requirePermission(i,PermissionsBitField.Flags.ManageGuild,'Manage Server'))return;const g=await getGuild(i.guild.id);g.automod=i.options.getBoolean('enabled',true);await g.save();return i.reply(`🛡️ AutoMod ${g.automod?'enabled':'disabled'}.`);} },
  { data:new SlashCommandBuilder().setName('antilink').setDescription('Enable or disable link protection').addBooleanOption(o=>o.setName('enabled').setDescription('Enabled').setRequired(true)), async execute(i){if(!await requirePermission(i,PermissionsBitField.Flags.ManageGuild,'Manage Server'))return;const g=await getGuild(i.guild.id);g.antiLink=i.options.getBoolean('enabled',true);await g.save();return i.reply(`🔗 Anti-link ${g.antiLink?'enabled':'disabled'}.`);} },
  { data:new SlashCommandBuilder().setName('anticaps').setDescription('Enable or disable caps protection').addBooleanOption(o=>o.setName('enabled').setDescription('Enabled').setRequired(true)), async execute(i){if(!await requirePermission(i,PermissionsBitField.Flags.ManageGuild,'Manage Server'))return;const g=await getGuild(i.guild.id);g.antiCaps=i.options.getBoolean('enabled',true);await g.save();return i.reply(`🔠 Anti-caps ${g.antiCaps?'enabled':'disabled'}.`);} },
  { data:new SlashCommandBuilder().setName('antiraid').setDescription('Enable or disable raid detection').addBooleanOption(o=>o.setName('enabled').setDescription('Enabled').setRequired(true)), async execute(i){if(!await requirePermission(i,PermissionsBitField.Flags.ManageGuild,'Manage Server'))return;const g=await getGuild(i.guild.id);g.antiRaid=i.options.getBoolean('enabled',true);await g.save();return i.reply(`🚨 Anti-raid ${g.antiRaid?'enabled':'disabled'}.`);} },
  { data:new SlashCommandBuilder().setName('antinuke').setDescription('Enable or disable anti-nuke alerts').addBooleanOption(o=>o.setName('enabled').setDescription('Enabled').setRequired(true)), async execute(i){if(!await requirePermission(i,PermissionsBitField.Flags.Administrator,'Administrator'))return;const g=await getGuild(i.guild.id);g.antiNuke=i.options.getBoolean('enabled',true);await g.save();return i.reply(`🛡️ Anti-nuke ${g.antiNuke?'enabled':'disabled'}.`);} },
];
