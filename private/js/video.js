(function (doc, nav) {
  "use strict";

  var socket = io();
  var crypto = require('./crypto');
  var video;
  var width;
  var height;
  var context;
  var canvas;
  var id = 0;
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
    canvas = doc.getElementById("c");
    context = canvas.getContext("2d");

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
      // replaceGreen(frame.data);
      context.putImageData(frame, 0, 0);
    }

    var imageData = getImageData();

    // Send frame to server
    var thisTime = +new Date();
    if (thisTime - lastTime > 1000/20) {
      lastTime = thisTime;
      socket.emit('uploadFrame', {
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

  function replaceGreen(data) {
    var len = data.length;

    for (var i = 0, j = 0; j < len; i++, j += 4) {
      // Convert from RGB to HSL...
      var hsl = rgb2hsl(data[j], data[j + 1], data[j + 2]);
      var h = hsl[0], s = hsl[1], l = hsl[2];

      // ... and check if we have a somewhat green pixel.
      // if (h >= 90 && h <= 160 && s >= 25 && s <= 90 && l >= 20 && l <= 75) {
      if (Math.random() > 0.9) {
        // data[j + 3] = 0;
        data[j] = (data[j] & (255 - 128)) + (Math.random() > 0.5 ? 128 : 0);
        data[j+1] = (data[j+1] & (255 - 128)) + (Math.random() > 0.5 ? 128 : 0);
        data[j+2] = (data[j+2] & (255 - 128)) + (Math.random() > 0.5 ? 128 : 0);
      }
      // }
    }
  }

  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;

    var min = Math.min(r, g, b);
    var max = Math.max(r, g, b);
    var delta = max - min;
    var h, s, l;

    if (max == min) {
      h = 0;
    } else if (r == max) {
      h = (g - b) / delta;
    } else if (g == max) {
      h = 2 + (b - r) / delta;
    } else if (b == max) {
      h = 4 + (r - g) / delta;
    }

    h = Math.min(h * 60, 360);

    if (h < 0) {
      h += 360;
    }

    l = (min + max) / 2;

    if (max == min) {
      s = 0;
    } else if (l <= 0.5) {
      s = delta / (max + min);
    } else {
      s = delta / (2 - max - min);
    }

    return [h, s * 100, l * 100];
  }

  socket.on('downloadFrame', function(frame) {
    if (isMessage(frame)) {
      renderTextMessage(frame.data);
    } else {
      var image = new Image();
      image.onload = function() {
        context.drawImage(image, 0, 0);
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
