const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const schedule = require('node-schedule');

const {Good, Auction, User, sequelize } = require('../models');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');

const router = express.Router();

router.use((req, res, next)=>{
  res.locals.user = req.user;
  next();
});

router.get('/',async (req, res, next)=>{
  try {
    const goods = await Good.findAll({where : {soldId : null }});
    res.render('main',{
      title: 'NodeAuction',
      goods,
      loginError: req.flash('loginError'),
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/join',isNotLoggedIn,(req,res)=>{
  res.render('join',{
    title: '회원가입 - NodeAuction',
    joinError: req.flash('joinError'),
  });
});

router.get('/good',isLoggedIn, (req,res)=>{
  res.render('good',{title: '상품등록 - NodeAuction'});
});

fs.readdir('uploads',(error)=>{
  if(error){
    console.error('uploades폴더가 없어 uploads 폴더 생성');
    fs.mkdirSync('uploads');
  }
});
const upload = multer({
  storage: multer.diskStorage({
    destination(req,file,cb){
      cb(null,'uploads/');
    },
    filename(req,file,cb){
      const ext = path.extname(file.originalname);
      cb(null,path.basename(file.originalname, ext) + new Date().valueOf() + ext);
    },
  }),
  limits: { fieldSize: 5 * 1024 * 1024 },
});

router.post('/good',isLoggedIn, upload.single('img'),async (req,res,next)=>{
  try {
    const { name, price } = req.body;
    const good = await Good.create({
      ownerId: req.user.id,
      name,
      end: req.body.end,
      price,
      img: req.file.filename,
    });
    const end = new Date();
    end.setHours(end.getHours() + good);
    //서버 메모리에 스케쥴이 저장된다. 때문에 서버가 죽으면 스케쥴은 날아간다.
    //이런 부분은 서버가 시작 될 때 해당 부분에 대한 검사가 필요하다. => checkAuction.js
     schedule.scheduleJob(end, async () => {
       const success = await Auction.find({
         where : { goodId: good.id},
         order: [['bid','DESC']],
       });
       if(success){
        await Good.update({soldId: success.userId},{where: {id: good.id }});
        await User.update({
          //계산 관련 부분은 sequelize 에서 지원 하지 않기 때문에 sql을 입력
          money: sequelize.literal(`money - ${success.bid}`),
        },{
          where: { id : success.userId },
        });
       }else{
        await Good.update({soldId: target.ownerId},{where:{ id: target.id}});
       }
     });
    res.redirect('/');
  } catch (error) {
    console.error(error);
    next(error);
  }
})

router.get('/good/:id',isLoggedIn,async (req,res,next)=>{
  try {
    const [good, auction ] = await Promise.all([
      Good.find({
        where:{ id: req.params.id },
        include: {
          model: User,
          as: 'owner',
        },
      }),
      Auction.findAll({
        where: { goodId : req.params.id },
        include : {model: User},
        order: [['bid','ASC']],
      }),
    ]);
    res.render('auction',{
      title: `${good.name} - NodeAuction`,
      good,
      auction,
      auctionError: req.flash('auctionError'),
    })
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post('/good/:id/bid',isLoggedIn, async (req,res,next)=>{
  try {
    const { bid, msg } = req.body;
    const good = await Good.find({
      where : { id: req.params.id },
      include : { model: Auction },
      order: [[{model: Auction}, 'bid','DESC']],
    });
    //시작가격보다 낮게 입찰 할 경우
    if(good.price > bid) {  
      return res.status(403).send('시작가격보다 높게 입찰해야 합니다.');
    }
    //경매 종료 시간이 지났으면
    if(new Date(good.createdAt).valueOf()+(24*60*60*1000)<new Date()){
      return res.status(403).send('경매가 이미 종료되었습니다.');
    }
    //직전 입찰가와 현재 입찰가 비교
    if(good.auctions[0] && good.auctions[0].bid >=bid){
      return res.status(403).send('이전 입찰가보다 높아야 합니다.');
    }
    //경매 등록자 예외
    if(good.ownerId === req.user.id){
      return res.status(403).send('경매 등록자는 입찰할 수 없습니다.');
    }
    const result = await Auction.create({
      bid,
      msg,
      userId : req.user.id,
      goodId: req.params.id,
    })
    req.app.get('io').to(req.params.id).emit('bid',{
      bid: result.bid,
      msg: result.msg,
      nick: req.user.nick,
    });
    return res.send('ok');
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

router.get('/list',isLoggedIn, async (req,res,next)=>{
  try {
    const goods = await Good.findAll({
      where: { soldId: req.user.id },
      include: { model: Auction },
      order: [[{model:Auction}, 'bid', 'DESC']],
    })
    res.render('list',{
      title: '낙찰목록 - NodeAuction',
      goods,
    })
  } catch (error) {
    console.error(error);
    next(error);
  }
})

module.exports = router;