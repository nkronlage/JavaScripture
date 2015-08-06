'use strict';

var fs = require('fs');
var ejs = require('ejs');


// Used by template renderer to generate an id for a member
var getAnchorName = function(member) {
  if (member.type === 'Function'|| member.type === 'Indexer') {
    var res = '';

    if (member.isConstructor) {
      res += 'new_';
    }

    if (member.type === 'Indexer') {
      res += 'indexer';
    }
    else {
      res += member.name;
    }
    
    if (!member.parameters && !member.returnType) {
      console.log('warning: ' + res + ' is missing parameters - probably defined as foo : Function instead of foo(bar)'); 

      return res;
    }

    if (!member.parameters || !member.returnType) {
      console.dir(member);
      throw Error(res + ' is missing parameters/returnType - probably defined as foo : Function instead of foo(bar)'); 

      return res;
    }

    var joinNames = function(params) {
      for (var i = 0; i < params.length; i++) {
        if (Array.isArray(params[i])){
          joinNames(params[i]);
        }
        else if (params[i].name === '...') {
          res += '_dotdotdot';
        }
        else {
          res += '_' + params[i].type;
        }
      }
    };

    joinNames(member.parameters);

    if (res === member.name) {
      res += '_';
    }
    return res;
  }
  else {
    return member.name;
  }
};

var getPageDescription = function(obj) {
  var pageDesc = 'Interactive API reference for the JavaScript ' + obj.name + ' Object. ' + obj.description;
  pageDesc = pageDesc.replace(/\<.*?\>/g, '');
  return pageDesc.substring(0, 200);
};

var getVersionClass = function(version) {
  if (version === 'ECMAScript 6') {
    return 'ecmascript6';
  }
  else {
    throw Error('unknown version: ' + version);
  }
};


var currentObj;
var templates = {};

var render = function(filename, locals) {
  var template = templates[filename] || fs.readFileSync('templates/' + filename + '.ejs', 'utf8');
  templates[filename] = template;

  if (filename === 'object') {
    currentObj = locals.obj;
  }

  locals.render = render;
  locals.currentObj = currentObj;
  locals.getPageDescription = getPageDescription;
  locals.getAnchorName = getAnchorName;
  locals.getVersionClass = getVersionClass;
  locals.filename = __dirname + '/templates/' + filename;

  locals.locals = locals; // compat for old version of ejs

  var result = ejs.render(template, locals);

  if (filename === 'object') {
    currentObj = undefined;
  }

  return result;
};


exports.render = render;
