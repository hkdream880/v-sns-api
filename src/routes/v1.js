const express = require('express');
const router = express.Router();
const path = require('path');
const { User, Contents, HashTag, Replies, Room, Chat, sequelize, Sequelize } = require('../models');
const queryOption = require('sequelize').Op;
const multer = require('multer');
const fs = require('fs');
const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb){
      cb(null, 'uploads/')
    },
    filename(req, file, cb){
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + new Date().valueOf() + ext);
    }
  }),
  limits: {fieldSize : 5 * 1024 * 1024 }  //5mb 로 용량 제한
});

fs.readdir('uploads',(error)=>{
  if(error){
    console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
    fs.mkdirSync('uploads');
  }
});



router.post('/write',upload.single('image'),async (req, res, next)=>{
  /*
    tag 업을경우 contents 만 입력
    tag 있을경우 tag, tagContents 입력
  */
 try {
  let snsObj = {
    content: req.body.content,
    userId: req.user.id
  };
  if(req.file){
    snsObj.image = req.file.filename;
  }
  const content = await Contents.create(snsObj);

  if(req.body.hashTag){ //tag 있을경우
    const tagArr = req.body.hashTag.split(',')
    //태그 찾아서 없을 경우 생성
    const tagResult = await Promise.all(tagArr.map(tag=>HashTag.findOrCreate({
      where : { name : tag.toLowerCase()}
    })));
    
    //태그와 컨텐츠 연결
    //** 다대다 관계일 때 add + '대상 테이블 이름'() 호출 하면 중간 연결 테이블에 값 생성 된다.
    //await content.addHashtags(tagResult.map(r => r[0]));
    await tagResult.forEach((data)=>{
      content.addHashtags(data[0]);
    })
  }
  res.status(200).json({
    code: 200,
    data: content,
  });
 } catch (error) {
   console.error(error);
   next(error);
 }
})

router.get('/contents',async (req, res, next)=>{
  try {
    const userFollowInfo = await User.findOne({
      include: [{
        model: User,
        as: 'Followings',
        attributes:['id']
      }],
      attributes:['id'],
      where: {id: req.user.id}
    });

    let idList = [];
    userFollowInfo.Followings.forEach((data)=>{
      idList.push(data.id);
    })
    idList.push(req.user.id);
    
    const result = await Contents.findAll({
      where: {userId: {[queryOption.in]: idList}},
      include: [
        { model: User,attributes:['email','id','profile']},
        { model: Replies, include: {model: User,attributes:['email','id','profile']}},
      ],
      order:[['createdAt','DESC']],
      reqUserId: req.user.id
    });
    return res.status(200).json({
      code: 200,
      data: result,
      reqUser: req.user.id,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      data: error
    });
  }
});
router.post('/reply',async (req, res, next)=>{
  try {
    console.log('/reply called !!!!!!!!!!',req.body);
    const result = await Replies.create({
      reply: req.body.reply,
      contentId: req.body.contentId,
      userId: req.user.id
    });
    return res.status(200).json({
      code: 200,
      data: result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      code: 500,
      data: error
    });
  }
});

router.get('/find-user', async (req, res, next)=>{
  try {
    const findList = await User.findAll(
      { 
        where: { email:{ [queryOption.like]: '%'+req.query.email+'%' }, id:{[queryOption.ne]: req.user.id } },
        attributes: ['id','email']
      }
    );
    return res.status(200).json({
      code:200,
      data: {
        param: req.query,
        list: findList
      },
    })
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      data: 'something wrong'
    })
  }
});

router.post('/add-follow',async (req, res, next)=>{
  try {
    const user = await User.findOne({where : {id:req.user.id}});
    const targetUser = await User.findOne(
      {
        where : {id:req.body.addId},
        attributes: ['id','email','profile']
      }
    );
    await user.addFollowing(targetUser);
    
    return res.status(200).json({
      code: 200,
      data: targetUser
    })
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      data: 'something wrong',
      result: result
    });
  }
});

