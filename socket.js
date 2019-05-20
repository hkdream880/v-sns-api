module.exports = (server, app)=>{
  const io = require('socket.io')(server,{ path: '/socket.io'});

  app.set('io',io);

  io.on('connection',(socket)=>{
    const req = socket.request;
    const { headers: {referer} } = req;
    //req.cookie, req.session 접근 불가. 접근 하려면 io.use 미들웨어를 연결
    const roomId = referer.split('/')[referer.split('/').length-1];
    socket.join(roomId);
    socket.on('diconnect',()=>{
      socket.leave();
    });
  });
}

//TODO : 경매 물품 추가시 소켓 or SSE 연결