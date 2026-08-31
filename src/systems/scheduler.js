const { Reminder, TempRole } = require('../database/repository');

function startScheduler(client) {
  // Check every 30 seconds for due reminders and expired temp roles
  setInterval(async () => {
    try {
      await deliverReminders(client);
      await removeExpiredTempRoles(client);
    } catch (err) {
      console.error('Scheduler error:', err);
    }
  }, 30000);

  console.log('⏰ Scheduler started (reminders + temp roles).');
}

async function deliverReminders(client) {
  const now = new Date();
  const due = await Reminder.find({ delivered: false, remindAt: { $lte: now } }).limit(50);

  for (const reminder of due) {
    try {
      const user = await client.users.fetch(reminder.userId).catch(() => null);
      if (user) {
        await user.send(`⏰ **Reminder:** ${reminder.text}`).catch(() => {
          // DM failed — try sending in the original channel
        });
      }

      // Also try to send in the channel where the reminder was set
      const channel = client.channels.cache.get(reminder.channelId);
      if (channel) {
        await channel.send(`<@${reminder.userId}> ⏰ **Reminder:** ${reminder.text}`).catch(() => {});
      }
    } catch (err) {
      console.error('Failed to deliver reminder:', err);
    }

    reminder.delivered = true;
    await reminder.save().catch(() => {});
  }
}

async function removeExpiredTempRoles(client) {
  const now = new Date();
  const expired = await TempRole.find({ expiresAt: { $lte: now } }).limit(50);

  for (const tr of expired) {
    try {
      const guild = client.guilds.cache.get(tr.guildId);
      if (guild) {
        const member = await guild.members.fetch(tr.userId).catch(() => null);
        if (member) {
          const role = guild.roles.cache.get(tr.roleId);
          if (role && member.roles.cache.has(tr.roleId)) {
            await member.roles.remove(tr.roleId, 'Temp role expired').catch(() => {});
          }
        }
      }
    } catch (err) {
      console.error('Failed to remove temp role:', err);
    }

    await TempRole.deleteOne({ _id: tr._id }).catch(() => {});
  }
}

module.exports = { startScheduler };
