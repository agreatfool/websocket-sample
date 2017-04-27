var libPath = require("path");
var cp = require("child_process");
var fork = cp.fork;

var TOTAL_PROCESS_COUNT = 500; //2000
var CHILDREN = [];

// fork children
var FORK_COUNT = 100; // in 5s
var forkTimer = setInterval(function () {
  if (CHILDREN.length >= TOTAL_PROCESS_COUNT) {
    clearInterval(forkTimer);
    return;
  }
  console.log("Fork client.js " + FORK_COUNT + "...");
  for (var i = 0; i < FORK_COUNT; i++) {
    var child = fork(libPath.join(__dirname, "client.js"));
    CHILDREN.push(child);
  }
}, 5000);

// wait children to start
var startTimer = setInterval(function () {
  // children length check
  if (CHILDREN.length >= TOTAL_PROCESS_COUNT) {
    console.log("Controller: All clients forked, start...");
    clearInterval(startTimer);
    CHILDREN.forEach(function (child) {
      child.send("START");
    });
  }
}, 10000);