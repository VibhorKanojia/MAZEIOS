
var express = require('express')
var app = express()
var path = require("path");
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
var mazeJS = require('./public/javascripts/maze.js');

var clients = [];
var totalMazeGenerated = 119;
app.use(express.static(path.join(__dirname, 'public')));

app.use("/styles",  express.static(__dirname + '/public/stylesheets'));
app.use("/scripts", express.static(__dirname + '/public/javascripts'));
app.use("/images",  express.static(__dirname + '/public/images'));


app.get('/', function (req, res) {
      res.sendFile(__dirname + '/public/Maze.html');
});

var cells = [];

var clobject = {'cells':[]};


var width = 15;
var height = 20;

var myobject={'cells':[]};
var cellList = [];

var LastClientID = 2;
var timeCount = 59;
var mode = "PLAY";

var maze = new mazeJS.Maze(width,height);
          clobject.cells = maze.getMaze();


function changeTime(){
    var intervalID = setInterval(function() {
        timeCount--;
        io.emit("Set Timer", timeCount);
      
        if (timeCount == 0 && mode == "PLAY"){
          io.emit("ENTER SOLVE MODE");
          timeCount = 5;
          mode = "SOLVE";
        }

        else if (timeCount == 0 && mode == "SOLVE"){
          io.emit("ENTER WAIT MODE");
          clobject.cells =[];
          timeCount = 10;
          mode = "WAIT";
        }

        else if (timeCount == 0 && mode == "WAIT"){
          var maze = new mazeJS.Maze(width,height);
          clobject.cells = maze.getMaze();
          io.emit("ENTER PLAY MODE", clobject.cells);
          timeCount = 59;
          mode = "PLAY";
        }
    }, 1000);

};

changeTime();

io.on('connection', function(socket){
 var client_ip_address = socket.request.connection._peername.address;
  console.log(client_ip_address + " connected");


  socket.on('disconnect', function() {
      var i = clients.indexOf(socket.id);
      if (i != -1){
        delete clients[i];
        console.log("deleting " + i);
      }
  });

  io.to(socket.id).emit('SocketID message', {'sid': socket.id, 'mazes' : totalMazeGenerated});
  
  socket.on('Get ClientID', function(socketid){
    clients[LastClientID] = socketid;
    io.to(socketid).emit('Set ClientID', LastClientID);
    console.log("Sent " + LastClientID);
    LastClientID += 1;
    if (LastClientID > 2000) LastClientID =2;

    if (mode == "PLAY"){
      io.to(socketid).emit("ENTER PLAY MODE", clobject.cells);
    }
    else if (mode == "SOLVE"){
      io.to(socketid).emit("ENTER SOLVE MODE", clobject.cells); 
    }
    else{
      io.to(socketid).emit("ENTER WAIT MODE");
    }

  });


    




  socket.on('Show Canvas', function(senderID){
      io.to(clients[senderID-1]).emit('Show Canvas');
  });


  socket.on('Flip Controls', function(senderID){
    if (senderID % 2 == 0){
      io.to(clients[senderID+1]).emit('Flip Controls');
    }
    else {
      io.to(clients[senderID-1]).emit('Flip Controls');
    }
  });


  socket.on('current matrix', function(data){
    if (data.senderID %2 == 0){
      cellList[data.senderID] = {'cells' : data.matrix.cells.slice()};
      cellList[data.senderID +1] = {'cells' : data.matrix.cells.slice()};
      if (data.conn) io.to(clients[data.senderID]).emit('Change Matrix', 3); 
      io.to(clients[data.senderID+1]).emit('Change Matrix', data.diff_flag); 
    }
    else{
      cellList[data.senderID] = {'cells' : data.matrix.cells.slice()};
      cellList[data.senderID - 1] = {'cells' : data.matrix.cells.slice()};
      if (data.conn) io.to(clients[data.senderID]).emit('Change Matrix', 3);  
      io.to(clients[data.senderID-1]).emit('Change Matrix', data.diff_flag);
    }
    
  });


  socket.on('Request Maze', function(data){
    totalMazeGenerated++;
    io.to(data).emit('Use Matrix', clobject);
  });

  
  socket.on('Notify Opponent', function(msg){
    var senderID = msg.clientID;
    if (senderID % 2 == 0){
      io.to(clients[senderID+1]).emit('Move Opponent', {'val_right':msg.val_right, 'val_up':msg.val_up});
    }
    else {
      io.to(clients[senderID-1]).emit('Move Opponent', {'val_right': msg.val_right, 'val_up':msg.val_up});
    }
  });


  socket.on('Notify Opponent Break', function(msg){
    var senderID = msg.clientID;
    if (senderID % 2 == 0){
      io.to(clients[senderID+1]).emit('Break Wall', msg.direction);
    }
    else {
      io.to(clients[senderID-1]).emit('Break Wall', msg.direction);
    }
  });


  socket.on('Connect Code', function(code){
    console.log(code);
  });
});
  
http.listen(process.env.PORT || 3000, function(){
  console.log('listening on *:3000');
});









