'use strict';

const fs = require('fs');
const ejs = require('ejs');


// Used by template renderer to generate an id for a member
const getAnchorName = member => {
  if (member.type === 'Function'|| member.type === 'Indexer') {
    let res = '';

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

    const joinNames = function(params) {
      for (let i = 0; i < params.length; i++) {
        if (Array.isArray(params[i])){
          joinNames(params[i]);
        }
        else if (params[i].name === '...') {
          res += '_dotdotdot';
        }
        else if (typeof params[i].type === 'string') {
          res += '_' + params[i].type;
        }
        else if (member.type === 'Indexer') {
          // Indexer like this[Symbol.iterator]
          res += '_' + params[i].name.replace(/\./g, '_');
        }
        else if (params[i].type.name) {
          res += '_' + params[i].type.name;
        }
        else {
          console.error('Unexpected type');
          console.dir(params[i].type);
          throw 'Unexpected type';
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

const getPageDescription = function(obj) {
  let pageDesc = 'Interactive API reference for the JavaScript ' + obj.name + ' Object. ' + obj.description;
  pageDesc = pageDesc.replace(/\<.*?\>/g, '');
  return pageDesc.substring(0, 200);
};

const getVersionClass = (version) => {
  if (!/^ECMAScript 20\d\d$/.test(version)) {
    throw Error('unknown version: ' + version);
  }
  return version.replace(' ', '').toLowerCase();
};


let currentObj;
const templates = {};

const render = (filename, locals) => {
  const template = templates[filename] || fs.readFileSync('templates/' + filename + '.ejs', 'utf8');
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

  const result = ejs.render(template, locals);

  if (filename === 'object') {
    currentObj = undefined;
  }

  return result;
};


exports.render = render;
