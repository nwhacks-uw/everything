var room = location.pathname;
var socket = io();
socket.on('connect', function() {
  socket.emit('room', room);
});

var video;
var width;
var height;
var uploadedMessage = '';
var id = 0;
var frameRate = 1;
var messageQueue = [];
var bitPadding = 8;
var numLSBs = 1;
var START_TRANSMISSION = '>>>>';
var END_TRANSMISSION = '<<<<';
var dontUsePng = false;

// On message sent
document.getElementById("send").onclick = function() {
  var message = document.getElementById("message").value;
  setMessage(message);
};

// The source video.
video = document.getElementById("v");
width = video.width;
height = video.height;

// The target canvas.
var canvas1 = document.getElementById("cme");
var canvas2 = document.getElementById('cother');
var context1 = canvas1.getContext("2d");
var context2 = canvas2.getContext('2d');

// Get the webcam's stream.
navigator.getUserMedia({video: true}, startStream, function () {});

function startStream(stream) {
  video.src = URL.createObjectURL(stream);
  video.play();

  // Ready! Let's start drawing.
  requestAnimationFrame(draw);
}

var lastTime = +new Date();
function draw() {
  var frame = readFrame();
  var hasData = false;
  if (frame) {
    var message = '';
    if (uploadedMessage) {
      message = uploadedMessage;
      hasData = true;
      uploadedMessage = '';
    }
    encryptData(frame.data, message);
    context1.putImageData(frame, 0, 0);
  }

  function toArray(arr) {
    var a = [];
    for (var i = 0; i < arr.length; ++i) {
      a[i] = arr[i];
    }
    return a;
  }
  var imageData = dontUsePng ? toArray(frame.data) : getImageData();

  // Send frame to server
  var thisTime = +new Date();
  if (hasData || thisTime - lastTime > 1000/frameRate) {
    lastTime = thisTime;

    if (hasData) {
      console.log('Sending frame with data');

      var image = new Image();
      image.onload = function() {
        context2.clearRect(0, 0, width, height);
        context2.drawImage(image, 0, 0);
        var imageData = context2.getImageData(0, 0, width, height);
        console.log('GOOD??', decrypt(imageData.data));
      };
      image.src = imageData;
    }

    var frame = {
      room: room,
      id: id++,
      width: width,
      height: height,
      data: imageData,
      timestamp: +new Date(),
    };
    socket.emit('uploadFrame', frame);
  }

  // Wait for the next frame.
  requestAnimationFrame(draw);
}

function getImageData() {
  // Returns imageData as string
  return canvas1.toDataURL('image/png', 1);
}

function readFrame() {
  try {
    context1.drawImage(video, 0, 0, width, height);
  } catch (e) {
    // The video may not be ready, yet.
    console.log('FAILED')
    return null;
  }

  return context1.getImageData(0, 0, width, height);
}

// data - The frame data
// message - The message you want to encrypt
function encryptData(data, message) {
  var len = data.length;
  message = message || '';

  if (message) {
    console.log('encrypted message in data of length:', message.length);
  }

  var bitsInMessage = message.length * bitPadding;
  var maximumMessageLength = len * numLSBs;
  if (bitsInMessage > maximumMessageLength) {
    console.log('length is greater than allowed! ' + bitsInMessage + '/' + maximumMessageLength);
  }

  // ENCRYPT!!!
  var encryptedMessage = START_TRANSMISSION + message + END_TRANSMISSION;
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
}

// DECRYPT!!!
// Returns the message, may be empty string.
function decrypt(data) {
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
  var decryptedMessage = asciiArray.join('');
  decryptedMessage = decryptedMessage.substring(START_TRANSMISSION.length, decryptedMessage.length - END_TRANSMISSION.length);
  return decryptedMessage;
}

socket.on('downloadFrame', function(frame) {
  console.log('downloaded frame');

  if (dontUsePng) {
    // console.log(frame.data);
    var message = decrypt(frame.data);
    console.log('DECRYPTED MESSAGE:', message);
    // context1.putImageData(frame.data, 0, 0);
    renderTextMessage(message);
  } else {
    var image = new Image();
    image.onload = function() {
      context2.clearRect(0, 0, width, height);
      context2.drawImage(image, 0, 0);
      var imageData = context2.getImageData(0, 0, width, height);
      var message = decrypt(imageData.data);
      console.log('DECRYPTED MESSAGE:', message);
      renderTextMessage(message);
    };
    image.src = frame.data;
  }
});

function renderTextMessage(message) {
  var p = document.createElement('p');
  var text = document.createTextNode(message);
  p.appendChild(text);
  document.getElementById('messages').appendChild(p);
}

function setMessage(message) {
  console.log('Set message with length:', message.length);
  uploadedMessage = message;
}

module.exports = {
  setMessage: setMessage
};
