module.exports = {
  category: 'main',
  emoji: '🏠',
  description: 'Core bot commands',
  commands: [
    {
      name: 'menu',
      aliases: ['help'],
      description: 'Show command categories and starter command list',
      usage: '.menu',
      async execute(ctx) {
        const sections = ctx.categories
          .map((cat) => `${cat.emoji} *${cat.category}*\n${cat.description}`)
          .join('\n\n');

        const text = `*📋 ${ctx.config.CAPTION} COMMAND MENU*\n\n${sections}\n\nPrefix: *${ctx.prefix}*`;
        await ctx.socket.sendMessage(ctx.sender, {
          text,
          footer: 'Choose an option below',
          buttons: [
            { buttonId: `${ctx.prefix}ping`, buttonText: { displayText: 'Ping' }, type: 1 },
            { buttonId: `${ctx.prefix}alive`, buttonText: { displayText: 'Alive' }, type: 1 },
            { buttonId: `${ctx.prefix}owner`, buttonText: { displayText: 'Owner' }, type: 1 },
          ],
          headerType: 1,
        }, { quoted: ctx.msg });
      },
    },
    {
      name: 'ping',
      aliases: ['pong'],
      description: 'Check bot response speed',
      usage: '.ping',
      async execute(ctx) {
        const start = Date.now();
        await ctx.socket.sendMessage(ctx.sender, { text: '🏓 Testing latency...' }, { quoted: ctx.msg });
        const ms = Date.now() - start;
        await ctx.socket.sendMessage(ctx.sender, { text: `✅ Pong: *${ms}ms*` }, { quoted: ctx.msg });
      },
    },
    {
      name: 'alive',
      aliases: [],
      description: 'Check whether bot is online',
      usage: '.alive',
      async execute(ctx) {
        await ctx.socket.sendMessage(ctx.sender, {
          text: `✅ *Bot is running*\nMode: *${ctx.userConfig.MODE || ctx.config.MODE}*\nPrefix: *${ctx.prefix}*`,
        }, { quoted: ctx.msg });
      },
    },
  ],
};
