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
var https = require('https');
var net = require('net');
var fs = require('fs');
var path = require('path');

var serverConnect = 0;
var proxyConnect = 0;
var clientConnect = 0;
var clientError = 0;

function readPem(file) {
  return fs.readFileSync(path.join(common.fixturesDir, 'keys', file + '.pem'));
}

var server = https.createServer({
  key: readPem('agent2-key'),
  cert: readPem('agent2-cert'),
  ca: [ readPem('ca1-cert') ], // ca for agent1
  requestCert: true,
  rejectUnauthorized: true
}, function(req, res) {
  common.debug('Server got request');
  ++serverConnect;

  res.writeHead(200);
  res.end('Hello, ' + serverConnect);
});
server.listen(common.PORT, function() {
  var proxy = https.createServer({
    key: readPem('agent4-key'),
    cert: readPem('agent4-cert'),
    ca: [ readPem('ca2-cert') ], // ca for agent3
    requestCert: true,
    rejectUnauthorized: true
  }, function(req, res) {
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
    function doRequest(agent) {
      var req = https.get({
        port: common.PORT,
        agent: agent
      }, function(res) {
        common.debug('Client got response');
        ++clientConnect;
        req.emit('finish');
      });
      req.on('error', function(err) {
        common.debug('Client got error: ' + err.message);
        ++clientError;
        req.emit('finish');
      });
      req.on('finish', function() {
        if (clientConnect + clientError === 4) {
          proxy.close();
          server.close();
        }
      });
    }

    doRequest(https.overHttpsAgent({ // invalid
      maxSockets: 1,
      // no certificate for origin server
      proxy: {
        port: common.PORT + 1
        // no certificate for proxy
      }
    }));
    doRequest(https.overHttpsAgent({ // invalid
      maxSockets: 1,
      // client certification for origin server
      key: readPem('agent1-key'),
      cert: readPem('agent1-cert'),
      proxy: {
        port: common.PORT + 1
        // no certificate for proxy
      }
    }));
    doRequest(https.overHttpsAgent({ // invalid
      maxSockets: 1,
      // no certificate for origin server
      proxy: {
        port: common.PORT + 1,
        // client certification for proxy
        key: readPem('agent3-key'),
        cert: readPem('agent3-cert')
      }
    }));
    doRequest(https.overHttpsAgent({ // valid
      maxSockets: 1,
      // client certification for origin server
      key: readPem('agent1-key'),
      cert: readPem('agent1-cert'),
      proxy: {
        port: common.PORT + 1,
        // client certification for proxy
        key: readPem('agent3-key'),
        cert: readPem('agent3-cert')
      }
    }));
  });
});

process.on('exit', function() {
  assert.equal(serverConnect, 1);
  assert.equal(proxyConnect, 2);
  assert.equal(clientConnect, 1);
  assert.equal(clientError, 3);
});
