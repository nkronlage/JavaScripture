'use strict';

var fs = require('fs');
var path = require('path');
var jsdoc = require('./jsdocparser.js');

var filename = process.argv[2];

var obj = jsdoc.processFile(filename);
obj.jsdocSourceFile = filename;

var setName = path.basename(path.dirname(filename));


var metadata = {
  name: obj.name,
  setName: setName
};

var addMembers = function(name) {
  metadata[name] = obj[name].map(function(member) {
    return { name: member.name, onname: member.onname };
  });
};

addMembers('instanceProperties');
addMembers('instanceMethods');
addMembers('instanceEvents');
addMembers('properties');
addMembers('methods');

var pretty = false;
var json = JSON.stringify(metadata, null, pretty ? ' ' : undefined);

fs.writeFileSync('tmp/new_' + obj.name + '.json', json);
