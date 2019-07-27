module.exports = (sequelize, DataTypes) => {
  return sequelize.define('content',{
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    good: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    }
  },{
    timestamp: true,
    paranoid: true,
    charset: 'utf8',
    collate: 'utf8_general_ci',
  });
};