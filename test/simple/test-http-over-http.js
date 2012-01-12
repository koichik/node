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
var net = require('net');

var poolSize = 3;
var N = 10;
var serverConnect = 0;
var proxyConnect = 0;
var clientConnect = 0;
var agent;

var server = http.createServer(function(req, res) {
  common.debug('Server got request');
  ++serverConnect;

  res.writeHead(200);
  res.end('Hello' + req.url);
});
server.listen(common.PORT, function() {
  var proxy = http.createServer(function(req, res) {
    assert(false);
  });
  proxy.on('connect', function(req, clientSocket, head) {
    common.debug('Proxy got CONNECT request');
    assert.equal(req.method, 'CONNECT');
    assert.equal(req.url, 'localhost:' + common.PORT);
    ++proxyConnect;

    var serverSocket = net.connect(common.PORT, function() {
      clientSocket.write('HTTP/1.1 200 Connection established\r\n\r\n');
      clientSocket.pipe(serverSocket);
      serverSocket.write(head);
      serverSocket.pipe(clientSocket);
      // workaround, see #2524
      serverSocket.on('end', function() {
        clientSocket.end();
      });
    });
  });
  proxy.listen(common.PORT + 1, function() {
    agent = http.overHttpAgent({
      maxSockets: poolSize,
      proxy: {
        port: common.PORT + 1
      }
    });

    for (var i = 0; i < N; ++i) {
      (function(i) {
        var req = http.get({
          port: common.PORT,
          path: '/' + i,
          agent: agent
        }, function(res) {
          common.debug('Client got response');
          ++clientConnect;

          res.setEncoding('utf8');
          res.on('data', function(data) {
            assert.equal(data, 'Hello/' + i);
          });
          res.on('end', function() {
            if (clientConnect === N) {
              proxy.close();
              server.close();
            }
          });
        });
      })(i);
    }
  });
});

process.on('exit', function() {
  assert.equal(serverConnect, N);
  assert.equal(proxyConnect, poolSize);
  assert.equal(clientConnect, N);

  var name = 'localhost:' + common.PORT;
  assert(!agent.sockets.hasOwnProperty(name));
  assert(!agent.requests.hasOwnProperty(name));
});
