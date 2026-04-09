module.exports = {
  category: 'ai',
  emoji: '🤖',
  description: 'AI assistant commands',
  commands: [
    {
      name: 'ai',
      aliases: ['ask'],
      description: 'AI assistant command (starter)',
      usage: '.ai <prompt>',
      async execute(ctx) {
        const prompt = ctx.args.join(' ');
        if (!prompt) {
          return ctx.socket.sendMessage(ctx.sender, { text: `Usage: ${ctx.prefix}ai <prompt>` }, { quoted: ctx.msg });
        }
        await ctx.socket.sendMessage(ctx.sender, {
          text: `🤖 AI module received: "${prompt}"\nConnect your existing AI logic in commands/ai.js`,
        }, { quoted: ctx.msg });
      },
    },
  ],
};
