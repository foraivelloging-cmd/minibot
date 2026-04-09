module.exports = {
  category: 'downloader',
  emoji: '⬇️',
  description: 'Media downloader commands',
  commands: [
    {
      name: 'song',
      aliases: ['play'],
      description: 'Song downloader (starter placeholder)',
      usage: '.song <query>',
      async execute(ctx) {
        await ctx.socket.sendMessage(ctx.sender, {
          text: '🎵 Song command is wired to modular handler. Connect your existing downloader logic here.',
        }, { quoted: ctx.msg });
      },
    },
    {
      name: 'tiktok',
      aliases: ['tt'],
      description: 'TikTok downloader (starter placeholder)',
      usage: '.tiktok <url>',
      async execute(ctx) {
        await ctx.socket.sendMessage(ctx.sender, {
          text: '🎬 TikTok command is wired to modular handler. Connect your existing downloader logic here.',
        }, { quoted: ctx.msg });
      },
    },
  ],
};
