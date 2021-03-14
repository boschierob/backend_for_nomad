const { Sequelize, DataTypes, Model } = require('sequelize');
require('dotenv').config()

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    underscored: true,
    logging: false,
    define: {
       underscored: true,
    }
});

// let Article = require('./models/Article')(sequelize, DataTypes)



sequelize.sync({
    alter: true
})

module.exports = {
    sequelize: sequelize,
    // Article: Article,
}
