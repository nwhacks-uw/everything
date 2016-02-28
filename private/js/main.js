require('./shim');
require('./video');
var crypto = require('./crypto');

// open file indicated by user, and encrypt
window.ReadFile = function(data){
  console.log('encoding');
  var safe = crypto.encrypt(data);
};

