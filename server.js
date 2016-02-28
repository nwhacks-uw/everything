"use strict";
const port = process.env.PORT || 3000;

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: false } ));
app.use(express.static('static'));

const server = app.listen(port, () => {
  console.log('Listening on *:' + port);
});

const io = require('socket.io')(server);
io.on('connection', function(socket){
  socket.on('room', room => {
    socket.join(room);
    console.log('join', room)
  });
  socket.on('uploadFrame', msg => {
    socket.broadcast.to(msg.room).emit('downloadFrame', msg);
  });
});

app.get(['/:room', '/'], (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});