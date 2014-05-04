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
    rootEnv[type] = true;
  });
}

var locals = {
  apiSets: apiSets,
  extension: '.html',
  wrapInPageTemplate: true
};

var bodyTemplateFileName = process.argv[2].replace('.ejs', '').replace('templates/', '');

var output = template.render(bodyTemplateFileName, locals);
if (locals.wrapInPageTemplate) {
  locals.body = output;
  output = template.render('page', locals);
}

fs.writeFileSync('site/' + bodyTemplateFileName + locals.extension, output);
