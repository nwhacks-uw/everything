var socket = io();

socket.on('downloadFrame', function(msg){
  var li = document.createElement('li');
  li.textContent = msg;
  document.getElementById('received-data').appendChild(li);
});