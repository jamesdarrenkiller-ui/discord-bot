const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { requirePermission } = require('../utils/permissions');
const { ReactionRole, getGuild } = require('../database/repository');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('reactionrole')
      .setDescription('Manage reaction role panels')
      .addSubcommand(s => s
        .setName('setup')
        .setDescription('Create a reaction role panel')
        .addChannelOption(o => o.setName('channel').setDescription('Channel to send the panel in').setRequired(true))
        .addStringOption(o => o.setName('title').setDescription('Embed title').setRequired(true))
        .addStringOption(o => o.setName('description').setDescription('Embed description (use @role mentions or role IDs)').setRequired(true))
        .addStringOption(o => o.setName('roles').setDescription('Comma-separated role IDs in order (matching description order)').setRequired(true))
        .addStringOption(o => o.setName('emojis').setDescription('Comma-separated emojis in order (matching role order)').setRequired(true))
      )
      .addSubcommand(s => s
        .setName('remove')
        .setDescription('Remove a reaction role panel')
        .addStringOption(o => o.setName('message_id').setDescription('Message ID of the panel').setRequired(true))
      ),
    async execute(i) {
      if (!await requirePermission(i, PermissionsBitField.Flags.ManageRoles, 'Manage Roles')) return;

      const sub = i.options.getSubcommand();

      if (sub === 'remove') {
        const messageId = i.options.getString('message_id', true);
        const rr = await ReactionRole.findOneAndDelete({ messageId, guildId: i.guild.id });
        if (!rr) return i.reply({ content: '❌ Reaction role panel not found.', ephemeral: true });
        const channel = i.guild.channels.cache.get(rr.channelId);
        if (channel) {
          const msg = await channel.messages.fetch(messageId).catch(() => null);
          if (msg) await msg.delete().catch(() => {});
        }
        return i.reply({ content: '✅ Reaction role panel removed.', ephemeral: true });
      }

      // Setup
      const channel = i.options.getChannel('channel', true);
      const title = i.options.getString('title', true);
      const description = i.options.getString('description', true);
      const roleIdsRaw = i.options.getString('roles', true).split(',').map(s => s.trim()).filter(Boolean);
      const emojisRaw = i.options.getString('emojis', true).split(',').map(s => s.trim()).filter(Boolean);

      if (roleIdsRaw.length !== emojisRaw.length) {
        return i.reply({ content: '❌ The number of roles and emojis must match.', ephemeral: true });
      }
      if (roleIdsRaw.length < 1 || roleIdsRaw.length > 10) {
        return i.reply({ content: '❌ Provide between 1 and 10 role-emoji pairs.', ephemeral: true });
      }

      const mappings = {};
      const lines = [];
      for (let j = 0; j < roleIdsRaw.length; j++) {
        const roleId = roleIdsRaw[j].replace(/[<@&>]/g, '');
        const role = i.guild.roles.cache.get(roleId);
        if (!role) return i.reply({ content: `❌ Role not found: ${roleIdsRaw[j]}`, ephemeral: true });
        mappings[emojisRaw[j]] = roleId;
        lines.push(`${emojisRaw[j]} → ${role}`);
      }

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description + '\n\n' + lines.join('\n'))
        .setColor(0x5865F2);

      const msg = await channel.send({ embeds: [embed] });
      for (const emoji of Object.keys(mappings)) {
        await msg.react(emoji).catch(() => {});
      }

      await ReactionRole.create({
        guildId: i.guild.id,
        messageId: msg.id,
        channelId: channel.id,
        mappings,
        embedTitle: title,
        embedDescription: description,
      });

      return i.reply({ content: `✅ Reaction role panel created in ${channel}.`, ephemeral: true });
    },
  },
];
