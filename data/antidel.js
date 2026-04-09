
const { DATABASE } = require('../lib/database');
const { DataTypes } = require('sequelize');
const config = require('../config');

const AntiDelDB = DATABASE.define('AntiDelete', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: false,
        defaultValue: 1,
    },
    gc_status: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    dm_status: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    status_status: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    tableName: 'antidelete',
    timestamps: false,
    hooks: {
        beforeCreate: record => { record.id = 1; },
        beforeBulkCreate: records => { records.forEach(record => { record.id = 1; }); },
    },
});

let isInitialized = false;

async function initializeAntiDeleteSettings() {
    if (isInitialized) return;
    try {
        await AntiDelDB.sync();
        
        await AntiDelDB.findOrCreate({
            where: { id: 1 },
            defaults: { 
                gc_status: config.ANTIDELETE === 'true',
                dm_status: config.ANTIDELETE === 'true',
                status_status: config.ANTIDELETE === 'true'
            },
        });
        
        isInitialized = true;
    } catch (error) {
        console.error('Error initializing anti-delete settings:', error);
    }
}

async function setAnti(type, status) {
    try {
        await initializeAntiDeleteSettings();
        const field = `${type}_status`;
        const [affectedRows] = await AntiDelDB.update({ [field]: status }, { where: { id: 1 } });
        return affectedRows > 0;
    } catch (error) {
        console.error('Error setting anti-delete status:', error);
        return false;
    }
}

async function getAnti(type) {
    try {
        await initializeAntiDeleteSettings();
        const record = await AntiDelDB.findByPk(1);
        const field = `${type}_status`;
        return record ? record[field] : false;
    } catch (error) {
        console.error('Error getting anti-delete status:', error);
        return false;
    }
}

async function setAllAnti(status) {
    try {
        await initializeAntiDeleteSettings();
        const [affectedRows] = await AntiDelDB.update({ 
            gc_status: status,
            dm_status: status,
            status_status: status
        }, { where: { id: 1 } });
        return affectedRows > 0;
    } catch (error) {
        console.error('Error setting all anti-delete statuses:', error);
        return false;
    }
}

async function getAllAnti() {
    try {
        await initializeAntiDeleteSettings();
        const record = await AntiDelDB.findByPk(1);
        return record ? {
            gc: record.gc_status,
            dm: record.dm_status,
            status: record.status_status
        } : { gc: false, dm: false, status: false };
    } catch (error) {
        console.error('Error getting anti-delete statuses:', error);
        return { gc: false, dm: false, status: false };
    }
}

module.exports = {
    AntiDelDB,
    initializeAntiDeleteSettings,
    setAnti,
    getAnti,
    setAllAnti,
    getAllAnti,
};
