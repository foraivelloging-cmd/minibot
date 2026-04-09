const fs = require('fs');
const path = require('path');
const {
  getGroupSettings,
  getChatSettings,
  updateChatSettings,
  addWarning,
  getViewOnceSettings,
  updateViewOnceSettings,
} = require('./database');
const { extractNumber, findParticipant } = require('./utils/jidHelper');
const { autoSaveViewOnce } = require('./handlers/viewonceHandler');

const commandMap = new Map();
const categories = new Map();

function walkCommands(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('_')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkCommands(full));
    else if (entry.isFile() && entry.name.endsWith('.js')) files.push(full);
  }
  return files;
}

function loadCommands(commandsRoot = path.join(__dirname, 'commands')) {
  commandMap.clear();
  categories.clear();

  const files = walkCommands(commandsRoot);
  for (const file of files) {
    delete require.cache[require.resolve(file)];
    const cmd = require(file);
    if (!cmd || !cmd.name || typeof cmd.execute !== 'function') {
      console.warn(`[HANDLER] Invalid command module skipped: ${file}`);
      continue;
    }

    const category = cmd.category || path.basename(path.dirname(file));
    cmd.category = category;
    categories.set(category, categories.get(category) || []);
    categories.get(category).push(cmd);

    const keys = [cmd.name, ...(cmd.aliases || [])].map((k) => String(k).toLowerCase());
    for (const key of keys) {
      commandMap.set(key, cmd);
    }
  }

  console.log(`[HANDLER] Loaded ${commandMap.size} command triggers from ${files.length} files.`);
  return { commandMap, categories };
}


function parseBool(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return fallback;
}

function getBody(msg = {}) {
  const m = msg.message || {};
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    ''
  );
}

async function buildExtra(sock, msg, commandName, config) {
  const from = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;
  const isGroup = from.endsWith('@g.us');
  const ownerNumber = String(config.ownerNumber || config.OWNER_NUMBER || '').replace(/[^0-9]/g, '');
  const isOwner = extractNumber(sender) === ownerNumber;

  let groupMetadata = null;
  let participants = [];
  let isAdmin = false;
  let isBotAdmin = false;

  if (isGroup) {
    try {
      groupMetadata = await sock.groupMetadata(from);
      participants = groupMetadata.participants || [];
      const senderParticipant = findParticipant(participants, sender);
      const botParticipant = findParticipant(participants, sock.user?.id || '');
      isAdmin = ['admin', 'superadmin'].includes(senderParticipant?.admin);
      isBotAdmin = ['admin', 'superadmin'].includes(botParticipant?.admin);
    } catch (err) {
      console.error('[HANDLER] Failed to load group metadata:', err.message);
    }
  }

  const reply = async (text, options = {}) => sock.sendMessage(from, { text, ...options }, { quoted: msg });
  const react = async (emoji) => sock.sendMessage(from, { react: { text: emoji, key: msg.key } });

  return {
    from,
    sender,
    reply,
    react,
    isGroup,
    isAdmin,
    isOwner,
    isBotAdmin,
    groupMetadata,
    participants,
    commandName,
  };
}

async function applyAutoModeration(sock, msg, config) {
  const body = getBody(msg);
  const from = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;
  if (!from || !from.endsWith('@g.us') || !body) return false;

  const settings = getGroupSettings(from);
  const ownerNumber = String(config.ownerNumber || config.OWNER_NUMBER || '').replace(/[^0-9]/g, '');
  if (extractNumber(sender) === ownerNumber) return false;

  let reason = '';
  const text = body.toLowerCase();
  if (settings.antilink && /(https?:\/\/|chat\.whatsapp\.com|wa\.me\/)/i.test(body)) reason = 'Sending links';
  if (!reason && settings.antibadword && settings.badWords.some((w) => text.includes(w))) reason = 'Using bad words';

  if (!reason && settings.antispam) {
    const chatState = getChatSettings(from);
    const now = Date.now();
    const senderTimes = chatState.lastMessages.get(sender) || [];
    const recent = senderTimes.filter((t) => now - t < 10000);
    recent.push(now);
    chatState.lastMessages.set(sender, recent);
    updateChatSettings(from, chatState);
    if (recent.length >= 6) reason = 'Spamming messages';
  }

  if (!reason && settings.antifake) {
    const number = extractNumber(sender);
    if (number.length < 11 || number.length > 15) reason = 'Fake number detected';
  }

  if (!reason) return false;

  try {
    await sock.sendMessage(from, { delete: msg.key });
  } catch (err) {
    console.error('[HANDLER] Delete failed:', err.message);
  }

  const warnings = addWarning(from, sender, reason);
  const maxWarnings = Number(config.maxWarnings || config.MAX_WARNINGS || 3);
  await sock.sendMessage(from, {
    text: `⚠️ @${extractNumber(sender)} warned for: *${reason}*
Warnings: *${warnings.length}/${maxWarnings}*`,
    mentions: [sender],
  });

  if (warnings.length >= maxWarnings) {
    try {
      await sock.groupParticipantsUpdate(from, [sender], 'remove');
      await sock.sendMessage(from, { text: `🚫 @${extractNumber(sender)} removed after exceeding warnings.`, mentions: [sender] });
    } catch (err) {
      console.error('[HANDLER] Kick failed:', err.message);
    }
  }

  return true;
}

async function handleIncoming(sock, msg, config = {}) {
  if (!msg?.message || !msg?.key?.remoteJid) return false;

  const currentVO = getViewOnceSettings();
  const mergedViewOnce = updateViewOnceSettings({
    autoSave: parseBool(config.autoSaveViewOnce || config.AUTO_SAVE_VIEWONCE, currentVO.autoSave),
    ownerOnly: parseBool(config.viewOnceOwnerOnly || config.VIEWONCE_OWNER_ONLY, currentVO.ownerOnly),
  });

  await autoSaveViewOnce(sock, msg, config, mergedViewOnce);

  if (await applyAutoModeration(sock, msg, config)) return true;

  const body = getBody(msg).trim();
  const prefix = config.prefix || config.PREFIX || '.';
  if (!body.startsWith(prefix)) return false;

  const [rawCmd, ...args] = body.slice(prefix.length).trim().split(/\s+/);
  const commandName = (rawCmd || '').toLowerCase();
  if (!commandName) return false;

  const command = commandMap.get(commandName);
  if (!command) return false;

  const extra = await buildExtra(sock, msg, commandName, config);

  if (command.groupOnly && !extra.isGroup) return extra.reply('❌ This command works only in groups.');
  if (command.ownerOnly && !extra.isOwner) return extra.reply('❌ Owner only command.');
  if (command.adminOnly && !extra.isAdmin && !extra.isOwner) return extra.reply('❌ Admin only command.');
  if (command.botAdminNeeded && extra.isGroup && !extra.isBotAdmin) return extra.reply('❌ Bot needs admin rights for this command.');

  try {
    await command.execute(sock, msg, args, extra, config);
  } catch (err) {
    console.error(`[HANDLER] Command ${command.name} failed:`, err);
    await extra.reply(`❌ Command error: ${err.message || 'Unknown error'}`);
  }

  return true;
}

loadCommands();

module.exports = {
  loadCommands,
  handleIncoming,
  commandMap,
  categories,
};
