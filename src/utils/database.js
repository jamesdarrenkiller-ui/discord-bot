const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data');
const file = path.join(dataDir, 'db.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(file)) {
  fs.writeFileSync(file, JSON.stringify({ users: {}, guilds: {}, warnings: {}, giveaways: {} }, null, 2));
}

let db;
try { db = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { db = { users: {}, guilds: {}, warnings: {}, giveaways: {} }; }

db.users ||= {};
db.guilds ||= {};
db.warnings ||= {};
db.giveaways ||= {};

function save() { fs.writeFileSync(file, JSON.stringify(db, null, 2)); }
function getUser(id) { db.users[id] ||= { cash: 0, bank: 0, daily: 0, work: 0 }; return db.users[id]; }
function getGuild(id) { db.guilds[id] ||= { logChannel: null, welcomeChannel: null, welcomeMessage: 'Welcome {user} to {server}! 🎉', automod: true }; return db.guilds[id]; }
function getWarnings(guildId, userId) { const key = `${guildId}:${userId}`; db.warnings[key] ||= []; return db.warnings[key]; }

module.exports = { db, save, getUser, getGuild, getWarnings };
