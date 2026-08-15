const { getGuild, getUser } = require('../../database/repository');

function levelForXp(xp) { return Math.floor(Math.sqrt(Math.max(0, xp) / 100)); }

async function awardMessageXp(message) {
  if (!message.guild || message.author.bot) return;
  const cfg = await getGuild(message.guild.id);
  if (!cfg.xpEnabled) return;
  const user = await getUser(message.author.id);
  const before = levelForXp(user.xp);
  user.xp += Math.max(1, cfg.xpPerMessage);
  const after = levelForXp(user.xp);
  user.level = after;
  await user.save();
  if (after > before) await message.channel.send(`🎉 ${message.author}, you reached **Level ${after}**!`).catch(() => {});
}

module.exports = { awardMessageXp, levelForXp };
