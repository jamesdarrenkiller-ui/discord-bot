require('dotenv').config();
const { REST, Routes } = require('discord.js');
const { token, clientId, guildId } = require('./config');
const { loadCommands, getCommandPayload } = require('./handlers/commandHandler');
const { Client, Collection } = require('discord.js');

const client = new Client({ intents: [] });
client.commands = new Collection();
loadCommands(client);

async function deploy() {
  if (!token || !clientId) throw new Error('DISCORD_TOKEN and CLIENT_ID are required.');
  const rest = new REST({ version: '10' }).setToken(token);
  const route = guildId ? Routes.applicationGuildCommands(clientId, guildId) : Routes.applicationCommands(clientId);
  await rest.put(route, { body: getCommandPayload(client) });
  console.log(`Registered ${client.commands.size} slash commands.`);
}

deploy().catch(error => { console.error(error); process.exit(1); });
