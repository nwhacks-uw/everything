window.onload = function() {
  var shim = require('./shim');
  var video = require('./video');

  function readSingleFile(e) {
    var file = e.target.files[0];
    if (!file) {
      return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
      var contents = e.target.result;
      video.setMessage(contents);
    };
    reader.readAsText(file);
  }

  document.getElementById('file-input').addEventListener('change', readSingleFile, false);
};
