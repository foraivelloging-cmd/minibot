const fs = require('fs');
const path = require('path');

function normalizeCommandEntry(entry, fileName) {
  if (!entry || typeof entry !== 'object') {
    throw new Error(`Invalid command entry in ${fileName}`);
  }

  const commands = Array.isArray(entry.commands) ? entry.commands : [];
  return {
    category: entry.category || path.basename(fileName, '.js'),
    emoji: entry.emoji || '🧩',
    description: entry.description || 'No description',
    commands,
  };
}

function loadCommandCategories() {
  const dir = __dirname;
  const files = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.js') && file !== 'index.js');

  const categories = [];
  for (const file of files) {
    try {
      const loaded = require(path.join(dir, file));
      categories.push(normalizeCommandEntry(loaded, file));
    } catch (error) {
      console.error(`[COMMAND_LOADER] Failed to load ${file}:`, error.message);
    }
  }

  return categories;
}

function createCommandRegistry(categories) {
  const byName = new Map();

  for (const category of categories) {
    for (const command of category.commands) {
      const names = [command.name, ...(command.aliases || [])]
        .filter(Boolean)
        .map((n) => n.toLowerCase());

      for (const name of names) {
        if (byName.has(name)) {
          console.warn(`[COMMAND_LOADER] Duplicate command alias "${name}" detected. Latest definition overrides previous.`);
        }

        byName.set(name, {
          ...command,
          category: category.category,
          categoryEmoji: category.emoji,
          categoryDescription: category.description,
        });
      }
    }
  }

  return byName;
}

function checkPermissions(command, context) {
  if (command.ownerOnly && !context.isOwner) {
    return '❌ This command is only available to the bot owner.';
  }

  if (command.groupOnly && !context.isGroup) {
    return '❌ This command can only be used in groups.';
  }

  if (command.adminOnly && !context.isAdmins && !context.isOwner) {
    return '❌ Only group admins can use this command.';
  }

  if (command.botAdminRequired && context.isGroup && !context.isBotAdmin) {
    return '❌ I need admin rights in this group to do that.';
  }

  return null;
}

async function executeCommand(commandName, context) {
  const command = context.commandRegistry.get(commandName.toLowerCase());
  if (!command) return false;

  const permissionError = checkPermissions(command, context);
  if (permissionError) {
    await context.socket.sendMessage(context.sender, { text: permissionError }, { quoted: context.msg });
    return true;
  }

  try {
    await command.execute(context);
  } catch (error) {
    console.error(`[COMMAND_HANDLER] ${command.name} failed:`, error);
    await context.socket.sendMessage(context.sender, {
      text: `❌ Command failed: ${error.message || 'Unknown error'}`,
    }, { quoted: context.msg });
  }

  return true;
}

const categories = loadCommandCategories();
const commandRegistry = createCommandRegistry(categories);

module.exports = {
  categories,
  commandRegistry,
  executeCommand,
  reloadCommands: () => {
    Object.keys(require.cache)
      .filter((key) => key.includes(`${path.sep}commands${path.sep}`))
      .forEach((key) => delete require.cache[key]);
    const refreshed = loadCommandCategories();
    return createCommandRegistry(refreshed);
  },
};
