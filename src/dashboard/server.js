require('dotenv').config();
const express = require('express');
const { dashboardPort, dashboardSecret } = require('../config');
const { connectDatabase } = require('../database/mongodb');
const { getGuild } = require('../database/repository');

const app = express();
app.use(express.json());

function auth(req, res, next) {
  if (!dashboardSecret || req.headers.authorization !== `Bearer ${dashboardSecret}`) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

app.get('/health', (_req, res) => res.json({ ok: true, service: 'discord-bot-dashboard' }));
app.get('/api/guild/:guildId', auth, async (req, res) => {
  const guild = await getGuild(req.params.guildId);
  res.json({ guildId: guild.guildId, welcomeChannelId: guild.welcomeChannelId, logChannelId: guild.logChannelId, automod: guild.automod, antiLink: guild.antiLink, antiCaps: guild.antiCaps, antiRaid: guild.antiRaid, antiNuke: guild.antiNuke, xpEnabled: guild.xpEnabled });
});
app.patch('/api/guild/:guildId', auth, async (req, res) => {
  const allowed = ['welcomeChannelId','welcomeMessage','goodbyeChannelId','autoRoleId','logChannelId','ticketCategoryId','automod','antiLink','antiCaps','antiRaid','antiNuke','xpEnabled','xpCooldown','xpPerMessage'];
  const guild = await getGuild(req.params.guildId);
  for (const key of allowed) if (Object.prototype.hasOwnProperty.call(req.body, key)) guild[key] = req.body[key];
  await guild.save();
  res.json({ ok: true });
});

connectDatabase().then(() => app.listen(dashboardPort, () => console.log(`Dashboard listening on :${dashboardPort}`))).catch(error => { console.error(error); process.exit(1); });
