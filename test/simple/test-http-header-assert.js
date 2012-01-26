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
var http = require('http');

var requests = 0;

var server = http.createServer(function(req, res) {
  ++requests;

  // invalid header values
  assert.throws(function() {
    res.writeHead(200, [
      ['aaa', 'foo'],       // valid
      ['bbb', 'aaa\0bbb'],  // CTL
      ['ccc', 'aaa\rbbb'],  // CR but not LWS
      ['ddd', 'aaa\nbbb'],  // LF but not LWS
      ['eee', 'aaa\r\nbbb'] // CRLF but not LWS
    ]);
  });
  assert.throws(function() {
    res.setHeader('aaa', 'aaa\0bbb'); // CTL
  });
  assert.throws(function() {
    res.setHeader('aaa', ['aaa', 'bbb\rccc', 'ddd']); // CR but not CTL
  });
  assert.throws(function() {
    res.addTrailers({
      aaa: 'foo',      // valid
      bbb: 'aaa\0bbb', // CTL
      ccc: 'aaa\rbbb'  // CR but not LWS
    });
  });

  // invalid header values but no assert
  res.setHeader('aaa', 'aaa\0bbb', true); // CTL
  res.setHeader('aaa', 'aaa\rbbb', true); // CR but not CTL

  // valid header values
  res.setHeader('aaa', 'foo\r bar\r\tbaz');
  res.setHeader('bbb', 'foo\n bar\n\tbaz');
  res.setHeader('ccc', 'foo\r\n bar\r\n\tbaz');
  res.writeHead(301, {
    'Content-Length': 0,
    'Location': 'http://example.com',
    'Set-Cookie': 'name=vale;\n' +
                ' expires=Mon, 26-Jan-2012 18:00:00 JST;\r' +
                '\tpath=/;\r\n' +
                ' \tdomain=example.com'
  });
  res.addTrailers([
    ['xxx', 'foo\r bar\r\tbaz'],
    ['yyy', 'foo\n bar\n\tbaz'],
    ['zzz', 'foo\r\n bar\r\n\tbaz']
  ]);

  res.end();
}).listen(common.PORT, function() {
  // invalid header values
  assert.throws(function() {
    http.request({
      port: common.PORT,
      headers: {
        aaa: 'foo',       // valid
        bbb: 'aaa\0bbb',  // CTL
        ccc: 'aaa\rbbb',  // CR but not LWS
        ddd: 'aaa\nbbb',  // LF but not LWS
        eee: 'aaa\r\nbbb' // CRLF but not LWS
      }
    });
  });

  var req = http.request({ port: common.PORT });
  assert.throws(function() {
    req.setHeader('aaa', 'aaa\0bbb'); // CTL
  });
  assert.throws(function() {
    req.setHeader('aaa', 'aaa\rbbb'); // CR but not CTL
  });
  assert.throws(function() {
    req.addTrailers([
      ['aaa', 'foo'],      // valid
      ['bbb', 'aaa\0bbb'], // CTL
      ['ccc', 'aaa\rbbb']  // CR but not LWS
    ]);
  });
  req.on('error', function() {});
  req.abort();

  // invalid header values but no assert
  req = http.request({
    port: common.PORT,
    headers: {
      aaa: 'foo',       // valid
      bbb: 'aaa\0bbb',  // CTL
      ccc: 'aaa\rbbb',  // CR but not LWS
      ddd: 'aaa\nbbb',  // LF but not LWS
      eee: 'aaa\r\nbbb' // CRLF but not LWS
    },
    noAssertHeaders: true
  });
  req.setHeader('aaa', 'aaa\0bbb', true); // CTL
  req.setHeader('aaa', 'aaa\rbbb', true); // CR but not CTL
  req.addTrailers([
    ['aaa', 'foo'],      // valid
    ['bbb', 'aaa\0bbb'], // CTL
    ['ccc', 'aaa\rbbb']  // CR but not LWS
  ], true);
  req.on('error', function() {});
  req.abort();

  // valid header values
  req = http.request({ port: common.PORT });
  req.setHeader('aaa', 'foo\n bar\r\n\tbaz');
  req.setHeader('aaa', 'foo\n bar\r\n\tbaz');
  req.setHeader('aaa', 'foo\n bar\r\n\tbaz');
  req.addTrailers({
    xxx: 'foo',
    yyy: 'bar',
    zzz: 'baz'
  });

  req.on('error', function(err) {
    server.close();
  });
  req.end();
});

process.on('exit', function() {
  assert.equal(requests, 1);
});
