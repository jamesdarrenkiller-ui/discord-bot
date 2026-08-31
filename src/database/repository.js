const { Guild, User, Warning, Ticket, Giveaway, ReactionRole, Reminder, Poll, Tag, StickyMessage, TempRole } = require('./models');

const getGuild = guildId => Guild.findOneAndUpdate(
  { guildId },
  { $setOnInsert: { guildId } },
  { upsert: true, new: true }
);

const getUser = (guildId, userId) => User.findOneAndUpdate(
  { guildId, userId },
  { $setOnInsert: { guildId, userId } },
  { upsert: true, new: true }
);

const addWarning = (guildId, userId, moderatorId, reason) =>
  Warning.create({ guildId, userId, moderatorId, reason });

const getWarnings = (guildId, userId) =>
  Warning.find({ guildId, userId }).sort({ createdAt: -1 });

module.exports = {
  Guild,
  User,
  Warning,
  Ticket,
  Giveaway,
  ReactionRole,
  Reminder,
  Poll,
  Tag,
  StickyMessage,
  TempRole,
  getGuild,
  getUser,
  addWarning,
  getWarnings,
};
