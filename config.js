require("dotenv").config();

const parseList = (envVar, fallback) => {
  if (!envVar) return fallback;
  try {
    return JSON.parse(envVar);
  } catch {
    return envVar
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
};

module.exports = {
  // MongoDB configuration for storing sessions
  MONGODB_URI: process.env.MONGODB_URI || "",
  
  // Bot behavior (these are defaults, can be overridden per-user in DB)
  AUTO_VIEW_STATUS: process.env.AUTO_VIEW_STATUS || 'true',
  AUTO_LIKE_STATUS: process.env.AUTO_LIKE_STATUS || 'true',
  AUTO_RECORDING: process.env.AUTO_RECORDING || 'false',
  ANTICALL: process.env.ANTICALL || 'true',
  ANTIEDIT: process.env.ANTIEDIT || 'true',
  ANTIDELETE: process.env.ANTIDELETE || 'true',
  ANTI_LINK: process.env.ANTI_LINK || 'true',
  AUTO_LIKE_EMOJI: parseList(process.env.AUTO_LIKE_EMOJI, ['💋', '🍬', '💗', '🎈', '🎉', '🥳', '❤️']),
  PREFIX: process.env.PREFIX || '.',
  MODE: process.env.MODE || 'public', // public or private
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || '3', 10),

  // Paths
  ADMIN_LIST_PATH: process.env.ADMIN_LIST_PATH || "./admin.json",
  SESSION_BASE_PATH: process.env.SESSION_BASE_PATH || "./session",
  NUMBER_LIST_PATH: process.env.NUMBER_LIST_PATH || "./numbers.json",

  // Images / UI
  RCD_IMAGE_PATH:
    process.env.RCD_IMAGE_PATH || "https://bandaheali-cdn.koyeb.app/bandaheali/profile.jpg",
  CAPTION: process.env.CAPTION || "BANDAHEALI-MINI",

  // Newsletter / channels
  NEWSLETTER_JID: (
    process.env.NEWSLETTER_JID || "120363315182578784@newsletter"
  ).trim(),
  CHANNEL_LINK:
    process.env.CHANNEL_LINK ||
    "https://whatsapp.com/channel/0029VajGHyh2phHOH5zJl73P",

  // OTP & owner
  OTP_EXPIRY: parseInt(process.env.OTP_EXPIRY || "300000", 10), // ms
  OWNER_NUMBER: process.env.OWNER_NUMBER || "923253617422",
  DEV: process.env.DEV || '923253617422',

  // Telegram Bot Configuration
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
  TELEGRAM_OWNER_ID: process.env.TELEGRAM_OWNER_ID || "",

  // Misc
  GROUP_INVITE_LINK:
    process.env.GROUP_INVITE_LINK ||
    "https://chat.whatsapp.com/Eg1xSqB63jn8FuyWqFnc5S",
  PM2_NAME: process.env.PM2_NAME || "Bandaheali",
};
