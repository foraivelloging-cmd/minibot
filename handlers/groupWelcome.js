const introSettings = new Map();
const welcomeSettings = new Map();

const INTRO_MESSAGE = `──────────────────╮
👤 MUHAMMAD SAQIB
✨ Saqib Visuals
│
🎨 Creative Content Creator & Visual Artist
│
━━━━━━━━━━━━━━━━━━━
│
📍 Location: Faisalabad, Pakistan
🎂 Age: 17 Years
│
📞 Phone: +92 347 8936242
📧 Email: mrsaqib242242@gmail.com
│
🌐 Website:
https://mrsaqib.vercel.app/
│
━━━━━━━━━━━━━━━━━━━
│
🚀 About Me
Passionate about technology, creativity, and digital content.
│
━━━━━━━━━━━━━━━━━━━
│
🔥 Let's Connect & Create!
│
╰──────────────────╯

© 💙 Powered By MUHAMMAD SAQIB ❤️ッ

text`;

const INTRO_IMAGE_URL = 'https://mrsaqib.vercel.app/profile.jpg';

function isIntroEnabled(groupId) {
  return introSettings.get(groupId) === true;
}

function setIntroEnabled(groupId, enabled) {
  introSettings.set(groupId, Boolean(enabled));
  return introSettings.get(groupId);
}

function isWelcomeEnabled(groupId) {
  return welcomeSettings.get(groupId) === true;
}

function setWelcomeEnabled(groupId, enabled) {
  welcomeSettings.set(groupId, Boolean(enabled));
  return welcomeSettings.get(groupId);
}

async function sendIntroMessage(socket, jid, quoted) {
  await socket.sendMessage(jid, {
    image: { url: INTRO_IMAGE_URL },
    caption: INTRO_MESSAGE,
  }, quoted ? { quoted } : undefined);
}

async function handleGroupParticipantsUpdate(socket, update) {
  const { id: groupId, participants = [], action } = update;
  if (!groupId || !Array.isArray(participants)) return;

  try {
    const botJid = socket.user?.id ? `${socket.user.id.split(':')[0]}@s.whatsapp.net` : null;

    if (action === 'add') {
      const botAdded = botJid && participants.includes(botJid);
      if (botAdded) {
        console.log(`[GROUP_WELCOME] Bot added to ${groupId}. Sending intro.`);
        await sendIntroMessage(socket, groupId);
        return;
      }

      const shouldWelcome = isWelcomeEnabled(groupId);
      const shouldIntro = isIntroEnabled(groupId);

      for (const member of participants) {
        if (shouldWelcome) {
          const userTag = `@${member.split('@')[0]}`;
          await socket.sendMessage(groupId, {
            text: `✨ Welcome ${userTag} to the group!`,
            mentions: [member],
          });
        }

        if (shouldIntro) {
          await sendIntroMessage(socket, groupId);
        }
      }
    }
  } catch (error) {
    console.error('[GROUP_WELCOME] Failed handling participant update:', error.message);
  }
}

module.exports = {
  INTRO_MESSAGE,
  INTRO_IMAGE_URL,
  isIntroEnabled,
  isWelcomeEnabled,
  setIntroEnabled,
  setWelcomeEnabled,
  sendIntroMessage,
  handleGroupParticipantsUpdate,
};
