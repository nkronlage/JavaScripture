'use strict';

var fs = require('fs');
var path = require('path');
var stream = require('stream');
var util = require('util');
var StringDecoder = require('string_decoder').StringDecoder;
var jsdoc = require('./jsdocparser.js');

var MakeMetadata = function() {
  if (!(this instanceof MakeMetadata)) return new MakeMetadata();
  stream.Transform.call(this, {
    objectMode: true // needed for Vinyl
  });
};
util.inherits(MakeMetadata, stream.Transform);

MakeMetadata.prototype._transform = function(file, encoding, callback) {
  var filename = file.path;
  var decoder = new StringDecoder('utf8');

  var obj = jsdoc.processFileContents(decoder.write(file.contents));
  obj.jsdocSourceFile = filename;

  var setName = path.basename(path.dirname(filename));

  var hasDescriptions = !!obj.description;

  obj.constructors.map(function(constructor) {
    hasDescriptions = hasDescriptions || !!constructor.description;
  });
  obj.instanceMembers.map(function(member) {
    hasDescriptions = hasDescriptions || !!member.description;
  });
  obj.prototypeMembers.map(function(member) {
    hasDescriptions = hasDescriptions || !!member.description;
  });

  var metadata = {
    name: obj.name,
    setName: setName,
    hasDescriptions: hasDescriptions
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

  file.path = file.path.replace(path.extname(file.path), '.json');
  file.contents = new Buffer(json);
  callback(null, file);
};

module.exports = MakeMetadata;
