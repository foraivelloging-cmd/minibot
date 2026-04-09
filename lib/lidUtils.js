const isLidFormat = (jid) => {
    return jid && typeof jid === 'string' && jid.endsWith('@lid');
};

const isPnFormat = (jid) => {
    return jid && typeof jid === 'string' && jid.endsWith('@s.whatsapp.net');
};

const isGroupJid = (jid) => {
    return jid && typeof jid === 'string' && jid.endsWith('@g.us');
};

const extractNumber = (jid) => {
    if (!jid) return null;
    return jid.split('@')[0].split(':')[0];
};

const cleanPN = (phoneNumber) => {
    if (!phoneNumber) return null;
    return phoneNumber.split(':')[0];
};

const lidToPhone = async (socket, jid) => {
    try {
        if (!jid) return null;
        if (!jid.includes('@lid')) {
            return extractNumber(jid);
        }
        
        try {
            const phoneNumber = await socket.getNumber(jid);
            if (phoneNumber) {
                return cleanPN(phoneNumber);
            }
        } catch (e) {
            // Fallback if getNumber fails
        }
        
        return extractNumber(jid);
    } catch (error) {
        console.error('Error converting LID to phone:', error);
        return extractNumber(jid);
    }
};

const isLidJid = (jid) => {
    return jid && typeof jid === 'string' && jid.includes('@lid');
};

const normalizeJid = (jid) => {
    if (!jid) return null;
    const number = extractNumber(jid);
    return number + '@s.whatsapp.net';
};

const findParticipant = (participants, targetId) => {
    if (!participants || !Array.isArray(participants) || !targetId) return null;
    
    const targetNumber = extractNumber(targetId);
    
    for (const p of participants) {
        if (p.id === targetId) return p;
        if (p.lid && p.lid === targetId) return p;
        if (p.pn && p.pn === targetId) return p;
        if (p.phoneNumber && p.phoneNumber === targetId) return p;
        
        const pIdNumber = extractNumber(p.id);
        const pLidNumber = p.lid ? extractNumber(p.lid) : null;
        const pPnNumber = p.pn ? extractNumber(p.pn) : null;
        const pPhoneNumber = p.phoneNumber ? extractNumber(p.phoneNumber) : null;
        
        if (pIdNumber === targetNumber || pLidNumber === targetNumber || 
            pPnNumber === targetNumber || pPhoneNumber === targetNumber) {
            return p;
        }
    }
    
    return null;
};

const findParticipantByNumber = (participants, number) => {
    if (!participants || !Array.isArray(participants) || !number) return null;
    
    const cleanNumber = number.replace(/[^0-9]/g, '');
    
    for (const p of participants) {
        const pIdNumber = extractNumber(p.id);
        const pPnNumber = p.pn ? extractNumber(p.pn) : null;
        
        if (pIdNumber === cleanNumber || pPnNumber === cleanNumber) {
            return p;
        }
    }
    
    return null;
};

const getParticipantLid = (participant) => {
    if (!participant) return null;
    if (isLidFormat(participant.id)) {
        return participant.id;
    }
    return participant.lid || participant.id;
};

const getParticipantPn = (participant) => {
    if (!participant) return null;
    if (isPnFormat(participant.id)) {
        return participant.id;
    }
    return participant.pn || participant.phoneNumber || null;
};

const getParticipantDisplayNumber = (participant) => {
    if (!participant) return 'Unknown';
    const pn = getParticipantPn(participant);
    if (pn) return extractNumber(pn);
    return extractNumber(participant.id);
};

const isParticipantAdmin = (participant) => {
    if (!participant) return false;
    return participant.admin === 'admin' || participant.admin === 'superadmin';
};

const isParticipantSuperAdmin = (participant) => {
    if (!participant) return false;
    return participant.admin === 'superadmin';
};

