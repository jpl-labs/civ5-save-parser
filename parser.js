'use strict';

const fs = require('fs');

(() => {
  module.exports.parse = (filename) => {
    return new Promise((fulfill, reject) => {
      fs.readFile(filename, (err, data) => {
        if (err) {
          reject(err);
        } else {
          const result = {};
          const buffer = new Buffer(data);

          // Current game turn is at hex position 0x28
          result.turn = buffer.readUInt32LE(0x28);

          let chunkCount = 0;
          let chunk = {
            endIndex: 0
          };

          while (null !== (chunk = getChunk(buffer, chunk.endIndex))) {
            // The current player byte is at the end of the seventh chunk...
            if (chunkCount === 7) {
              // Look backwards from end of chunk for the current player...
              for (let i = chunk.buffer.length - 1; i >= 0; i--) {
                if (chunk.buffer[i] !== 0) {
                  result.player = chunk.buffer[i];
                  break;
                }
              }
            }
            chunkCount++;
          }

          fulfill(result);
        }
      });
    });
  };

  if (!module.parent) {
    if (process.argv.length < 3) {
      console.log('Please pass the filename as the argument to the script.');
    } else {
      module.exports.parse(process.argv[2]).then(result => {
        console.log(result);
      });
    }
  }
})();

/////

function getChunk(buffer, startIndex) {
  const delimiter = new Buffer([0x40, 0, 0, 0]);
  const result = {
    startIndex: startIndex
  };

  if (!startIndex) {
    result.startIndex = buffer.indexOf(delimiter);
  }

  result.startIndex += delimiter.length;

  result.endIndex = buffer.indexOf(delimiter, result.startIndex);

  if (result.endIndex >= 0) {
    result.buffer = buffer.slice(result.startIndex, result.endIndex);
    return result;
  }

  return null;
}