router.get('/follow', async (req, res, next)=>{
  try {
    const userFollowInfo = await User.findOne({
      include: [{
        model: User,
        as: 'Followings',
        attributes:['id','email','profile']
      }],
      attributes:['id'],
      where: {id: req.user.id}
    }); 
    return res.status(200).json({
      code: 200,
      data: userFollowInfo.Followings,
    })
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      data: 'something wrong',
      result: result
    })
  }
});

router.post('/chat',async (req, res, next )=>{
  try {
    const newChat = await Chat.create({
      chat: req.body.chat,
      userId: req.user.id,
      roomId: req.body.roomId
    });
    const user = await User.findOne({
      where : {id:req.user.id},
      attributes: ['id','email','profile']
    });
    req.app.get('io').of('/chat').to(req.body.roomId).emit('chat',newChat,user);
    return res.status(200).json({
      code: 200,
      data: newChat
    }) 
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      data: 'something wrong'
    })
  }
});

router.post('/check-room', async (req, res, next)=>{
  try {
    let returnValue = null;
    const resultValue = await sequelize.query(
    `SELECT user1.roomId
    FROM (select roomuser.roomId ,roomuser.userId
    from rooms
    inner join roomuser on roomuser.roomId = rooms.id
    where roomuser.userId = ${req.body.targetId } AND rooms.deletedAt is null) user1, (select roomuser.roomId ,roomuser.userId
    from rooms
    inner join roomuser on roomuser.roomId = rooms.id
    where roomuser.userId = ${req.user.id } AND rooms.deletedAt is null) user2
    WHERE user1.roomId = user2.roomId;`,
      { type: sequelize.QueryTypes.SELECT });
    if(resultValue.length<=0){
      const user = await User.findOne({where : {id:req.user.id}});
      const targetUser = await User.findOne({where : {id:req.body.targetId}});
      const RoomResult = await Room.create(user);
      await user.addRoom(RoomResult);
      await targetUser.addRoom(RoomResult);
      returnValue = RoomResult.id;
      const io = req.app.get('io');
      const newRoom = await Room.findOne({
        include: [{
          model: User,
          attributes: ['id','email','profile'],
          as: 'userForRoom',
          where: { id : req.user.id }
        },{
          model: Chat,
          limit: 1,
          order: [ [ 'createdAt', 'DESC' ]]
        },{
          model: User,
          attributes: ['id','email','profile'],
          where: { id : {[queryOption.ne]: req.user.id} }
        }],
        attributes: ['id'],
        where: {id: RoomResult.id}
      })
      io.of('/room').emit('new', newRoom);
    }else if(resultValue.length>1){
      throw Error({
        name: '500',
        message: 'duplicated room info'
      });
    }else{
      returnValue = resultValue[0].roomId;
    }
    return res.status(200).json({
      code: 200,
      data: returnValue  //방번호 리턴
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      data: error
    });
  }
});

router.get('/room-list',async (req, res, next)=>{
  try {
    const roomList = await Room.findAll({
      include: [{
        model: User,
        attributes: ['id','email','profile'],
        as: 'userForRoom',
        where: { id : req.user.id }
      },{
        model: Chat,
        limit: 1,
        order: [ [ 'createdAt', 'DESC' ]]
      },{
        model: User,
        attributes: ['id','email','profile'],
        where: { id : {[queryOption.ne]: req.user.id} }
      }],
      attributes: ['id'],
    })
    return res.status(200).json({
      code: 200,
      data: roomList,
    })
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      data: error
    });
  }
});

router.get('/chat-contents',async (req, res, next)=>{
  try {
    console.log(req.query)
    const chatContents = await Chat.findAll({ 
      where: { roomId: req.query.roomId}
    });
    return res.status(200).json({
      code: 200,
      data: chatContents,
    })
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      data: error
    });
  }
})

module.exports = router;