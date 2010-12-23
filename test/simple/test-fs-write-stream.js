var common = require('../common');
var assert = require('assert');

var path = require('path'),
    fs = require('fs');

var file = path.join(common.tmpDir, 'write.txt');

(function() {
  var stream = fs.WriteStream(file),
      _fs_close = fs.close;

  fs.close = function(fd) {
    assert.ok(fd, 'fs.close must not be called without an undefined fd.');
    fs.close = _fs_close;
  }
  stream.destroy();
})();

(function() {
  var stream = fs.createWriteStream(file);

  stream.addListener('drain', function() {
    assert.fail('\'drain\' event must not be emitted before ' +
                'stream.write() has been called at least once.');
  });
  stream.destroy();
})();

(function() {
  var stream = fs.createWriteStream(file),
      wrote = [];

  stream.write = function(data, encoding) {
    wrote.push([data, encoding]);
  }
  stream.end();
  stream.end(function() {});
  assert.equal(wrote.length, 0);
  stream.end('a');
  stream.end('b', function() {});
  stream.end('c', 'utf8');
  stream.end('d', 'utf8', function() {});
  assert.equal(wrote.length, 4)
  assert.deepEqual(wrote, [
    ['a', undefined],
    ['b', undefined],
    ['c', 'utf8'],
    ['d', 'utf8']
  ]);
})();

