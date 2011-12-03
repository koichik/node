var util = require("util"),
    exec = require("exec");

function next (i) {
  if (i <= 0) return;

  var child = exec.spawn("echo", ["hello"]);

  child.stdout.addListener("data", function (chunk) {
    util.print(chunk);
  });

  child.addListener("exit", function (code) {
    if (code != 0) process.exit(-1);
    next(i - 1);
  });
}

next(500);
