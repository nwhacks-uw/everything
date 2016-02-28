require('./shim');
require('./video');
var crypto = require('./crypto');

// open file indicated by user, and encrypt
window.ReadFile = function(data){
  console.log('Hello OpenFile, got ' + data);
  var safe = crypto.encrypt(data);
  console.log('decoded ' + crypto.decrypt(safe));
};

