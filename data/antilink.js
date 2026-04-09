const mongoose = require('mongoose');
const config = require('../config');

const antilinkSchema = new mongoose.Schema({
    groupId: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: true }
});

const AntiLink = mongoose.model('AntiLink', antilinkSchema);

async function getAntiLink(groupId) {
    try {
        const record = await AntiLink.findOne({ groupId });
        return record ? record.enabled : (config.ANTI_LINK === 'true');
    } catch (error) {
        console.error('Error getting antilink status:', error);
        return false;
    }
}

async function setAntiLink(groupId, enabled) {
    try {
        await AntiLink.findOneAndUpdate(
            { groupId },
            { enabled },
            { upsert: true, new: true }
        );
        return true;
    } catch (error) {
        console.error('Error setting antilink status:', error);
        return false;
    }
}

async function getAllAntiLink() {
    try {
        const records = await AntiLink.find({});
        return records;
    } catch (error) {
        console.error('Error getting all antilink records:', error);
        return [];
    }
}

module.exports = {
    getAntiLink,
    setAntiLink,
    getAllAntiLink
};
