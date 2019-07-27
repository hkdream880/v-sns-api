require('dotenv').config();
module.exports = 
{
  "development": {
    "username": "root",
    "password": process.env.SEQUELIZE_PASSWORD,
    "database": "v_sns",
    "host": "127.0.0.1",
    "dialect": "mysql",
    "operatorsAliases": "false"
  },
  "test": {
    "username": "root",
    "password": process.env.SEQUELIZE_PASSWORD,
    "database": "v_sns",
    "host": "127.0.0.1",
    "dialect": "mysql",
    "operatorsAliases": "false"
  },
  "production": {
    "username": "root",
    "password": process.env.SEQUELIZE_PASSWORD,
    "database": "v_sns",
    "host": "127.0.0.1",
    "dialect": "mysql",
    "operatorsAliases": "false",
    "logging":false,  //sequelize sql log를 남기지 않도록
  }
};
//각자 필요에 따라 설정 할 것