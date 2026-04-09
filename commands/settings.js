module.exports = {
  category: 'settings',
  emoji: '⚙️',
  description: 'Runtime setting toggles',
  commands: [
    {
      name: 'settings',
      aliases: ['config'],
      description: 'Show active settings',
      usage: '.settings',
      async execute(ctx) {
        const cfg = ctx.userConfig;
        const text = [
          '*⚙️ Current Settings*',
          `• Prefix: ${cfg.PREFIX || ctx.config.PREFIX}`,
          `• Mode: ${cfg.MODE || ctx.config.MODE}`,
          `• AntiCall: ${cfg.ANTICALL || ctx.config.ANTICALL}`,
          `• AntiLink: ${cfg.ANTI_LINK || ctx.config.ANTI_LINK}`,
        ].join('\n');
        await ctx.socket.sendMessage(ctx.sender, { text }, { quoted: ctx.msg });
      },
    },
    {
      name: 'anticall',
      aliases: [],
      description: 'Toggle anti-call',
      usage: '.anticall on|off',
      ownerOnly: true,
      async execute(ctx) {
        const state = (ctx.args[0] || '').toLowerCase();
        if (!['on', 'off'].includes(state)) {
          return ctx.socket.sendMessage(ctx.sender, { text: `Usage: ${ctx.prefix}anticall on|off` }, { quoted: ctx.msg });
        }

        const updated = { ...ctx.userConfig, ANTICALL: state === 'on' ? 'true' : 'false' };
        await ctx.updateUserConfig(ctx.sanitizedNumber, updated);
        await ctx.socket.sendMessage(ctx.sender, { text: `✅ Anti-call ${state === 'on' ? 'enabled' : 'disabled'}.` }, { quoted: ctx.msg });
      },
    },
  ],
};
