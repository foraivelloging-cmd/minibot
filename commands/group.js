const {
  isIntroEnabled,
  isWelcomeEnabled,
  setIntroEnabled,
  setWelcomeEnabled,
  sendIntroMessage,
} = require('../handlers/groupWelcome');

function resolveTarget(ctx) {
  const mention = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  if (mention) return mention;

  const arg = (ctx.args[0] || '').replace(/[^0-9]/g, '');
  if (arg) return `${arg}@s.whatsapp.net`;

  const quoted = ctx.msg.message?.extendedTextMessage?.contextInfo?.participant;
  if (quoted) return quoted;

  return null;
}

module.exports = {
  category: 'group',
  emoji: '👥',
  description: 'Group moderation and onboarding',
  commands: [
    {
      name: 'kick', aliases: [], description: 'Remove a member', usage: '.kick @user', groupOnly: true, adminOnly: true, botAdminRequired: true,
      async execute(ctx) {
        const target = resolveTarget(ctx);
        if (!target) return ctx.socket.sendMessage(ctx.sender, { text: `Usage: ${ctx.prefix}kick @user` }, { quoted: ctx.msg });
        await ctx.socket.groupParticipantsUpdate(ctx.sender, [target], 'remove');
        await ctx.socket.sendMessage(ctx.sender, { text: '✅ User removed.' }, { quoted: ctx.msg });
      },
    },
    {
      name: 'promote', aliases: [], description: 'Promote member to admin', usage: '.promote @user', groupOnly: true, adminOnly: true, botAdminRequired: true,
      async execute(ctx) {
        const target = resolveTarget(ctx);
        if (!target) return ctx.socket.sendMessage(ctx.sender, { text: `Usage: ${ctx.prefix}promote @user` }, { quoted: ctx.msg });
        await ctx.socket.groupParticipantsUpdate(ctx.sender, [target], 'promote');
        await ctx.socket.sendMessage(ctx.sender, { text: '✅ User promoted.' }, { quoted: ctx.msg });
      },
    },
    {
      name: 'demote', aliases: [], description: 'Demote admin', usage: '.demote @user', groupOnly: true, adminOnly: true, botAdminRequired: true,
      async execute(ctx) {
        const target = resolveTarget(ctx);
        if (!target) return ctx.socket.sendMessage(ctx.sender, { text: `Usage: ${ctx.prefix}demote @user` }, { quoted: ctx.msg });
        await ctx.socket.groupParticipantsUpdate(ctx.sender, [target], 'demote');
        await ctx.socket.sendMessage(ctx.sender, { text: '✅ User demoted.' }, { quoted: ctx.msg });
      },
    },
    {
      name: 'hidetag', aliases: [], description: 'Mention all group members', usage: '.hidetag hello', groupOnly: true, adminOnly: true,
      async execute(ctx) {
        const meta = await ctx.socket.groupMetadata(ctx.sender);
        const mentions = meta.participants.map((p) => p.id);
        const text = ctx.args.join(' ') || '📣 Attention everyone!';
        await ctx.socket.sendMessage(ctx.sender, { text, mentions }, { quoted: ctx.msg });
      },
    },
    {
      name: 'intro', aliases: [], description: 'Manage group auto-intro', usage: '.intro on|off|send', groupOnly: true, adminOnly: true,
      async execute(ctx) {
        const action = (ctx.args[0] || '').toLowerCase();
        if (!['on', 'off', 'send'].includes(action)) {
          return ctx.socket.sendMessage(ctx.sender, { text: `Usage: ${ctx.prefix}intro on|off|send` }, { quoted: ctx.msg });
        }
        if (action === 'on') {
          setIntroEnabled(ctx.sender, true);
          return ctx.socket.sendMessage(ctx.sender, { text: '✅ Auto intro enabled for this group.' }, { quoted: ctx.msg });
        }
        if (action === 'off') {
          setIntroEnabled(ctx.sender, false);
          return ctx.socket.sendMessage(ctx.sender, { text: '✅ Auto intro disabled for this group.' }, { quoted: ctx.msg });
        }
        await sendIntroMessage(ctx.socket, ctx.sender, ctx.msg);
      },
    },
    {
      name: 'welcome', aliases: [], description: 'Toggle welcome messages', usage: '.welcome on|off', groupOnly: true, adminOnly: true,
      async execute(ctx) {
        const action = (ctx.args[0] || '').toLowerCase();
        if (!['on', 'off'].includes(action)) {
          const status = isWelcomeEnabled(ctx.sender) ? 'ON' : 'OFF';
          const intro = isIntroEnabled(ctx.sender) ? 'ON' : 'OFF';
          return ctx.socket.sendMessage(ctx.sender, {
            text: `Usage: ${ctx.prefix}welcome on|off\nCurrent welcome: *${status}*\nCurrent intro: *${intro}*`,
          }, { quoted: ctx.msg });
        }
        setWelcomeEnabled(ctx.sender, action === 'on');
        await ctx.socket.sendMessage(ctx.sender, { text: `✅ Welcome messages ${action === 'on' ? 'enabled' : 'disabled'}.` }, { quoted: ctx.msg });
      },
    },
  ],
};
