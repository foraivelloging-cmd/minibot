const groupSettings = new Map();
const chatSettings = new Map();
const warningStore = new Map();

const viewOnceSettings = {
  autoSave: false,
  ownerOnly: false,
};

const defaultGroupSettings = {
  welcome: false,
  goodbye: false,
  antilink: false,
  antibadword: false,
  antibot: false,
  antifake: false,
  antispam: false,
  antiviewonce: false,
  autosticker: false,
  welcomeMessage: '✨ Welcome @user to @group!',
  goodbyeMessage: '👋 Goodbye @user from @group!',
  badWords: ['fuck', 'shit', 'bitch', 'asshole'],
};

const defaultChatSettings = {
  muted: false,
  lastMessages: new Map(),
};

function cloneGroupSettings(settings) {
  return { ...defaultGroupSettings, ...(settings || {}) };
}

function cloneChatSettings(settings) {
  const merged = { ...defaultChatSettings, ...(settings || {}) };
  if (!(merged.lastMessages instanceof Map)) merged.lastMessages = new Map();
  return merged;
}

function getGroupSettings(groupId) {
  if (!groupSettings.has(groupId)) {
    groupSettings.set(groupId, cloneGroupSettings());
  }
  return cloneGroupSettings(groupSettings.get(groupId));
}

function updateGroupSettings(groupId, settings = {}) {
  const current = getGroupSettings(groupId);
  const updated = cloneGroupSettings({ ...current, ...settings });
  groupSettings.set(groupId, updated);
  return updated;
}

function getChatSettings(chatId) {
  if (!chatSettings.has(chatId)) {
    chatSettings.set(chatId, cloneChatSettings());
  }
  return cloneChatSettings(chatSettings.get(chatId));
}

function updateChatSettings(chatId, settings = {}) {
  const current = getChatSettings(chatId);
  const updated = cloneChatSettings({ ...current, ...settings });
  chatSettings.set(chatId, updated);
  return updated;
}

function getWarningBucket(groupId) {
  if (!warningStore.has(groupId)) warningStore.set(groupId, new Map());
  return warningStore.get(groupId);
}

function addWarning(groupId, userId, reason = 'No reason') {
  const bucket = getWarningBucket(groupId);
  const warnings = bucket.get(userId) || [];
  warnings.push({ reason, timestamp: Date.now() });
  bucket.set(userId, warnings);
  return warnings;
}

function removeWarning(groupId, userId) {
  const bucket = getWarningBucket(groupId);
  const warnings = bucket.get(userId) || [];
  warnings.pop();
  bucket.set(userId, warnings);
  return warnings;
}

function getWarnings(groupId, userId) {
  return [...(getWarningBucket(groupId).get(userId) || [])];
}

function clearWarnings(groupId, userId) {
  const bucket = getWarningBucket(groupId);
  bucket.delete(userId);
  return true;
}


function getViewOnceSettings() {
  return { ...viewOnceSettings };
}

function updateViewOnceSettings(settings = {}) {
  if (typeof settings.autoSave === 'boolean') viewOnceSettings.autoSave = settings.autoSave;
  if (typeof settings.ownerOnly === 'boolean') viewOnceSettings.ownerOnly = settings.ownerOnly;
  return getViewOnceSettings();
}

module.exports = {
  getGroupSettings,
  updateGroupSettings,
  getChatSettings,
  updateChatSettings,
  addWarning,
  removeWarning,
  getWarnings,
  clearWarnings,
  getViewOnceSettings,
  updateViewOnceSettings,
  defaultGroupSettings,
};
