var fs = require('fs');
var crypto = require('crypto');

// crypto
var algorithm = 'aes-256-ctr',
password = 'd6F3Efeq';

function encrypt(text){
  var cipher = crypto.createCipher(algorithm,password)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
 
function decrypt(text){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

module.exports = function (values) {
  var data = "hello";
  console.log(data);

  var safe = encrypt("hello");
  console.log(safe);

  var unsafe = decrypt(safe);
  console.log(unsafe);

  return [safe, unsafe];
}
