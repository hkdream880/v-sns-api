module.exports = (sequelize, DataTypes) => {
  return sequelize.define('hashtag',{
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    }
  },{
    timestamp: true,
    paranoid: true,
    charset: 'utf8',
    collate: 'utf8_general_ci',
  });
};