const resolveTargetForGroupAction = async (socket, groupJid, targetId, participants = null) => {
    try {
        if (!participants) {
            const metadata = await socket.groupMetadata(groupJid);
            participants = metadata.participants;
        }
        
        const participant = findParticipant(participants, targetId);
        if (!participant) {
            return targetId;
        }
        return participant.id;
    } catch (error) {
        console.error('Error resolving target for group action:', error);
        return targetId;
    }
};

const resolveMentionsToLids = (mentionedJids, participants) => {
    if (!mentionedJids || !Array.isArray(mentionedJids)) return [];
    if (!participants || !Array.isArray(participants)) return mentionedJids;
    
    return mentionedJids.map(jid => {
        const participant = findParticipant(participants, jid);
        if (participant) {
            return participant.id;
        }
        return jid;
    });
};

const getSenderIdentifier = (msg, socket) => {
    const key = msg.key;
    if (!key) return null;
    
    if (key.participant) {
        return key.participant;
    }
    if (key.participantAlt) {
        return key.participantAlt;
    }
    if (key.fromMe) {
        return socket.user.id;
    }
    return key.remoteJid;
};

const getBotIdentifierForGroup = async (socket, groupJid) => {
    try {
        const metadata = await socket.groupMetadata(groupJid);
        const botNumber = extractNumber(socket.user.id);
        
        for (const p of metadata.participants) {
            const pNumber = extractNumber(p.id);
            const pPnNumber = p.pn ? extractNumber(p.pn) : null;
            
            if (pNumber === botNumber || pPnNumber === botNumber) {
                return p.id;
            }
        }
        return socket.user.id;
    } catch (error) {
        console.error('Error getting bot identifier for group:', error);
        return socket.user.id;
    }
};

const createLidMapping = (participants) => {
    const mapping = new Map();
    
    if (!participants || !Array.isArray(participants)) return mapping;
    
    for (const p of participants) {
        const idNumber = extractNumber(p.id);
        const lidNumber = p.lid ? extractNumber(p.lid) : null;
        const pnNumber = p.pn ? extractNumber(p.pn) : null;
        const phoneNumber = p.phoneNumber ? extractNumber(p.phoneNumber) : null;
        
        const displayNumber = pnNumber || phoneNumber || lidNumber || idNumber;
        
        const entry = {
            id: p.id,
            lid: p.lid || (isLidFormat(p.id) ? p.id : null),
            pn: p.pn || p.phoneNumber || (isPnFormat(p.id) ? p.id : null),
            number: displayNumber,
            admin: p.admin || null,
            isAdmin: isParticipantAdmin(p),
            isSuperAdmin: isParticipantSuperAdmin(p)
        };
        
        mapping.set(p.id, entry);
        
        if (p.lid && p.lid !== p.id) {
            mapping.set(p.lid, entry);
        }
        if (p.pn) {
            mapping.set(p.pn, entry);
        }
        if (p.phoneNumber) {
            mapping.set(p.phoneNumber, entry);
        }
        if (idNumber) {
            mapping.set(idNumber, entry);
            mapping.set(idNumber + '@s.whatsapp.net', entry);
        }
        if (lidNumber && lidNumber !== idNumber) {
            mapping.set(lidNumber, entry);
        }
        if (pnNumber && pnNumber !== idNumber) {
            mapping.set(pnNumber, entry);
            mapping.set(pnNumber + '@s.whatsapp.net', entry);
        }
    }
    
    return mapping;
};

module.exports = {
    isLidFormat,
    isPnFormat,
    isGroupJid,
    extractNumber,
    normalizeJid,
    cleanPN,
    lidToPhone,
    isLidJid,
    findParticipant,
    findParticipantByNumber,
    getParticipantLid,
    getParticipantPn,
    getParticipantDisplayNumber,
    isParticipantAdmin,
    isParticipantSuperAdmin,
    resolveTargetForGroupAction,
    resolveMentionsToLids,
    getSenderIdentifier,
    getBotIdentifierForGroup,
    createLidMapping
};
