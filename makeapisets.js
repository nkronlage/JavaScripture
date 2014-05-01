'use strict';

var path = require('path');
var fs = require('fs');

var sets = {};

for (var i = 2; i < process.argv.length; i++) {
  var filename = process.argv[i];

  var obj = JSON.parse(fs.readFileSync(filename, 'utf8'));

  var set = sets[obj.setName];
  
  if (!set) {
    set = sets[obj.setName] = [];
  }
  delete obj.setName;

  set.push(obj);
}

var pretty = false;
fs.writeFileSync('tmp/new_apisets.json', JSON.stringify(sets, null, pretty ? ' ' : undefined));
