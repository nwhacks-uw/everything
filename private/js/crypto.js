var fs = require('fs');
var crypto = require('crypto');

var algorithm = 'aes-256-ctr',
password = 'd6F3Efeq';
var safe;
var i;

function encrypt(file){
  var cipher = crypto.createCipher(algorithm,password)
  var crypted = cipher.update(file,'utf8','hex')
  crypted += cipher.final('hex');
  i = 0;
  safe = crypted;
  return crypted;
}
 
function decrypt(text){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

function getNext(length) {
  var next = safe.substring(i, length);
  i += length;
  console.log('next: ' + next);
}

module.exports.getNext = getNext;
module.exports.encrypt = encrypt;
module.exports.decrypt = decrypt;
