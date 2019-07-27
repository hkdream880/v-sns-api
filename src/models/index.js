const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../../config/sequelize.config.js')[env];
const db = {};
const sequelize = new Sequelize(config.database, config.username, config.password, config);
db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.User = require('./user')(sequelize, Sequelize);
db.Contents = require('./contents')(sequelize, Sequelize);
db.HashTag = require('./hashTag')(sequelize, Sequelize);
db.Replies = require('./replies')(sequelize, Sequelize);
db.Chat = require('./chat')(sequelize, Sequelize);
db.Room = require('./room')(sequelize, Sequelize);

db.User.hasMany(db.Contents,{foreignKey:'userId', sourceKey:'id'});
db.Contents.belongsTo(db.User,{foreignKey:'userId', targetKey:'id'});

db.User.hasMany(db.Replies,{foreignKey:'userId', sourceKey:'id'});
db.Replies.belongsTo(db.User,{foreignKey:'userId', targetKey:'id'});

db.Contents.hasMany(db.Replies,{foreignKey:'contentId', sourceKey:'id'});
db.Replies.belongsTo(db.Contents,{foreignKey:'contentId', targetKey:'id'});

db.Contents.belongsToMany(db.User,{through: 'goods'});
db.User.belongsToMany(db.Contents,{through: 'goods'});

db.User.belongsToMany(db.User,{through: 'follows', foreignKey: 'followerId', as: 'Followings'});
db.User.belongsToMany(db.User,{through: 'follows', foreignKey: 'followingId', as: 'Followers'});

db.Contents.belongsToMany(db.HashTag,{through: 'hashContents'});
db.HashTag.belongsToMany(db.Contents,{through: 'hashContents'});

db.User.belongsToMany(db.Room,{through: 'roomUser'});
db.Room.belongsToMany(db.User,{through: 'roomUser'});
db.Room.belongsToMany(db.User,{through: 'roomUser', as: 'userForRoom'});

db.User.hasMany(db.Chat,{foreignKey:'userId', sourceKey:'id'});
db.Chat.belongsTo(db.User,{foreignKey:'userId', targetKey:'id'});

db.Room.hasMany(db.Chat,{foreignKey:'roomId', sourceKey:'id'});
db.Chat.belongsTo(db.Room,{foreignKey:'roomId', targetKey:'id'});

module.exports = db;