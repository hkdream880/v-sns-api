const { User } = require('../models');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const passportJWT = require('passport-jwt');
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

module.exports = (passport)=>{
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
  },async (email, password, done)=>{
    try {
      const exUser = await User.findOne({where : { email ,deletedAt: null}});
      if(exUser){
          const result = await bcrypt.compare(password, exUser.password);
          if(result){
            done(null, exUser);
          }else{
            done(null, false ,{ message: 'id 또는 비밀번호가 잘못되었습니다.'});    
          }
      }else{
        done(null, false ,{ message: '가입되지 않은 회원입니다. '});
      }
    } catch (error) {
      console.error(error);
      done(error);
    }
  }));

  passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey   : process.env.JWT_SECRET
  },async (jwtPayload, done)=>{
    try {
      const exUser = await User.findOne({where : { email: jwtPayload.email ,deletedAt: null}});
      if(exUser){
        done(null, exUser);
      }else{
        done(null, false);
      }
    } catch (error) {
      console.error(error);
      done(error);
    }
  }
  ));
};