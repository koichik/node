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

var StringDecoder = exports.StringDecoder = function(encoding) {
  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
  switch (this.encoding) {
    case 'utf8':
      this.detectIncompleteChar = detectUtf8IncompleteChar;
      break;
    case 'ucs2':
      this.detectIncompleteChar = detectUcs2IncompleteChar;
      break;
    case 'base64':
      this.detectIncompleteChar = detectBase64IncompleteChar;
      this.end = endBase64;
      break;
    default:
      return;
  }
  this.charBuffer = new Buffer(4);
  this.charReceived = 0;
  this.charLength = 0;
};

StringDecoder.prototype.write = function(buffer) {
  // If not multibytes character encoding...
  if (!this.charBuffer) {
    return buffer.toString(this.encoding);
  }

  var charStr = '';
  // if our last write ended with an incomplete multibyte character
  if (this.charLength) {
    // determine how many remaining bytes this buffer has to offer for this char
    var i = (buffer.length >= this.charLength - this.charReceived) ?
                this.charLength - this.charReceived :
                buffer.length;

    // add the new bytes to the char buffer
    buffer.copy(this.charBuffer, this.charReceived, 0, i);
    this.charReceived += i;

    if (this.charReceived < this.charLength) {
      // still not enough chars in this buffer? wait for more ...
      return '';
    }

    // get the character that was split
    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);
    this.charReceived = this.charLength = 0;

    // if there are no more bytes in this buffer, just emit our char
    if (i == buffer.length) return charStr;

    // otherwise cut off the characters end from the beginning of this buffer
    buffer = buffer.slice(i, buffer.length);
  }

  this.detectIncompleteChar(buffer);

  if (!this.charLength) {
    // no incomplete char at the end of this buffer, emit the whole thing
    return charStr + buffer.toString(this.encoding);
  }

  // buffer the incomplete character bytes we got
  var completeLength = buffer.length - this.charReceived;
  buffer.copy(this.charBuffer, 0, completeLength, buffer.length);

  if (buffer.length - completeLength > 0) {
    // buffer had more bytes before the incomplete char
    charStr += buffer.toString(this.encoding, 0, completeLength);
  }

  return charStr;
};

StringDecoder.prototype.end = function() {
  return '';
};

function detectUtf8IncompleteChar(buffer) {
  // determine how many bytes we have to check at the end of this buffer
  var i = (buffer.length >= 3) ? 3 : buffer.length;

  // Figure out if one of the last i bytes of our buffer announces an
  // incomplete char.
  for (; i > 0; i--) {
    var c = buffer[buffer.length - i];

    // See http://en.wikipedia.org/wiki/UTF-8#Description

    // 110XXXXX
    if (i == 1 && c >> 5 == 0x06) {
      this.charLength = 2;
      break;
    }

    // 1110XXXX
    if (i <= 2 && c >> 4 == 0x0E) {
      this.charLength = 3;
      break;
    }

    // 11110XXX
    if (i <= 3 && c >> 3 == 0x1E) {
      this.charLength = 4;
      break;
    }
  }

  this.charReceived = i;
}

function detectUcs2IncompleteChar(buffer) {
  this.charReceived = buffer.length % 2;
  this.charLength = this.charReceived ? 2 : 0;
}

function detectBase64IncompleteChar(buffer) {
  this.charReceived = buffer.length % 3;
  this.charLength = this.charReceived ? 3 : 0;
}

function endBase64() {
  if (!this.charLength) {
    return '';
  }
  return this.charBuffer.toString('base64', 0, this.charReceived);
}
