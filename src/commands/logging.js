const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { requirePermission } = require('../utils/permissions');
const { getGuild } = require('../database/repository');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('log-edits')
      .setDescription('Toggle logging of message edits')
      .addBooleanOption(o => o.setName('enabled').setDescription('Enable or disable').setRequired(true)),
    async execute(i) {
      if (!await requirePermission(i, PermissionsBitField.Flags.ManageGuild, 'Manage Server')) return;
      const g = await getGuild(i.guild.id);
      g.logMessageEdits = i.options.getBoolean('enabled', true);
      await g.save();
      return i.reply(`📝 Message edit logging ${g.logMessageEdits ? 'enabled' : 'disabled'}.`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('log-deletes')
      .setDescription('Toggle logging of message deletes')
      .addBooleanOption(o => o.setName('enabled').setDescription('Enable or disable').setRequired(true)),
    async execute(i) {
      if (!await requirePermission(i, PermissionsBitField.Flags.ManageGuild, 'Manage Server')) return;
      const g = await getGuild(i.guild.id);
      g.logMessageDeletes = i.options.getBoolean('enabled', true);
      await g.save();
      return i.reply(`🗑️ Message delete logging ${g.logMessageDeletes ? 'enabled' : 'disabled'}.`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('log-voice')
      .setDescription('Toggle logging of voice channel activity')
      .addBooleanOption(o => o.setName('enabled').setDescription('Enable or disable').setRequired(true)),
    async execute(i) {
      if (!await requirePermission(i, PermissionsBitField.Flags.ManageGuild, 'Manage Server')) return;
      const g = await getGuild(i.guild.id);
      g.logVoiceActivity = i.options.getBoolean('enabled', true);
      await g.save();
      return i.reply(`🔊 Voice activity logging ${g.logVoiceActivity ? 'enabled' : 'disabled'}.`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('log-roles')
      .setDescription('Toggle logging of role changes')
      .addBooleanOption(o => o.setName('enabled').setDescription('Enable or disable').setRequired(true)),
    async execute(i) {
      if (!await requirePermission(i, PermissionsBitField.Flags.ManageGuild, 'Manage Server')) return;
      const g = await getGuild(i.guild.id);
      g.logRoleChanges = i.options.getBoolean('enabled', true);
      await g.save();
      return i.reply(`🎭 Role change logging ${g.logRoleChanges ? 'enabled' : 'disabled'}.`);
    },
  },
];
