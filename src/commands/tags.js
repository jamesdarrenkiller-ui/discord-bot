const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { Tag } = require('../database/repository');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('tag')
      .setDescription('Manage server tags')
      .addSubcommand(s => s
        .setName('create')
        .setDescription('Create a new tag')
        .addStringOption(o => o.setName('name').setDescription('Tag name').setRequired(true))
        .addStringOption(o => o.setName('content').setDescription('Tag content').setRequired(true))
      )
      .addSubcommand(s => s
        .setName('delete')
        .setDescription('Delete a tag')
        .addStringOption(o => o.setName('name').setDescription('Tag name').setRequired(true))
      )
      .addSubcommand(s => s
        .setName('edit')
        .setDescription('Edit a tag')
        .addStringOption(o => o.setName('name').setDescription('Tag name').setRequired(true))
        .addStringOption(o => o.setName('content').setDescription('New content').setRequired(true))
      )
      .addSubcommand(s => s
        .setName('list')
        .setDescription('List all tags')
      )
      .addSubcommand(s => s
        .setName('get')
        .setDescription('Get a tag')
        .addStringOption(o => o.setName('name').setDescription('Tag name').setRequired(true))
      ),
    async execute(i) {
      const sub = i.options.getSubcommand();

      if (sub === 'create') {
        const name = i.options.getString('name', true).toLowerCase().replace(/\s+/g, '-');
        const content = i.options.getString('content', true);
        const existing = await Tag.findOne({ guildId: i.guild.id, name });
        if (existing) return i.reply({ content: `❌ Tag \`${name}\` already exists.`, ephemeral: true });
        await Tag.create({ guildId: i.guild.id, name, content, authorId: i.user.id });
        return i.reply({ content: `✅ Tag \`${name}\` created.`, ephemeral: true });
      }

      if (sub === 'delete') {
        const name = i.options.getString('name', true).toLowerCase();
        const tag = await Tag.findOneAndDelete({ guildId: i.guild.id, name, authorId: i.user.id });
        if (!tag) {
          const any = await Tag.findOne({ guildId: i.guild.id, name });
          if (any && !i.memberPermissions?.has(PermissionsBitField.Flags.ManageMessages)) {
            return i.reply({ content: '❌ You can only delete your own tags.', ephemeral: true });
          }
          await Tag.findOneAndDelete({ guildId: i.guild.id, name });
        }
        return i.reply({ content: `✅ Tag \`${name}\` deleted.`, ephemeral: true });
      }

      if (sub === 'edit') {
        const name = i.options.getString('name', true).toLowerCase();
        const content = i.options.getString('content', true);
        const tag = await Tag.findOne({ guildId: i.guild.id, name });
        if (!tag) return i.reply({ content: `❌ Tag \`${name}\` not found.`, ephemeral: true });
        if (tag.authorId !== i.user.id && !i.memberPermissions?.has(PermissionsBitField.Flags.ManageMessages)) {
          return i.reply({ content: '❌ You can only edit your own tags.', ephemeral: true });
        }
        tag.content = content;
        await tag.save();
        return i.reply({ content: `✅ Tag \`${name}\` updated.`, ephemeral: true });
      }

      if (sub === 'list') {
        const tags = await Tag.find({ guildId: i.guild.id }).sort({ name: 1 });
        if (!tags.length) return i.reply({ content: '📭 No tags in this server.', ephemeral: true });
        const list = tags.map(t => `\`${t.name}\` — ${t.useCount} uses`).join('\n');
        return i.reply({ content: `🏷️ **Tags**\n${list}`, ephemeral: true });
      }

      if (sub === 'get') {
        const name = i.options.getString('name', true).toLowerCase();
        const tag = await Tag.findOne({ guildId: i.guild.id, name });
        if (!tag) return i.reply({ content: `❌ Tag \`${name}\` not found.`, ephemeral: true });
        tag.useCount += 1;
        await tag.save();
        return i.reply(tag.content.slice(0, 2000));
      }
    },
  },
  {
    data: new SlashCommandBuilder().setName('tags').setDescription('List all server tags'),
    async execute(i) {
      const tags = await Tag.find({ guildId: i.guild.id }).sort({ name: 1 });
      if (!tags.length) return i.reply({ content: '📭 No tags in this server.', ephemeral: true });
      const list = tags.map(t => `\`${t.name}\` — ${t.useCount} uses`).join('\n');
      return i.reply({ content: `🏷️ **Tags**\n${list}`, ephemeral: true });
    },
  },
];
