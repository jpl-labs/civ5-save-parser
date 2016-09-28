'use strict';

const parser = require('./parser.js');
const fs = require('fs');
const assert = require('assert');

describe('Parser', function() {
  describe('#Validate Civ Types', function() {
    let data = fs.readFileSync('./saves/newSlack19-before.Civ5Save');
    let result = parser.parse(data);

    result.civilizations.forEach(function(s) {
      it('Civ type should be in range 1-3', function() {
        assert.notEqual(-1, [1,2,3].indexOf(s.type));
      });
    });

    it('default password should be berlin', function() {
      assert.equal('berlin', result.password);
    });
  });
});

describe('ChangeCivPassword', function() {
  describe('#Validate Civ Types', function() {
    //Test values
    let newPassword = "testing";

    let data = fs.readFileSync('./saves/newSlack19-before.Civ5Save');
    let changePasswordResult = parser.changeCivPassword(data, newPassword);
    let result = parser.parse(changePasswordResult);

    it('default password should be changed to ' + newPassword, function() {
      assert.equal(newPassword, result.password);
    });
  });
});

describe('ChangeCivType', function() {
  describe('#Validate Civ Types', function() {
    //Test values
    let changePosition = 2;
    let changeValue = 1; 

    let data = fs.readFileSync('./saves/newSlack19-before.Civ5Save');
    let changeCivTypeResult = parser.changeCivType(data, changePosition, changeValue);
    let result = parser.parse(changeCivTypeResult);

    it('Civ type for position ' + changePosition + ' should be updated to ' + changeValue, function() {
      assert.equal(changeValue, result.civilizations[changePosition].type);
    });
  });
});