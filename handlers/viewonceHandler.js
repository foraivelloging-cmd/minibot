const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { extractNumber } = require('../utils/jidHelper');

function getViewOnceNode(message = {}) {
  if (!message) return null;

  if (message.viewOnceMessage?.message) return message.viewOnceMessage.message;
  if (message.viewOnceMessageV2?.message) return message.viewOnceMessageV2.message;
  if (message.viewOnceMessageV2Extension?.message) return message.viewOnceMessageV2Extension.message;

  if (message.imageMessage?.viewOnce) return { imageMessage: message.imageMessage };
  if (message.videoMessage?.viewOnce) return { videoMessage: message.videoMessage };
  if (message.audioMessage?.viewOnce) return { audioMessage: message.audioMessage };

  return null;
}

function getMediaPayload(message = {}) {
  const viewOnceNode = getViewOnceNode(message);
  if (!viewOnceNode) return null;

  if (viewOnceNode.imageMessage) {
    return {
      type: 'image',
      content: viewOnceNode.imageMessage,
      caption: viewOnceNode.imageMessage.caption || '',
      mimetype: viewOnceNode.imageMessage.mimetype || 'image/jpeg',
    };
  }

  if (viewOnceNode.videoMessage) {
    return {
      type: 'video',
      content: viewOnceNode.videoMessage,
      caption: viewOnceNode.videoMessage.caption || '',
      mimetype: viewOnceNode.videoMessage.mimetype || 'video/mp4',
    };
  }

  if (viewOnceNode.audioMessage) {
    return {
      type: 'audio',
      content: viewOnceNode.audioMessage,
      caption: '',
      mimetype: viewOnceNode.audioMessage.mimetype || 'audio/mp4',
    };
  }

  return null;
}

async function bufferFromMedia(content, type) {
  const stream = await downloadContentFromMessage(content, type);
  let buffer = Buffer.from([]);
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }
  return buffer;
}

async function revealViewOnceMessage(sock, messageContainer = {}) {
  const payload = getMediaPayload(messageContainer);
  if (!payload) return null;

  const buffer = await bufferFromMedia(payload.content, payload.type);
  return {
    type: payload.type,
    buffer,
    caption: payload.caption,
    mimetype: payload.mimetype,
  };
}

async function autoSaveViewOnce(sock, msg, config, viewOnceSettings) {
  try {
    const message = msg?.message;
    const payload = getMediaPayload(message);
    if (!payload) return false;

    if (!viewOnceSettings?.autoSave) return false;

    const ownerNumber = String(config.ownerNumber || config.OWNER_NUMBER || '').replace(/[^0-9]/g, '');
    if (!ownerNumber) return false;

    const ownerJid = `${ownerNumber}@s.whatsapp.net`;
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const senderNumber = extractNumber(sender);

    let groupName = 'Private Chat';
    if (from.endsWith('@g.us')) {
      const metadata = await sock.groupMetadata(from).catch(() => null);
      groupName = metadata?.subject || 'Unknown Group';
    }

    const revealed = await revealViewOnceMessage(sock, message);
    if (!revealed) return false;

    const header = `📸 *ViewOnce Captured*\nFrom: @${senderNumber}\nGroup: ${groupName}\n\nCaption: ${revealed.caption || '-'}`;

    if (revealed.type === 'image') {
      await sock.sendMessage(ownerJid, {
        image: revealed.buffer,
        caption: header,
        mentions: [sender],
      });
    } else if (revealed.type === 'video') {
      await sock.sendMessage(ownerJid, {
        video: revealed.buffer,
        caption: header,
        mentions: [sender],
      });
    } else {
      await sock.sendMessage(ownerJid, {
        audio: revealed.buffer,
        mimetype: revealed.mimetype,
        ptt: false,
      });
      await sock.sendMessage(ownerJid, { text: header, mentions: [sender] });
    }

    return true;
  } catch (error) {
    console.error('[VIEWONCE] Auto-save failed:', error.message);
    return false;
  }
}

module.exports = {
  getViewOnceNode,
  revealViewOnceMessage,
  autoSaveViewOnce,
};
