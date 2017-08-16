'use strict';

const json_parse = require('./json_parse');
const fs = require('fs-extra');

fs.diveSync('./test-cases').filter(e => e.endsWith('.lmjson')).forEach(e => {
  console.log(json_parse(fs.readFileSync(e, 'utf8')));
  //console.log('success:', e);
});