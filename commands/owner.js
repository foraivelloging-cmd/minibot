module.exports = {
  category: 'owner',
  emoji: '👑',
  description: 'Owner-only management commands',
  commands: [
    {
      name: 'owner',
      aliases: ['creator'],
      description: 'Show owner contact',
      usage: '.owner',
      async execute(ctx) {
        const number = ctx.config.OWNER_NUMBER;
        await ctx.socket.sendMessage(ctx.sender, {
          text: `👤 *Owner:* MUHAMMAD SAQIB\n📞 wa.me/${number}`,
        }, { quoted: ctx.msg });
      },
    },
    {
      name: 'mode',
      aliases: [],
      description: 'Set bot mode to public/private',
      usage: '.mode public|private',
      ownerOnly: true,
      async execute(ctx) {
        const mode = (ctx.args[0] || '').toLowerCase();
        if (!['public', 'private'].includes(mode)) {
          return ctx.socket.sendMessage(ctx.sender, { text: `Usage: ${ctx.prefix}mode public|private` }, { quoted: ctx.msg });
        }
        const updated = { ...ctx.userConfig, MODE: mode };
        await ctx.updateUserConfig(ctx.sanitizedNumber, updated);
        await ctx.socket.sendMessage(ctx.sender, { text: `✅ Mode updated to *${mode}*` }, { quoted: ctx.msg });
      },
    },
    {
      name: 'setprefix',
      aliases: ['prefix'],
      description: 'Change command prefix',
      usage: '.setprefix !',
      ownerOnly: true,
      async execute(ctx) {
        const newPrefix = (ctx.args[0] || '').trim();
        if (!newPrefix || newPrefix.length > 2) {
          return ctx.socket.sendMessage(ctx.sender, { text: `Usage: ${ctx.prefix}setprefix <1-2 chars>` }, { quoted: ctx.msg });
        }
        const updated = { ...ctx.userConfig, PREFIX: newPrefix };
        await ctx.updateUserConfig(ctx.sanitizedNumber, updated);
        await ctx.socket.sendMessage(ctx.sender, { text: `✅ Prefix changed to *${newPrefix}*` }, { quoted: ctx.msg });
      },
    },
  ],
};
