const { PermissionsBitField } = require('discord.js');

function has(interaction, permission) {
  return interaction.memberPermissions?.has(permission);
}

async function requirePermission(interaction, permission, label) {
  if (has(interaction, permission)) return true;
  await interaction.reply({ content: `❌ You need **${label}**.`, ephemeral: true });
  return false;
}

module.exports = { has, requirePermission, PermissionsBitField };
