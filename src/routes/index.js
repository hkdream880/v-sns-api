var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const loginCheck = require('../common/loginCheck');
/* GET home page. */
router.get('/', function(req, res, next) {
  res.status(200).json({
    date: "TBD",
    code: "200",
    response: "api server is ready"
  });
});


router.get('/login-check',loginCheck,(req, res, next)=>{
  //res.cookie('cookieName',randomNumber, { maxAge: 900000, httpOnly: true });
  res.status(200).json({
    code: 200,
    response: {
      userInfo: {
        email: req.user.email,
        phone: req.user.phone,
        profile: req.user.profile,
        id: req.user.id,
      }
    }
  });
});

router.post('/join', async (req, res, next )=>{
  try {
    const duplicateUser = await User.findAll({where: { email: req.body.email,deletedAt: null}})
    if(duplicateUser.length<=0){
      const hashPassword = await bcrypt.hash(req.body.password,10);
      await User.create({
        email: req.body.email,
        password: hashPassword,
        phone: req.body.phone,
      });
      return res.status(200).json({
        code: "200",
        response: "가입에 성공 하였습니다."
      });
    }else{
      return res.status(200).json({
        code: "400",
        response: "이미 존재하는 id 입니다."
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      data: error
    });
  }
});

router.post('/login',(req,res,next)=>{
  passport.authenticate('local',{session: false},(authError, user, info)=>{
    if(authError){
      console.error(authError);
      return next(authError);
    }
    if(!user){
      return res.status(200).json({
        code: 500,
        response: info.message
      });
    }
    return req.login(user,{session: false},(loginError)=>{
      if(loginError){
        console.error(loginError);
        return next(loginError);
      }
      //res.cookie('cookieName',randomNumber, { maxAge: 900000, httpOnly: true });
      return res.status(200).json({
        code: 200,
        response: {
          token: 'Bearer '+jwt.sign({
            email: user.email
          },process.env.JWT_SECRET,{
            expiresIn: '1h',
            issuer: 'v-sns'
          }),
          userInfo: {
            email: req.user.email,
            phone: req.user.phone,
            profile: req.user.profile,
            id: req.user.id,
          }   
        }
      });
    });
  })(req, res, next);
});

module.exports = router;
