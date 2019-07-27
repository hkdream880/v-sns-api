const passport = require('passport');
const loginCheck = (req,res,next)=>{
  passport.authenticate('jwt',{ session: false },(info, user, authError)=>{
    if(authError){
      return res.status(200).json({
        code: 401,
        response: authError
      });
    }
    if(info){
      console.info(info);
    }
    req.user = user; 
    next();
  })(req, res, next);
};

module.exports = loginCheck;