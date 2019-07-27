module.exports = (sequelize, DataTypes) => {
  return sequelize.define('reply',{
    reply: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  },{
    timestamp: true,
    paranoid: true,
    charset: 'utf8',
    collate: 'utf8_general_ci',
  });
};