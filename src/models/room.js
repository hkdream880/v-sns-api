module.exports = (sequelize, DataTypes) => {
  return sequelize.define('room',{
    
  },{
    timestamp: true,
    paranoid: true,
    charset: 'utf8',
    collate: 'utf8_general_ci',
  });
};