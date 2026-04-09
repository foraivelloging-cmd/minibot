function extractNumber(jid = '') {
  return String(jid).split('@')[0].replace(/[^0-9]/g, '');
}

function isLidFormat(jid = '') {
  return typeof jid === 'string' && /@lid$/.test(jid);
}

function getParticipantLid(participant = {}) {
  if (!participant) return null;
  return participant.lid || (isLidFormat(participant.id) ? participant.id : null);
}

function findParticipant(participants = [], target = '') {
  const targetNumber = extractNumber(target);
  return participants.find((p) => {
    const pId = p.id || p.jid || '';
    const pPn = p.phoneNumber || '';
    return pId === target || pPn === target || extractNumber(pId) === targetNumber || extractNumber(pPn) === targetNumber;
  }) || null;
}

module.exports = {
  findParticipant,
  extractNumber,
  isLidFormat,
  getParticipantLid,
};
