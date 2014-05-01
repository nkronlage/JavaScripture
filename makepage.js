'use strict';

var fs = require('fs');
var path = require('path');
var jsdoc = require('./jsdocparser.js');
var ejs = require('ejs');
var template = require('./template.js');

var apiSets = JSON.parse(fs.readFileSync('tmp/apisets.json', 'utf8'));
var rootEnv = {};

for (var setName in apiSets) {
  var set = apiSets[setName];
  set.forEach(function(type) {
    rootEnv[type.name] = true;
  });
}

var filename = process.argv[2];

var obj = jsdoc.processFile(filename);
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

var renderPage = function(title, body, obj) {
};


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

fs.writeFileSync('site/' + obj.name + '.html', html);
