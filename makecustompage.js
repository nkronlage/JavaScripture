'use strict';

var fs = require('fs');
var path = require('path');
var stream = require('stream');
var util = require('util');
var StringDecoder = require('string_decoder').StringDecoder;
var ejs = require('ejs');
var File = require('vinyl');

var jsdoc = require('./jsdocparser.js');
var template = require('./template.js');

var MakeCustomPage = function(extension) {
  if (!(this instanceof MakeCustomPage)) return new MakeCustomPage();
  stream.Transform.call(this, {
    objectMode: true // needed for Vinyl
  });

  this._extension = extension || '.html';
};
util.inherits(MakeCustomPage, stream.Transform);

MakeCustomPage.prototype._transform = function(file, encoding, callback) {
  var apiSets = JSON.parse(fs.readFileSync('tmp/apisets.json', 'utf8'));
  var rootEnv = {};

  for (var setName in apiSets) {
    var set = apiSets[setName];
    set.forEach(function(type) {
      rootEnv[type] = true;
    });
  }

  var locals = {
    apiSets: apiSets,
    extension: this._extension,
    wrapInPageTemplate: true
  };

  var bodyTemplateFileName = path.basename(file.path).replace('.ejs', '');

  var output = template.render(bodyTemplateFileName, locals);
  if (locals.wrapInPageTemplate) {
    locals.body = output;
    output = template.render('page', locals);
  }

  var res = new File({
    path: bodyTemplateFileName + locals.extension,
    contents: new Buffer(output)
  });

  callback(null, res);
};

module.exports = MakeCustomPage;
