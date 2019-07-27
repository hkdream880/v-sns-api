const SocketIO = require('socket.io');
const querystring = require('querystring');
const loginChaeck = require('../common/loginCheck');

module.exports = (server,app) => {
  const io = SocketIO(server,{
    path : '/v-chat',
    //transports : ['websocket']  //브라우저의 웹소켓 사용 가능 여부 확인 skip을 원할 경우(기본적으료 확인 후 사용x일경우 폴링 사용 가능 할 경우 websocket 연결)
  });
  app.set('io',io); //추후 라우터에서 io를 빼오고 이벤트 emit을 위해... ex : req.app.get('io').of('/room').emit
  //네임스페이스
  //socket io 기본값 io.of('/')
  const room = io.of('/room');  //새로운 채팅방 생성을 위해
  const chat = io.of('/chat');  //새로운 채팅 알림을 위해

  //익스프레스 미들웨어를 소캣IO에서 쓰는 방법
  // io.use((socket,next)=>{
  //   sessionMiddleware(socket.request, socket.request.res, next);
  // });
  room.on('connection',(socket)=>{
    socket.on('disconnect',()=>{
      console.log('room disconnect');
    });
  });
  chat.on('connection',(socket)=>{
    const req = socket.request;
    const { headers : { cookie } } = req;
    console.log('socket chat connection !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.log(req.url.split('?'));
    const reqParam = querystring.parse(req.url.split('?')[1]);
    //const roomId = referer.split('/')[referer.split('/').length-1].replace(/\?.+/,'');
    const roomId = reqParam.roomId;
    socket.join(roomId);
    socket.to(roomId).emit('join',roomId);
    socket.on('disconnect',()=>{
      console.log('disconnect : ',roomId);
      socket.leave(roomId);
      //const userCount = currentRoom ? currentRoom.length : 0; //유저 수
    });
  });  
};