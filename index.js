const express = require('express');
const app = express();
__path = process.cwd()
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 5000;
let code = require('./pair');

require('events').EventEmitter.defaultMaxListeners = 500;

app.use('/code', code);
app.use('/pair', async (req, res, next) => {
    res.sendFile(__path + '/pair.html');
});
app.use('/', async (req, res, next) => {
    res.sendFile(__path + '/main.html');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//  binds on 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔════════════════════════════════════╗
║   BANDAHEALI MINI BOT     ║
║   CREATED BY TEAM-BANDAHEALI        ║
╚════════════════════════════════════╝

✅ Server running on http://0.0.0.0:${PORT}

📋 AVAILABLE COMMANDS:
  • .settings - View all bot settings and configurations
  • .autoreact on/off - Toggle auto reaction to messages
  • .yts <query> - YouTube search with metadata (top 10 results)
  • & <command> - Execute shell commands (owner only)
  • .anticall on/off - Toggle anti-call system
  • .mode public/private - Change bot mode
  • .setprefix <prefix> - Change command prefix
  • .antilink on/off - Enable/disable antilink in groups
  
🎨 CORE FEATURES:
  ✓ Multi-device support with MongoDB
  ✓ Shell system for developers
  ✓ Auto-reactions on messages
  ✓ YouTube search with rich metadata
  ✓ Anti-call, Anti-delete, Anti-edit systems
  ✓ Dynamic settings per user
  
💡 TIP: Type .settings to see all configuration options

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
});

module.exports = app;
