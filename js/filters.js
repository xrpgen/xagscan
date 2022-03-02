/* global myApp */

myApp.filter('shortaddress', function() {
  return function(address) {
    if (!address || address.length < 8) {
      return address;
    }
    var start = address.substring(0, 8);
    var end = address.substring(address.length - 8);
    return start + '...' + end;
  }
});

myApp.filter('fStatus', function() { 
  return function(text) {
      return text==0?'wait_for_appr':text==1?'approved':text==2?'rejected':'No status';
  }
});
myApp.filter('FGender', function() { 
  return function(text) {
      return text==0?'male':text==1?'female':'Gender';
  }
});


var hexToAscii = function(hex) {
    var str = "";
    var i = 0, l = hex.length;
    if (hex.substring(0, 2) === '0x') {
        i = 2;
    }
    for (; i < l; i+=2) {
        var code = parseInt(hex.substr(i, 2), 16);
        if (code > 0) {
          str += String.fromCharCode(code);
        }
    }

    return str;
};

var asciiToHex = function(str) {
  var hex = "";
  for(var i = 0; i < str.length; i++) {
    var code = str.charCodeAt(i);
    var n = code.toString(16);
    hex += n.length < 2 ? '0' + n : n;
  }
  return (hex + "0000000000000000000000000000000000000000").substring(0, 40).toUpperCase();;
};

var realCode = function(input) {
  return input && input.length > 3 && input.length <= 20 && input != "drops" ? asciiToHex(input) : input;
};

var fmtCode = function(input) {
  return input && input.length == 40 ? hexToAscii(input) : input;
};
