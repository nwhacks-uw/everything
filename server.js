"use strict";
var port = process.env.PORT || 3000;

var express = require('express');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.urlencoded({ extended: false } ));
app.use(express.static('static'));

var server = app.listen(port, function() {
  console.log('Listening on *:' + port);
});

var io = require('socket.io')(server);
io.on('connection', function(socket){
  socket.on('room', room => {
    socket.join(room);
    console.log('join', room)
  });
  socket.on('uploadFrame', msg => {
    socket.broadcast.to(msg.room).emit('downloadFrame', msg);
  });
});

app.get(['/:room', '/'], function(req, res) {
  res.sendFile(__dirname + '/views/index.html');
});