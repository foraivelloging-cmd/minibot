const { getGroupSettings } = require('../database');

function formatTemplate(template, userJid, groupName) {
  const userTag = `@${String(userJid).split('@')[0]}`;
  return String(template || '').replace(/@user/g, userTag).replace(/@group/g, groupName || 'this group');
}

async function handleGroupParticipantsUpdate(sock, update) {
  try {
    const { id, participants = [], action } = update || {};
    if (!id || !participants.length) return;
    const settings = getGroupSettings(id);
    const metadata = await sock.groupMetadata(id).catch(() => null);
    const groupName = metadata?.subject || 'Group';

    if (action === 'add' && settings.welcome) {
      for (const jid of participants) {
        const text = formatTemplate(settings.welcomeMessage, jid, groupName);
        await sock.sendMessage(id, { text, mentions: [jid] });
      }
    }

    if (action === 'remove' && settings.goodbye) {
      for (const jid of participants) {
        const text = formatTemplate(settings.goodbyeMessage, jid, groupName);
        await sock.sendMessage(id, { text, mentions: [jid] });
      }
    }
  } catch (error) {
    console.error('[GROUP_EVENTS] Failed to process participant update:', error.message);
  }
}

module.exports = { handleGroupParticipantsUpdate };
