var express=require('express')
var app=express();
var http=require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();
const pug = require('pug');
var cookieParser = require('cookie-parser');
var session = require('express-session');
app.use(cookieParser());
app.use(session({secret: "Shh, its a secret!"}));
app.set('view engine', 'pug');
app.set('views','./views');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(upload.array()); // for parsing multipart/form-data
const first_view_compiled = pug.compileFile('view/index.pug');
//console.log(__dirname + '/');
app.use(express.static(__dirname + '/'));



app.get("/:dir/:uname",function(req,res){
  res.send(first_view_compiled({directory:req.params.dir,username:req.params.uname}));

});



http.listen(3000, function(){
  //console.log('listening on localhost:3000');
});


// Chatroom

var users = [];

io.on('connection', function (socket) {
  var rno=socket.request._query['roomno'];
socket.join(rno);

  //console.log("SOCKET=> ",socket,"############################################");
  //console.log("ROOMS=> ",socket.nsp.server.sockets.adapter.rooms,"---------------------------------------------");
  //console.log("lol",io.nsps['/'].adapter.rooms);
  //console.log("MESSAGE FROM SOCKET=>",socket.conn.server.socket);
  //console.log("MESSAGE FROM CONNECTION=>",socket.conn.server.connection);
  //var r=io.nsps['/'].adapter.rooms;
  //"some room" in r?console.log("ide"):console.log("illa");;

  //for (var i in r) {

  //  console.log(i,"=>",r[i]);
  //}
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (msg) {

    msg=JSON.parse(msg);
  //  console.log(msg);
    var data=msg.message;
    var roomno=msg.roomno;
  //  console.log("new message bantu ",data," -- ",roomno);
    // we tell the client to execute 'new message'
    socket.broadcast.to(roomno).emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (msg) {
  msg=JSON.parse(msg);
  //  console.log(msg);
    var username=msg.username;
    var roomno=msg.roomno;
    if(users[msg.roomno]==undefined)users[msg.roomno]=msg.username;
    else users[msg.roomno]+=" & "+msg.username;


    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    // we store the roomno in the socket session for this client
    socket.roomno=roomno;
    // we store the roomno in the socket session for this client
    socket.numUsers=io.nsps['/'].adapter.rooms[roomno].length;

  //  console.log("users of room ", msg.roomno," are ",users[msg.roomno]," with ",socket.numUsers," # of users");

    addedUser = true;
    socket.emit('login', {
      users:users[socket.roomno],
      username: socket.username,
      numUsers: socket.numUsers
    });

    // echo globally (all clients) that a person has connected
    socket.broadcast.to(roomno).emit('user joined', {
      users:users[socket.roomno],
      username: socket.username,
      numUsers: socket.numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function (roomno) {
    socket.broadcast.to(roomno).emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function (roomno) {
    socket.broadcast.to(roomno).emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      if(io.nsps['/'].adapter.rooms[socket.roomno]!=undefined) socket.numUsers=io.nsps['/'].adapter.rooms[socket.roomno].length;
      else socket.numUsers=0;

      var usersArray=users[socket.roomno].split(" & ");
      var index=-1;
      index=usersArray.indexOf(socket.username);
      if(index!=-1){usersArray.splice(index,1);users[socket.roomno]=usersArray.join(" & ");}
//console.log("user " , socket.username," left & " , " room " , socket.roomno , " has " , socket.numUsers , " # of users");
//console.log(roomno);
      // echo globally that this client has left
      socket.broadcast.to(socket.roomno).emit('user left', {
        users:users[socket.roomno],
        username: socket.username,
        numUsers: socket.numUsers
      });
    }
  });
});
