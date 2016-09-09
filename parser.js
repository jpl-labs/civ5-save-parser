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

          // Process header information
          processHeader(buffer, result);

          let chunkCount = 0;
          let chunk = {
            endIndex: 0
          };

          while (null !== (chunk = getChunk(buffer, chunk.endIndex))) {
            // All civs are in the sixth chunk
            if (chunkCount === 6){
              let buffer = {
                buffer: chunk.buffer,
                pos: 0
              };

              console.log(readString(buffer));
            }
            // The current player byte is at the end of the seventh chunk...
            else if (chunkCount === 7) {
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

function processHeader(buffer, result){
  let pos = 0;
  let buf = {
    buffer: buffer,
    pos: 0
  }
  result.civ = readString(buf, 4);
  result.save = readInt(buf);
  result.game = readString(buf);
  result.build = readString(buf);
  result.turn = readInt(buf);
  //TODO: investigate this Byte
  buf.pos++;
  result.startingCiv = readString(buf);
  result.handicap = readString(buf);
  result.era = readString(buf);
  result.currentEra = readString(buf);
  result.gameSpeed = readString(buf);
  result.worldSize = readString(buf);
  result.mapScript = readString(buf);
}

function readString(buf, length){
  let result = [];
  if(!length){
    length = readInt(buf);
  }
  
  for(let i=0; i<length; i++){
    result.push(buf.buffer[buf.pos]);
    buf.pos++;
  }

  let resBuf = new Buffer(result);
  return resBuf.toString();
}

function readInt(buf){
  let int = buf.buffer.readUInt32LE(buf.pos);
  buf.pos+=4;
  return int;
}