const { Guild, User, Warning, Ticket, Giveaway } = require('./models');

const getGuild = guildId => Guild.findOneAndUpdate({ guildId }, { $setOnInsert: { guildId } }, { upsert: true, new: true });
const getUser = userId => User.findOneAndUpdate({ userId }, { $setOnInsert: { userId } }, { upsert: true, new: true });
const addWarning = (guildId, userId, moderatorId, reason) => Warning.create({ guildId, userId, moderatorId, reason });
const getWarnings = (guildId, userId) => Warning.find({ guildId, userId }).sort({ createdAt: -1 });

module.exports = { Guild, User, Warning, Ticket, Giveaway, getGuild, getUser, addWarning, getWarnings };
