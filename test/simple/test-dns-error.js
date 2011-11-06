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

var common = require('../common');
var assert = require('assert');
var dns = require('dns');
var win32 = process.platform === 'win32';
var errors = 0;

assert.throws(function() {
  dns.lookup('127.0.0.1');
}, TypeError, 'undefined is not a function');

if (!win32) {
  assert.doesNotThrow(function() {
    dns.lookup('localhost');
  });
}

assert.doesNotThrow(function() {
  dns.resolve('localhost');
});

process.on('uncaughtException', function(err) {
  assert.equal(err.message, 'undefined is not a function');
  ++errors;
});

process.on('exit', function() {
  process.removeAllListeners('uncaughtException');
  assert.equal(errors, win32 ? 1 : 2);
});
