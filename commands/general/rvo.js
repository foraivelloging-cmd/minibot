const viewonceCommand = require('./viewonce');

module.exports = {
  name: 'rvo',
  aliases: [],
  category: 'general',
  description: 'Read view-once alias',
  usage: '.rvo (reply to view-once media)',
  async execute(sock, msg, args, extra, config) {
    try {
      await viewonceCommand.execute(sock, msg, args, { ...extra, commandName: 'rvo' }, config);
    } catch (error) {
      await extra.reply(`❌ ${error.message}`);
    }
  },
};
