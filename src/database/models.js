const { mongoose } = require('./mongodb');

const GuildSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true, index: true },
  prefix: { type: String, default: '!' },
  adminRoles: { type: [String], default: [] },
  modRoles: { type: [String], default: [] },
  extraOwners: { type: [String], default: [] },
  bypassUsers: { type: [String], default: [] },
  noPrefixUsers: { type: [String], default: [] },
  welcomeChannelId: String,
  welcomeMessage: { type: String, default: 'Welcome {user} to {server}! 🎉' },
  goodbyeChannelId: String,
  autoRoleId: String,
  logChannelId: String,
  logMessageEdits: { type: Boolean, default: false },
  logMessageDeletes: { type: Boolean, default: false },
  logVoiceActivity: { type: Boolean, default: false },
  logRoleChanges: { type: Boolean, default: false },
  ticketCategoryId: String,
  ticketSupportRoleId: String,
  automod: { type: Boolean, default: true },
  antiLink: { type: Boolean, default: false },
  antiSpam: { type: Boolean, default: true },
  antiCaps: { type: Boolean, default: false },
  antiRaid: { type: Boolean, default: true },
  antiNuke: { type: Boolean, default: false },
  xpEnabled: { type: Boolean, default: true },
  xpCooldown: { type: Number, default: 60000 },
  xpPerMessage: { type: Number, default: 10 },
  economyEnabled: { type: Boolean, default: true },
  musicEnabled: { type: Boolean, default: true },
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  cash: { type: Number, default: 0 },
  bank: { type: Number, default: 0 },
  inventory: { type: Map, of: Number, default: {} },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 0 },
  lastDaily: { type: Date, default: null },
  lastWeekly: { type: Date, default: null },
  lastWork: { type: Date, default: null },
  lastBeg: { type: Date, default: null },
  afk: { type: String, default: '' },
  afkSince: { type: Date, default: null },
}, { timestamps: true });
UserSchema.index({ guildId: 1, userId: 1 }, { unique: true });

const WarningSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  moderatorId: { type: String, required: true },
  reason: { type: String, default: 'No reason provided' },
}, { timestamps: true });

const TicketSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  channelId: { type: String, unique: true },
  userId: String,
  type: { type: String, default: 'support' },
  claimedBy: String,
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
}, { timestamps: true });

const GiveawaySchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  channelId: String,
  messageId: { type: String, unique: true },
  prize: String,
  winners: { type: Number, default: 1 },
  endsAt: Date,
  ended: { type: Boolean, default: false },
}, { timestamps: true });

const ReactionRoleSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  messageId: { type: String, required: true, index: true },
  channelId: String,
  mappings: { type: Map, of: String, default: {} },
  embedTitle: { type: String, default: 'React to get roles' },
  embedDescription: { type: String, default: '' },
}, { timestamps: true });

const ReminderSchema = new mongoose.Schema({
  guildId: { type: String, default: null },
  channelId: { type: String, required: true },
  userId: { type: String, required: true, index: true },
  text: { type: String, required: true },
  remindAt: { type: Date, required: true, index: true },
  delivered: { type: Boolean, default: false },
}, { timestamps: true });

const PollSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  channelId: String,
  messageId: { type: String, unique: true },
  question: { type: String, required: true },
  options: [{ label: String, emoji: String }],
  authorId: String,
  endsAt: Date,
  ended: { type: Boolean, default: false },
}, { timestamps: true });

const TagSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  content: { type: String, required: true },
  authorId: String,
  useCount: { type: Number, default: 0 },
}, { timestamps: true });
TagSchema.index({ guildId: 1, name: 1 }, { unique: true });

const StickyMessageSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  channelId: { type: String, unique: true },
  content: { type: String, required: true },
  messageCount: { type: Number, default: 0 },
  interval: { type: Number, default: 10 },
}, { timestamps: true });

const TempRoleSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  roleId: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: true },
}, { timestamps: true });

const Guild = mongoose.models.Guild || mongoose.model('Guild', GuildSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Warning = mongoose.models.Warning || mongoose.model('Warning', WarningSchema);
const Ticket = mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);
const Giveaway = mongoose.models.Giveaway || mongoose.model('Giveaway', GiveawaySchema);
const ReactionRole = mongoose.models.ReactionRole || mongoose.model('ReactionRole', ReactionRoleSchema);
const Reminder = mongoose.models.Reminder || mongoose.model('Reminder', ReminderSchema);
const Poll = mongoose.models.Poll || mongoose.model('Poll', PollSchema);
const Tag = mongoose.models.Tag || mongoose.model('Tag', TagSchema);
const StickyMessage = mongoose.models.StickyMessage || mongoose.model('StickyMessage', StickyMessageSchema);
const TempRole = mongoose.models.TempRole || mongoose.model('TempRole', TempRoleSchema);

module.exports = { Guild, User, Warning, Ticket, Giveaway, ReactionRole, Reminder, Poll, Tag, StickyMessage, TempRole };
