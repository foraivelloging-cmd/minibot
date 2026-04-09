
const { Sequelize } = require('sequelize');
const path = require('path');

const DATABASE = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../session/database.db'),
    logging: false
});

module.exports = { DATABASE };
