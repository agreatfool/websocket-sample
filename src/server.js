var libPath = require("path");
var libFs = require("fs");
var profiler = require('v8-profiler');
var WebSocket = require('ws');

var wss = new WebSocket.Server({ host: "127.0.0.1", port: 8080 });

wss.on("connection", function connection(ws) {
  ws.on("message", function serverOnMsg(message) {
    if (LOG_SERVER_MSG) {
      console.log('Server: Received: %s', message);
    }
    MSG_COUNT_HISTORY++;
    wss.clients.forEach(function (client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  console.log("Server: Client connected: %s", wss.clients.size);
});

// status report
var DUMP_PATH = "/Users/Jonathan/Downloads";
var LOG_SERVER_MSG = false;
var REPORT_INTERVAL = 10; // second
var MSG_COUNT_HISTORY = 0;
var HEAP_SIZE_HISTORY = 0;
var HEAP_DELTA_THROTTLE = 10; // MB
function statusReport() {
  var memInfo = process.memoryUsage();
  var heapUsed = memInfo.heapUsed / (1024 * 1024);
  if ((heapUsed - HEAP_SIZE_HISTORY) > HEAP_DELTA_THROTTLE && HEAP_SIZE_HISTORY !== 0) {
    saveHeapSnapshot();
  }
  HEAP_SIZE_HISTORY = heapUsed;
  console.log(
    "Client count: " + wss.clients.size + ", " +
    "Msg speed: " + Math.floor(MSG_COUNT_HISTORY / REPORT_INTERVAL) + "/s, " +
    "Heap size: " + heapUsed + " MB"
  );
  MSG_COUNT_HISTORY = 0;
}
setInterval(function () {
  statusReport();
}, REPORT_INTERVAL * 1000);

function saveHeapSnapshot() {
  var snap = profiler.takeSnapshot('profile');
  var buffer = '';
  var stamp = Date.now();
  snap.serialize(
    function iterator(data, length) {
      buffer += data;
    },
    function complete() {
      var name = "server_heap_" + stamp + '.heapsnapshot';
      libFs.writeFile(libPath.join(DUMP_PATH, name), buffer, function () {
        console.log('Heap snapshot written to ' + name);
      });
    }
  );
}

console.log("listening on port: 8080");