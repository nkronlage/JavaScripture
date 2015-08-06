'use strict';

var fs = require('fs');
var path = require('path');
var jsdoc = require('./jsdocparser.js');
var stream = require('stream');
var util = require('util');
var StringDecoder = require('string_decoder').StringDecoder;
var fs = require('fs');
var path = require('path');
var jsdoc = require('./jsdocparser.js');
var ejs = require('ejs');
var template = require('./template.js');
var File = require('vinyl');

var MakePage = function() {
  if (!(this instanceof MakePage)) return new MakePage();
  stream.Transform.call(this, {
    objectMode: true // needed for Vinyl
  });
};
util.inherits(MakePage, stream.Transform);

MakePage.prototype._transform = function(file, encoding, callback) {
  var apiSets = JSON.parse(fs.readFileSync('tmp/apisets.json', 'utf8'));
  var rootEnv = {};

  for (var setName in apiSets) {
    var set = apiSets[setName];
    set.forEach(function(type) {
      rootEnv[type.name] = true;
    });
  }

  var filename = file.path;
  var decoder = new StringDecoder('utf8');

  var obj = jsdoc.processFileContents(decoder.write(file.contents));
  obj.jsdocSourceFile = filename;

  var setName = path.basename(path.dirname(filename));
  obj.apiSet = { name: setName };


  // Validation
  var errors = [];
  var all = [].concat(obj.overloads, obj.constructors, obj.instanceProperties, obj.instanceMethods, obj.properties, obj.methods);

  all.forEach(function(member) {
    if (!member) {
      errors.push('undefined member in ' + obj.name);
      return;
    }

    if (!rootEnv[member.type]) {
      errors.push('No documentation for ' + member.type + ' referenced by ' + obj.name + '.' + member.name);
    }

    if (!member.spec) {
      errors.push('No spec for ' + obj.name + '.' + member.name);
    }
    
    if (!member.description) {
      errors.push('No description for ' + obj.name + '.' + member.name);
    }

    if (member.type ===  'Function') {
      // TODO: check member.parameters

      if (!rootEnv[member.returnType]) {
        errors.push('No documentation for ' + member.returnType + ' referenced by ' + obj.name + '.' + member.name);
      }
    }
  });


  if (errors.length) {
    console.warn(errors.join('\n'));
  }

  var body = template.render('object', { 
    obj: obj, 
  }); 

  var title = obj.name + ' JavaScript API';
  var html = template.render('page', {
    title: title, 
    body: body, 
    apiSets: apiSets, 
    obj: obj
  });

  var output = new File({
    path: obj.name + '.html',
    contents: new Buffer(html)
  });

  callback(null, output);
};

module.exports = MakePage;
