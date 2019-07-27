require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const flash = require('connect-flash');
const { sequelize } = require('./src/models');
const passport = require('passport');
const passportJWT = require('passport-jwt');
const passportConfig = require('./src/passport');
const indexRouter = require('./src/routes/index');
const apiRouter = require('./src/routes/v1');
const app = express();
const logger = require('./logger');
const helmet = require('helmet');
const hpp = require('hpp');
const loginCheck = require('./src/common/loginCheck');
const cors = require('cors');
//-> logger.info() console.info 대체 , logger.error() => console.error 대체

sequelize.sync();

// view engine setup
passportConfig(passport,passportJWT);

if(process.env.NODE_ENV === 'production'){  
  app.use(morgan('combined'));
  app.use(helmet()); //간혹 helmet 에서 iframe 막을 경우 iframe 허용하는 옵션 추가 하도록
  app.use(hpp());
  //hpp, helmet 은 보안 관련 모듈, 상용환경일때 추가 할 것
}else{ //기본값 development
  app.use(morgan('dev'));
}
app.use(express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'client')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(passport.initialize());
app.use(flash());
app.use(cors());
app.use('/', indexRouter);
app.use('/v1',loginCheck,apiRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500).json(
    {
      code: 500,
      response: "server error"
    }
  );
});

module.exports = app;


/*
*실행 전 npm audit 으로 취약점 확인
*취약점 발생 시 npm audit fix 실행
*실제 상용에서는 pm2를 이용하여 실행
- pm2 list -> 실행되고있는 프로세스 출력
- pm2 restart all -> 재시작
- pm2 monit -> 서버 전체적인 상황 모니터링
- pm2 kill -> 서버 kill
"start": "cross-env NODE_ENV=production PORT=80 pm2 start ./bin/www -i -1", 
  -> 상용 실행 명령어의 마지막 -i 는 멀티 프로세싱, 뒤의 숫자는 코어 갯수 0일떄 전체 코어 -1일때 전체코어 -1 만큼 실행

  코어 1개-> fork 모드 , 멀티코어 cluster 모드
  클라우드 환경에서는 console.log console.error 도 기록되지만, 아닐 경우를 위해 winston or log4js 설치

  nvm 모듈 (node version manager)
  -> win => npm i nvm 이 아닌 직접 설치파일 다운로드 받아서 설치 ㅎㅎ
  -> linux or mac => npm i n 
  - nvm install latest -> 최신 node , npm 설치 등등

  실행 -> cdn에서 manifest 가져 온 후 css, js 설정
*/