require('dotenv').config();
const { REST, Routes, Client, Collection } = require('discord.js');
const { token, clientId, guildId } = require('./config');
const { loadCommands, getCommandPayload } = require('./handlers/commandHandler');

const client = new Client({ intents: [] });
client.commands = new Collection();
loadCommands(client);

async function deploy() {
  if (!token) throw new Error('DISCORD_TOKEN is missing in .env');
  if (!clientId) throw new Error('CLIENT_ID is missing in .env');

  const commands = getCommandPayload(client);
  console.log(`📦 Loaded ${commands.length} slash commands.`);

  const rest = new REST({ version: '10' }).setToken(token);
  const route = guildId
    ? Routes.applicationGuildCommands(clientId, guildId)
    : Routes.applicationCommands(clientId);

  console.log(guildId ? `🚀 Registering commands to test guild ${guildId}...` : '🌍 Registering global commands...');
  await rest.put(route, { body: commands });
  console.log(`✅ Successfully registered ${commands.length} slash commands.`);
  if (!guildId) console.log('⏳ Global commands can take some time to appear in Discord.');
}

deploy().catch(error => {
  console.error('❌ Slash-command deployment failed:', error?.message || error);
  process.exit(1);
});
