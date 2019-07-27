module.exports = (sequelize, DataTypes) => {
  return sequelize.define('chat',{
    chat: {
      type: DataTypes.TEXT,
      allowNull: false,
    }
  },{
    timestamp: true,
    paranoid: true,
    charset: 'utf8',
    collate: 'utf8_general_ci',
  });
};