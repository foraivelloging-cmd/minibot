const { getViewOnceSettings, updateViewOnceSettings } = require('../../database');

module.exports = {
  name: 'autoviewonce',
  aliases: ['autosavevo'],
  category: 'general',
  description: 'Toggle automatic owner-DM capture for view-once messages',
  usage: '.autoviewonce on/off',
  ownerOnly: true,
  async execute(sock, msg, args, extra) {
    try {
      const mode = (args[0] || '').toLowerCase();
      if (!['on', 'off'].includes(mode)) {
        const current = getViewOnceSettings();
        return extra.reply(`⚙️ Usage: .autoviewonce on/off\nCurrent: *${current.autoSave ? 'ON' : 'OFF'}*`);
      }

      const updated = updateViewOnceSettings({ autoSave: mode === 'on' });
      await extra.reply(`✅ Auto ViewOnce is now *${updated.autoSave ? 'ON' : 'OFF'}*.`);
    } catch (error) {
      await extra.reply(`❌ ${error.message}`);
    }
  },
};
