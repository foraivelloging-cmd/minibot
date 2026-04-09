const viewonceCommand = require('./viewonce');

module.exports = {
  name: 'vv',
  aliases: [],
  category: 'general',
  description: 'Quick alias for viewonce',
  usage: '.vv (reply to view-once media)',
  async execute(sock, msg, args, extra, config) {
    try {
      await viewonceCommand.execute(sock, msg, args, { ...extra, commandName: 'vv' }, config);
    } catch (error) {
      await extra.reply(`❌ ${error.message}`);
    }
  },
};
