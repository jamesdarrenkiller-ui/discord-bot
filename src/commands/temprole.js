const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { requirePermission } = require('../utils/permissions');
const { TempRole } = require('../database/repository');
const { log } = require('../utils/logger');

function parseDuration(str) {
  const match = str.match(/^(\d+)(m|h|d)$/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  const unit = match[2];
  return unit === 'm' ? n * 60000 : unit === 'h' ? n * 3600000 : n * 86400000;
}

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('temprole')
      .setDescription('Assign a temporary role that auto-removes')
      .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true))
      .addRoleOption(o => o.setName('role').setDescription('Role to assign').setRequired(true))
      .addStringOption(o => o.setName('duration').setDescription('Duration (e.g. 30m, 2h, 7d)').setRequired(true)),
    async execute(i) {
      if (!await requirePermission(i, PermissionsBitField.Flags.ManageRoles, 'Manage Roles')) return;

      const user = i.options.getUser('user', true);
      const role = i.options.getRole('role', true);
      const duration = parseDuration(i.options.getString('duration', true));

      if (!duration || duration < 60000 || duration > 2592000000) {
        return i.reply({ content: '❌ Duration must be 1m–30d.', ephemeral: true });
      }

      const member = await i.guild.members.fetch(user.id).catch(() => null);
      if (!member) return i.reply({ content: '❌ User not found in this server.', ephemeral: true });

      const botHighest = i.guild.members.me.roles.highest;
      if (role.position >= botHighest.position) {
        return i.reply({ content: '❌ I cannot assign a role higher than or equal to my highest role.', ephemeral: true });
      }

      const expiresAt = new Date(Date.now() + duration);

      // Remove existing temp role for same user+role if any
      await TempRole.deleteMany({ guildId: i.guild.id, userId: user.id, roleId: role.id });

      await TempRole.create({
        guildId: i.guild.id,
        userId: user.id,
        roleId: role.id,
        expiresAt,
      });

      await member.roles.add(role, `Temp role by ${i.user.tag}`);

      const mins = Math.round(duration / 60000);
      const timeStr = mins >= 1440 ? `${Math.round(mins / 1440)}d` : mins >= 60 ? `${Math.round(mins / 60)}h` : `${mins}m`;

      await log(i.guild, 'Temp Role Assigned', `${user.tag} received ${role} for ${timeStr} by ${i.user.tag}.`);
      return i.reply({ content: `✅ ${role} assigned to ${user} for **${timeStr}**.`, ephemeral: true });
    },
  },
];
