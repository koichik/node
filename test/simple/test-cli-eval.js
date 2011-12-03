// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var common = require('../common.js'),
    assert = require('assert'),
    exec = require('exec'),
    nodejs = '"' + process.execPath + '"';

// replace \ by / because windows uses backslashes in paths, but they're still
// interpreted as the escape character when put between quotes.
var filename = __filename.replace(/\\/g, '/');

if (module.parent) {
  // signal we've been loaded as a module
  console.log('Loaded as a module, exiting with status code 42.');
  process.exit(42);
}

// assert that nothing is written to stdout
exec.shell(nodejs + ' --eval 42',
    function(err, stdout, stderr) {
      assert.equal(stdout, '');
    });

// assert that "42\n" is written to stderr
exec.shell(nodejs + ' --eval "console.error(42)"',
    function(err, stdout, stderr) {
      assert.equal(stderr, '42\n');
    });

// assert that nothing is written to stdout
['--print --eval', '-p -e', '-pe'].forEach(function(s) {
  var cmd = nodejs + ' ' + s + ' ';

  exec.shell(cmd + '42',
      function(err, stdout, stderr) {
        assert.equal(stdout, '42\n');
      });

  exec.shell(cmd + "'[]'",
      function(err, stdout, stderr) {
        assert.equal(stdout, '[]\n');
      });
});

// assert that module loading works
exec.shell(nodejs + ' --eval "require(\'' + filename + '\')"',
    function(status, stdout, stderr) {
      assert.equal(status.code, 42);
    });

// module path resolve bug, regression test
exec.shell(nodejs + ' --eval "require(\'./test/simple/test-cli-eval.js\')"',
    function(status, stdout, stderr) {
      assert.equal(status.code, 42);
    });

// empty program should do nothing
exec.shell(nodejs + ' -e ""', function(status, stdout, stderr) {
  assert.equal(stdout, '');
  assert.equal(stderr, '');
});
