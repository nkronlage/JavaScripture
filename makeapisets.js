'use strict';

var path = require('path');
var stream = require('stream');
var util = require('util');
var StringDecoder = require('string_decoder').StringDecoder;
var File = require('vinyl');
var jsdoc = require('./jsdocparser.js');

var MakeApiSets = function() {
  if (!(this instanceof MakeApiSets)) return new MakeApiSets();
  stream.Transform.call(this, {
    objectMode: true // needed for Vinyl
  });

  this._sets = {};
};
util.inherits(MakeApiSets, stream.Transform);

MakeApiSets.prototype._transform = function(file, encoding, callback) {
  var filename = file.path;

  var decoder = new StringDecoder('utf8');
  var obj = JSON.parse(decoder.write(file.contents));

  var set = this._sets[obj.setName];
  
  if (!set) {
    set = this._sets[obj.setName] = [];
  }
  delete obj.setName;

  set.push(obj);

  callback();
};

MakeApiSets.prototype._flush  = function(callback) {
  var file = new File({
    path: 'apisets.json',
    contents: new Buffer(JSON.stringify(this._sets))
  });
  this.push(file);
  callback();
};

module.exports = MakeApiSets;
