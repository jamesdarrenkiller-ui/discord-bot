const fs = require('fs');
const path = require('path');

function loadCommands(client) {
  const commandFiles = fs.readdirSync(path.join(__dirname, '../commands')).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const commands = require(path.join(__dirname, '../commands', file));
    for (const command of commands) {
      client.commands.set(command.data.name, command);
    }
  }
}

function getCommandPayload(client) {
  return [...client.commands.values()].map(command => command.data.toJSON());
}

module.exports = { loadCommands, getCommandPayload };
