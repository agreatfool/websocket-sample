var WebSocket = require("ws");

var ws = new WebSocket("ws://127.0.0.1:8080");

var LOG_MSG = false;

ws.on("open", function clientOpen() {
  console.log("Client: Connection opened.");
});
ws.on("message", function clientOnMsg(data, flags) {
  if (!LOG_MSG) {
    return;
  }
  console.log("Client: Received: %s", data);
});

// PROCESS
var BASE_INTERVAL = 10; // seconds
var DELTA = 0.2;
process.on("message", function clientProcessOnMsg(msg) {
  if (msg !== "START") {
    return; // only "START" is valid
  }
  var INTERVAL = getRandomInt(BASE_INTERVAL * (1 - DELTA), BASE_INTERVAL * (1 + DELTA));
  var RAND_STR = randomString();
  var timer = setInterval(function () {
    try {
      ws.send(RAND_STR);
    } catch (e) {
      clearInterval(timer);
      console.warn("Client: Send error, abort.");
      process.exit(1);
    }
  }, INTERVAL * 1000);
});

// TOOLS
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function randomString(length, chars) {
  length = typeof length !== 'undefined' ? length : 5;
  chars = typeof chars !== 'undefined' ? chars : "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var result = '';
  for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}
