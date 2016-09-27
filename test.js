'use strict';

const parser = require('./parser.js');
const fs = require('fs');

(() => {
    if (!module.parent) {
        if (process.argv.length < 3) {
            console.log('Please pass the filename as the argument to the script.');
        } else {
            fs.readFile(process.argv[2], (err, data) => {
                let result = parser.changeCivType(data, 2, 1);
                let result2 = parser.parse(result);
                console.log(result2);
            });


            fs.readFile(process.argv[2], (err, data) => {
                let result = parser.changeCivPassword(data, "testing");
                fs.writeFile(process.argv[2] + '-new', result, err => {
                    if (err) throw err;
                });
                let result2 = parser.parse(result);
                console.log(result2);
            });
        }
    }
})();
