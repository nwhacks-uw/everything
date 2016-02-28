"use strict";
const port = process.env.PORT || 3000;

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: false } ));
app.use(express.static('server/static'));

const server = app.listen(port, () => {
  console.log('Listening on *:' + port);
});

const io = require('socket.io')(server);
io.on('connection', function(socket){
  socket.on('uploadFrame', function(msg){
    socket.broadcast.emit('downloadFrame', msg);
  });
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});