(function (doc, nav) {
  "use strict";

  var room = location.pathname;
  var socket = io();
  var crypto = require('./crypto');
  socket.on('connect', function() {
    socket.emit('room', room);
  });

  var video;
  var width;
  var height;
  var context;
  var contextOther;
  var canvas;
  var id = 0;
  var frameRate = 2;
  var messageQueue = [];

  function initialize() {
    // On message sent
    document.getElementById("send").onclick = function() {
      var message = document.getElementById("message").value;
      sendMessage(message);
    }

    // The source video.
    video = doc.getElementById("v");
    width = video.width;
    height = video.height;

    // The target canvas.
    canvas = doc.getElementById("cme");
    context = canvas.getContext("2d");
    contextOther = doc.getElementById('cother').getContext('2d');

    // Get the webcam's stream.
    nav.getUserMedia({video: true}, startStream, function () {});
  }

  function startStream(stream) {
    video.src = URL.createObjectURL(stream);
    video.play();

    // Ready! Let's start drawing.
    requestAnimationFrame(draw);
  }


  var lastTime = +new Date();
  function draw() {
    var frame = readFrame();
    if (frame) {
      changeData(frame.data);
      context.putImageData(frame, 0, 0);
    }

    var imageData = getImageData();

    // Send frame to server
    var thisTime = +new Date();
    if (thisTime - lastTime > 1000/frameRate) {

      lastTime = thisTime;
      socket.emit('uploadFrame', {
        room: room,
        id: id++,
        width: width,
        height: height,
        data: imageData,
        timestamp: +new Date(),
      });
    }

    // Wait for the next frame.
    requestAnimationFrame(draw);
  }

  function getImageData() {
      // Returns imageData as string
      return canvas.toDataURL('image/png');
  }

  function readFrame() {
    try {
      context.drawImage(video, 0, 0, width, height);
    } catch (e) {
      // The video may not be ready, yet.
      return null;
    }

    return context.getImageData(0, 0, width, height);
  }

  function changeData(data, message) {
    var len = data.length;
    var message = message || '';


    var bitPadding = 8;
    var numLSBs = 8;

    for (var i = 0; i < 20000; ++i) {
      message += String.fromCharCode(Math.floor(Math.random() * 255));
    }

    var bitsInMessage = message.length * bitPadding;
    var maximumMessageLength = len * numLSBs;
    if (bitsInMessage > maximumMessageLength) {
      console.log('length is greater than allowed! ' + bitsInMessage + '/' + maximumMessageLength);
    }


    // ENCRYPT!!!
    var encryptedMessage = ">>>>" + message + "<<<<";
    var asciiArray = [];
    for (var i = 0; i < encryptedMessage.length; ++i) {
      asciiArray[i] = encryptedMessage.charCodeAt(i);
    }
    var bitArray = [];
    for (var i = 0; i < asciiArray.length; ++i) {
      var bitString = (asciiArray[i]).toString(2);
      var bitStringLen = bitString.length;
      for (var j = 0; j < bitPadding - bitStringLen; ++j) {
        bitString = "0" + bitString;
      }
      for (var j = 0; j < bitPadding; ++j) {
        bitArray.push(+bitString.charAt(j));
      }
    }

    // Add bits to LSB
    var mask = ~((1<<numLSBs)-1);
    for (var i = 0; i < bitArray.length / numLSBs; ++i) {
      var lsbs = 0;
      for (var j = 0; j < numLSBs; ++j) {
        lsbs += (bitArray[i*numLSBs + j] << (numLSBs - j - 1));
      }
      data[i] = (data[i] & mask) | lsbs;
    }


    // DECRYPT!!!

    var bitArray = [];
    for (var i = 0; i < data.length/numLSBs; ++i) {
      var mask = ~(-1 << numLSBs);
      var bit = data[i] & mask;
      for (var j = numLSBs - 1; j >= 0; --j) {
        var otherMask = 1 << j;
        bitArray.push((bit & otherMask) >> j);
      }
    }

    var asciiArray = [];
    var endCharCount = 0;
    for (var i = 0; i < data.length / bitPadding; ++i) {
      var ascii = "";
      for (var j = 0; j < bitPadding; ++j) {
        ascii += bitArray[i * bitPadding + j];
      }
      asciiArray[i] = String.fromCharCode(parseInt(ascii, 2));
      if (asciiArray[i] === '<') {
        endCharCount++;
      } else {
        endCharCount = 0;
      }
      if (endCharCount === 4) {
        break;
      }
    }
    var descriptedMessage = asciiArray.join('');
  }


  socket.on('downloadFrame', function(frame) {
    if (isMessage(frame)) {
      renderTextMessage(frame.data);
    } else {
      var image = new Image();
      image.onload = function() {
        contextOther.drawImage(image, 0, 0);
      };
      image.src = frame.data;
    }
  });

  function isMessage(frame) {
    return frame.width == 0;
  }

  function renderTextMessage(message) {
    var p = document.createElement('p');
    var text = document.createTextNode(message);
    p.appendChild(text);
    document.getElementById('messages').appendChild(p);
  }

  function sendMessage(msg) {
    console.log('send message');
    messageQueue.push(msg);
    // Recursively emit frames at random 30 second intervals
    (function loop() {
      var rand = Math.round(Math.random() * (10)) + 30;
      setTimeout(function() {
        if (messageQueue.length > 0) {
          // Split into sendable sized chunk frames
          socket.emit('uploadFrame', {
            id: id++,
            width: 0,
            height: 0,
            data: messageQueue[0],
            timestamp: +new Date(),
          });
          messageQueue.shift();
          loop();
        }
      }, rand);
    }());
  }

  addEventListener("DOMContentLoaded", initialize);
})(document, navigator);
