const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const FOOTER = '> © 💙 MUHAMMAD SAQIB ❤️ッ';

function withFooter(text) {
  return `${text}\n\n${FOOTER}`;
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function getMediaFromContainer(container = {}) {
  const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'];
  for (const type of mediaTypes) {
    if (container[type]) {
      const mediaType = type.replace('Message', '');
      return { media: container[type], mediaType, kind: type };
    }
  }
  return null;
}

function extractViewOnceTarget(rawMessage) {
  const extended = rawMessage?.message?.extendedTextMessage;
  const quoted = extended?.contextInfo?.quotedMessage;
  const candidates = [quoted, rawMessage?.message];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const content = candidate.ephemeralMessage?.message || candidate;

    const wrappers = [
      content.viewOnceMessage,
      content.viewOnceMessageV2,
      content.viewOnceMessageV2Extension,
    ].filter(Boolean);

    for (const wrapper of wrappers) {
      const inner = wrapper?.message || {};
      const resolved = getMediaFromContainer(inner);
      if (resolved) {
        const caption = resolved.media.caption || inner?.extendedTextMessage?.text || 'No caption';
        return { ...resolved, caption };
      }
    }

    const direct = getMediaFromContainer(content);
    if (direct?.media?.viewOnce) {
      return { ...direct, caption: direct.media.caption || 'No caption' };
    }
  }

  return null;
}

async function downloadMediaBuffer(media, mediaType) {
  const stream = await downloadContentFromMessage(media, mediaType);
  return streamToBuffer(stream);
}

async function sendMedia(ctx, buffer, target) {
  const payload = {};

  if (target.kind === 'imageMessage') {
    payload.image = buffer;
    payload.caption = withFooter(`🖼️ *ViewOnce Revealed*\n\n📝 Caption: ${target.caption || 'No caption'}`);
  } else if (target.kind === 'videoMessage') {
    payload.video = buffer;
    payload.caption = withFooter(`🎥 *ViewOnce Revealed*\n\n📝 Caption: ${target.caption || 'No caption'}`);
  } else if (target.kind === 'audioMessage') {
    payload.audio = buffer;
    payload.mimetype = target.media.mimetype || 'audio/ogg';
    payload.ptt = false;
  } else if (target.kind === 'documentMessage') {
    payload.document = buffer;
    payload.mimetype = target.media.mimetype || 'application/octet-stream';
    payload.fileName = target.media.fileName || `viewonce-${Date.now()}`;
    payload.caption = withFooter(`📄 *ViewOnce Document Revealed*\n\n📝 Caption: ${target.caption || 'No caption'}`);
  } else if (target.kind === 'stickerMessage') {
    payload.sticker = buffer;
  } else {
    throw new Error(`Unsupported media type: ${target.kind}`);
  }

  await ctx.socket.sendMessage(ctx.sender, payload, { quoted: ctx.msg });

  if (target.kind === 'audioMessage' || target.kind === 'stickerMessage') {
    await ctx.socket.sendMessage(ctx.sender, { text: withFooter('✅ ViewOnce media revealed successfully.') }, { quoted: ctx.msg });
  }
}

module.exports = {
  category: 'viewonce',
  emoji: '👁️',
  description: 'Reveal and auto-capture viewonce media',
  commands: [
    {
      name: 'viewonce',
      aliases: ['vv', 'rvo'],
      description: 'Reveal quoted viewonce media',
      usage: '.viewonce (reply to a viewonce message)',
      async execute(ctx) {
        const target = extractViewOnceTarget(ctx.msg);
        if (!target) {
          return ctx.socket.sendMessage(ctx.sender, {
            text: withFooter('❌ Reply to a valid viewonce image/video/audio/document/sticker message.'),
          }, { quoted: ctx.msg });
        }

        if (!['image', 'video', 'audio', 'document', 'sticker'].includes(target.mediaType)) {
          return ctx.socket.sendMessage(ctx.sender, {
            text: withFooter(`❌ Unsupported viewonce type: ${target.kind}`),
          }, { quoted: ctx.msg });
        }

        try {
          const buffer = await downloadMediaBuffer(target.media, target.mediaType);
          if (!buffer?.length) throw new Error('Empty media buffer');
          await sendMedia(ctx, buffer, target);
        } catch (error) {
          await ctx.socket.sendMessage(ctx.sender, {
            text: withFooter(`❌ Failed to reveal viewonce media: ${error.message || 'Unknown error'}`),
          }, { quoted: ctx.msg });
        }
      },
    },
    {
      name: 'autoviewonce',
      aliases: [],
      description: 'Enable/disable viewonce auto-save to owner DM',
      usage: '.autoviewonce on|off|status',
      ownerOnly: true,
      async execute(ctx) {
        const action = (ctx.args[0] || 'status').toLowerCase();

        if (action === 'status') {
          const enabled = ctx.userConfig.AUTO_VIEWONCE === 'true';
          return ctx.socket.sendMessage(ctx.sender, {
            text: withFooter(`👁️ AutoViewOnce is currently *${enabled ? 'ON' : 'OFF'}*.`),
          }, { quoted: ctx.msg });
        }

        if (!['on', 'off'].includes(action)) {
          return ctx.socket.sendMessage(ctx.sender, {
            text: withFooter(`Usage: ${ctx.prefix}autoviewonce on|off|status`),
          }, { quoted: ctx.msg });
        }

        const updated = {
          ...ctx.userConfig,
          AUTO_VIEWONCE: action === 'on' ? 'true' : 'false',
        };

        await ctx.updateUserConfig(ctx.sanitizedNumber, updated);
        await ctx.socket.sendMessage(ctx.sender, {
          text: withFooter(`✅ AutoViewOnce ${action === 'on' ? 'enabled' : 'disabled'} successfully.`),
        }, { quoted: ctx.msg });
      },
    },
  ],
};
