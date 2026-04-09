const { revealViewOnceMessage, getViewOnceNode } = require('../../handlers/viewonceHandler');
const { getViewOnceSettings } = require('../../database');
const { extractNumber } = require('../../utils/jidHelper');

function getQuotedMessage(msg = {}) {
  return msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
}

function resolveHeader(extra, msg, caption) {
  const sender = msg.key.participant || msg.key.remoteJid;
  const senderNumber = extractNumber(sender);
  const groupName = extra.isGroup ? (extra.groupMetadata?.subject || 'Unknown Group') : 'Private Chat';
  const timestamp = new Date().toLocaleString('en-US', { hour12: true });

  return `╭──「 👁️ VIEWONCE CAPTURED 」
│
│ 👤 From: @${senderNumber}
│ 📱 Number: ${senderNumber}
│ 👥 Group: ${groupName}
│ 🕐 Time: ${timestamp}
│
│ 📝 Caption: ${caption || '-'}
│
╰───「 MUHAMMAD SAQIB BOT 」`;
}

module.exports = {
  name: 'viewonce',
  aliases: ['read', 'readvo'],
  category: 'general',
  description: 'Reveal replied view-once media',
  usage: '.viewonce (reply to a view-once message)',
  async execute(sock, msg, args, extra, config) {
    try {
      const settings = getViewOnceSettings();
      if (settings.ownerOnly && !extra.isOwner) {
        return extra.reply('❌ ViewOnce command is owner-only right now.');
      }

      const quoted = getQuotedMessage(msg);
      if (!quoted || !getViewOnceNode(quoted)) {
        return extra.reply('⚠️ Reply to a view-once image/video/audio message.');
      }

      await extra.react('👁️');
      const revealed = await revealViewOnceMessage(sock, quoted);
      if (!revealed) {
        return extra.reply('❌ Could not reveal that message.');
      }

      const header = resolveHeader(extra, msg, revealed.caption);
      const sender = msg.key.participant || msg.key.remoteJid;

      if (revealed.type === 'image') {
        await sock.sendMessage(extra.from, {
          image: revealed.buffer,
          caption: header,
          mentions: [sender],
        }, { quoted: msg });
      } else if (revealed.type === 'video') {
        await sock.sendMessage(extra.from, {
          video: revealed.buffer,
          caption: header,
          mentions: [sender],
        }, { quoted: msg });
      } else {
        await sock.sendMessage(extra.from, {
          audio: revealed.buffer,
          mimetype: revealed.mimetype,
          ptt: false,
        }, { quoted: msg });
        await extra.reply(header, { mentions: [sender] });
      }
    } catch (error) {
      await extra.reply(`❌ ViewOnce failed: ${error.message}`);
    }
  },
};
