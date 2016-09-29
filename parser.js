'use strict';

module.exports = {
  parse: function(data){
    const result = {};
    const buffer = new Buffer(data);

    // Process header information
    processHeader(buffer, result);

    let chunkCount = 0;
    let chunk = {
      endIndex: 0
    };

    result.civilizations = [];
    while (null !== (chunk = getChunk(buffer, chunk.endIndex))) {
      // 2nd chunk contains the type/status of civilization - 1 alive, 2 dead, 3 human, 4 missing
      if (chunkCount === 2){
        while(chunk.pos < chunk.buffer.length){
          result.civilizations.push({
            name: "",
            leader: "",
            type: readInt(chunk),
          });
        }
      }

      // 6th chunk contains all civ names 
      if (chunkCount === 6){
        let i = 0;
        while(chunk.pos < chunk.buffer.length){
          let civ = readString(chunk);
          if(civ.trim() !== ''){
            result.civilizations[i].name = civ;
          }
          i++;
        }
      }

      // 7th chunk contains leader names and current player byte
      // The current player byte is at the end of the seventh chunk...
      if (chunkCount === 7) {
        // Read through leader names
        result.barbarianCount = 0;
        let i = 0;
        while(chunk.pos < chunk.buffer.length && i < result.civilizations.length){
          result.civilizations[i].leader = readString(chunk);
          if(result.civilizations[i].leader === 'LEADER_BARBARIAN'){
            result.barbarianCount++;
          }
          i++;
        }
        // Look backwards from end of chunk for the current player...
        for (i = chunk.buffer.length - 1; i >= 0; i--) {
          if (chunk.buffer[i] !== 0) {
            result.player = chunk.buffer[i];
            break;
          }
        }
      }

      // 11th chunk contains passwords
      if (chunkCount === 11){
        let i = 0;
        while(chunk.pos < chunk.buffer.length && i < result.civilizations.length){
          result.civilizations[i].password = readString(chunk);
          i++;
        }
      }

      // 23rd chunk contains player colors
      if (chunkCount === 23){
        // Read through player colors
        let i = 0;
        while(chunk.pos < chunk.buffer.length && i < result.civilizations.length){
          result.civilizations[i].color = readString(chunk);
          i++;
        }
      }
      chunkCount++;
    }

    //remove missing civs (status 4)
    for(let i = result.civilizations.length-1; i >= 0; i--) {
      if(result.civilizations[i].name === '' || result.civilizations[i].type == 4) {
        result.civilizations.splice(i, 1);
      }
    }

    return result;
  },
  changeCivType: function(data, position, type){
      const buffer = new Buffer(data);
      let result = new Buffer(data);

      let chunkCount = 0;
      let chunk = {
        endIndex: 0
      };

      while (null !== (chunk = getChunk(buffer, chunk.endIndex))) {
        // 2nd chunk contains the type/status of civilization - 1 alive, 2 dead, 3 human, 4 missing
        if (chunkCount === 2){
          let civCount = 0;
          let abort = false;
          while(chunk.pos < chunk.buffer.length){
            if(civCount === position){
              let pos = chunk.startIndex + chunk.pos;
              let civType = result.slice(pos, pos + 4);
              civType.writeUInt32LE(type, 0 );
            }

            readInt(chunk);
            civCount++;
          }
        }
        
        chunkCount++;
      }

      return result;
  },
  changeCivPassword: function(data, position, password){
    const buffer = new Buffer(data);
    let result;

    let chunkCount = 0;
    let chunk = {
      endIndex: 0
    };

    while (null !== (chunk = getChunk(buffer, chunk.endIndex))) {
      // 11th chunk contains password
      if (chunkCount === 11){
        for(let i=0; i<position; i++){
          readString(chunk);
        }
        let pos = chunk.startIndex + chunk.pos;
        let encodedPassword = encodeString(password);
        let currentPassword = readString(chunk);

        //create new buffer with new length
        result = new Buffer(buffer.length - (currentPassword.length + 4) + encodedPassword.length);
        //get buffer before password
        buffer.copy(result, 0, 0, pos);
        //add password to buffer
        encodedPassword.copy(result, pos, 0, encodedPassword.length);
        //copy the rest of the buffer starting after the existing password 
        buffer.copy(result, pos + encodedPassword.length, 0, buffer.length - (pos + currentPassword.length + 4));
      }

      chunkCount++;
    }

    return result;
  }
};

// Parse helper functions

function getChunk(buffer, startIndex) {
  const delimiter = new Buffer([0x40, 0, 0, 0]);
  const result = {
    startIndex: startIndex,
    pos: 0
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
  skipBytes(buf, 1);
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
    if(length === 0 || length > 1000)
      return '';
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

function skipBytes(buf, num){
  buf.pos += num;
}

// Write helper functions
function encodeString(text){
  let length = text.length;
  let result = new Buffer(length+4);

  result.writeUInt32LE(length, 0);
  result.write(text, 4);

  return result;
}