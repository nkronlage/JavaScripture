'use strict';

var fs = require('fs');
var template = require('./template.js');


var currentObj;

var processFile = function(filename) {
  var contents = fs.readFileSync(filename, 'utf8');
  return processFileContents(contents);
};


var processFileContents = function(contents) {
  var fragments = contents.split(/^----+$/m);
  var obj = processObject(fragments.shift());

  if (fragments.length) {
    fragments.forEach(function(member) {
      processFragment(obj, member);
    });

    // combine instance and prototype properties and methods into a common array
    obj.instanceMethods = [];
    obj.instanceProperties = [];
    obj.instanceIndexers = [];
    var placeMember = function(m) {
      var place = obj.instanceProperties;
      if (m.type === 'Function') {
        place = obj.instanceMethods;
      }
      else if (m.type === 'Indexer') {
        place = obj.instanceIndexers;
      }
      place.push(m);
    };
    obj.instanceMembers.forEach(placeMember);
    obj.prototypeMembers.forEach(placeMember);

    obj.methods = [];
    obj.properties = [];
    obj.members.forEach(function(m) {
      (m.type === 'Function' ? obj.methods : obj.properties).push(m);
    });

    var nameComparison = function(m1, m2) {
      if (!m1.name) {
        console.log('ERROR: no name for ', m1);
        throw Error('ERROR: no name for ' + m1);
      }
      var comparison = m1.name.toLowerCase().localeCompare(m2.name.toLowerCase());
      return comparison;
    };

    var parametersComparison = function(params1, params2) {
      var comparison = params1.length - params2.length;

      if (comparison === 0) {

        // Parameters lengths are the same, sort by parameter type names
        for (var i = 0; i < params1.length; i++) {
          var p1 = params1[i];
          var p2 = params2[i];

          if (Array.isArray(p1) && !Array.isArray(p2)) {
            comparison = -1;
          }
          else if (!Array.isArray(p1) && Array.isArray(p2)) {
            comparison = 1;
          }
          else if (Array.isArray(p1) && Array.isArray(p2)) {
            comparison = parametersComparison(p1, p2);
          }
          else {
            comparison = p1.name.localeCompare(p2.name);
          }

          if (comparison !== 0) {
            break;
          }
        }
      }

      return comparison;
    };

    var functionComparison = function(f1, f2) {
      var comparison = nameComparison(f1, f2);

      if (comparison === 0) {
        // Names are the same, sort by parameters
        comparison = parametersComparison(f1.parameters, f2.parameters);
      }
      

      return comparison;
    };

    obj.instanceMethods.sort(functionComparison);
    obj.instanceProperties.sort(nameComparison);
    obj.instanceEvents.sort(nameComparison);
    obj.methods.sort(functionComparison);
    obj.properties.sort(nameComparison);

    var join = function(members) {
      var joined = [];
      //console.log('members.length = ' + members.length);
      var prev;
      for (var i = 0; i < members.length; i++) {
        var member = members[i];
        if (prev && member.name === prev.name) {
          if (Array.isArray(prev)) {
            prev.push(member);
          }
          else {
            joined.pop();
            prev = [prev, member];
            prev.name = member.name;
            joined.push(prev);
          }
        }
        else {
          joined.push(member);
          prev = member;
        }
      }
      return joined;
    };

    obj.instanceMethods = join(obj.instanceMethods);
    obj.methods = join(obj.methods);
  }
  else {
    obj.constructors = [];
    obj.instanceMethods = [];
    obj.instanceProperties = [];
    obj.instanceIndexers = [];
    obj.methods = [];
    obj.properties = [];
  }


  return obj;
};

// TODO: merge with processFragment?
var processObject = function(fragment) {
  var lines = fragment.split('\n');
  var obj = parseMember(lines.shift());
  currentObj = obj;

  processMetadata(obj, lines);


  obj.overloads = []; // Parameter overloads if Obj is a Function
  obj.constructors =  []; // Constructor overloads if Obj is a Constructor Function
  obj.members = []; // Obj members
  obj.instanceMembers = []; // Instance members 
  obj.instanceEvents = []; // Instance events 
  obj.prototypeMembers = []; // Prototype members

  return obj;
};

var processInstanceMember = function(obj, frag) {
  frag = frag.replace(/^instance\.?/, '');
  var member = parseMember(frag);
  obj.instanceMembers.push(member);
  member.source = 'instance';
  return member;
};

var processInstanceEvent = function(obj, frag) {
  frag = frag.replace(/^event\./, '');
  var member = parseMember(frag);
  member.onname = member.onname || 'on' + member.name;
  obj.instanceEvents.push(member);
  member.source = 'event';
  return member;
};

var processPrototypeMember = function(obj, frag) {
  frag = frag.replace(/^prototype\./, '');
  var member = parseMember(frag);
  obj.prototypeMembers.push(member);
  member.source = 'prototype';
  return member;
};

var processConstructor = function(obj, frag) {
  frag = frag.replace(/^new /, '');
  var member = parseMember(frag);
  obj.constructors.push(member);
  member.isConstructor = true;
  return member;
};

var processOverload = function(obj, frag) {
  var member = parseMember(frag);
  obj.overloads.push(member);
  return member;
};

var processMember = function(obj, frag) {
  var member = parseMember(frag);
  obj.members.push(member);
  return member;
};

var processFragment = function(obj, desc) {
  var lines = desc.trim().split('\n');
  var first = lines.shift();

  var trailingBackslash = /\\\s*$/;

  while (trailingBackslash.test(first)) {
    first = first.replace(trailingBackslash, ' ');
    first += lines.shift();
  }

  if (first === '' && lines.length === 0) {
    return;
  }

  var member;

  if (/^instance(\.|\[)/.test(first)) {
    member = processInstanceMember(obj, first);
  }
  else if (/^event\./.test(first)) {
    member = processInstanceEvent(obj, first);
  }
  else if (/^prototype\./.test(first)) {
    member = processPrototypeMember(obj, first);
  }
  else if (/^new /.test(first)) {
    member = processConstructor(obj, first);
  }
  else if (new RegExp('^'+obj.name).test(first)) {
    member = processOverload(obj, first);
  }
  else if (/^Details:\s*$/.test(first)) {
    obj.details = processMarkup(obj, lines.join('\n').trim());
    return;
  }
  else {
    member = processMember(obj, first);
  }

  if (member) {
    processMetadata(member, lines);
  }
};


var processMetadata = function(member, lines) {
  var metadataProcessors = {
    description: processMarkup,
  };

  // Process 'Label:' lines 
  var prop = 'description';

  for (var i = 0; lines.length > 0 && i <= lines.length; i++) {
    var res;
    if (i === lines.length || (res = /^(\w+):\s*$/.exec(lines[i]))) {
      var value = lines.splice(0, i).join('\n').trim();

      if (prop in metadataProcessors) {
        value = metadataProcessors[prop](member, value);
      }

      member[prop] = value;

      lines.shift(); // pull off this line ('ReadOnly:')
      prop = res ? res[1].toLowerCase() : ''; // set the property value
      i = 0;
    }
  }
};


var createHtml = function(html) {
  html = replaceLinks(html);
  html = replaceCode(html);
  return html;
};

var createTag = function(html, obj, tag) {
  html = replaceLinks(html);
  html = replaceCode(html);
  return '<' + tag + '>' + html + '</' + tag + '>';
};

var createHtmlExample = function(code, obj) {
  obj.hasExample = true;
  return template.render('htmlexample', { code: code, objectName: currentObj.name, propertyName: obj.name });
};

var createExample = function(code, obj) {
  obj.hasExample = true;
  return template.render('example', { code: code, objectName: currentObj.name, propertyName: obj.name });
};

var tags = {
  'html': createHtml,
  'h3': createTag,
  'p': createTag,
  'em': createTag,
  'code': createTag,
  'htmlexample': createHtmlExample,
  'example': createExample,
};

var processMarkup = function(obj, desc) {
  var res = '';

  var parts;
  var rest = desc;

  var regexp = RegExp('([\\s\\S]*?)\\<(' + Object.keys(tags).join('|') + ')\\>([\\s\\S]*?)\\<\\/\\2\\>([\\s\\S]*)', 'm');

  while (parts = rest.match(regexp)) {
    var before = parts[1];
    var tag = parts[2];
    var content = parts[3];

    var converter = tags[tag];
    res += linkify(before);
    res += converter(content, obj, tag); 

    rest = parts[4];
  }

  res += linkify(rest);

  return res;
};

var htmlEscape = function(str) {
  str = str.replace(/&/g, '&amp;');
  str = str.replace(/</g, '&lt;');
  str = str.replace(/>/g, '&gt;');
  return str;
};

var replaceLinks = function(str) {
  return str.replace(/%%(.*?)(?:\|(.*?))%%/g, function(str, p1, p2) {
    p2 = p2 || p1;
    return "<a href='" + p1 + "'>" + p2 + "</a>";
  });
};

var replaceCode = function(str) {
  return str.replace(/\*\*(.*?)\*\*/gm, function(str, p1) {
    return "<code>" + p1 + "</code>";
  });
};

var linkify = function(description) {
  var res = description;

  res = res.replace(/\n/g, ' ');
  res = htmlEscape(res);
  res = replaceLinks(res);
  res = replaceCode(res);

  return res;
};

var parseMember = function(member) {
  member = member.trim();

  if (member === '...') {
    return { name: '...'};
  }

  if (!member.match(/:/)) {

    var res;
    // See if member has a <type>
    if (res = member.match(/\s*(\w*)\s*\<(.*)\>/)) {
      name = res[1];

      return { name: name,
               templates: parseParamList(res[2]) };
    }
    return member;
  }

  var split = -1;
  var depth = 0;
  var defaultValueSplit = -1; 
  var inComment = false;

  var parenStack = [];
  var parens = [['(', ')'],
                ['{', '}'],
                ['[', ']'],
                ['<', '>']];

  for (var i = 0; i < member.length; i++) {
    if (inComment) {
      if (member[i] === '*' && member[i + 1] === '/') {
        inComment = false;
      }
      continue;
    }

    // See if the character is one of the parens
    for (var j = 0; j < parens.length; j++) {
      var pair = parens[j];

      // If it is a left paren, push it on the stack
      if (member[i] === pair[0]) {
        parenStack.push(member[i]);
      }
      else if (member[i] === pair[1]) {
        // If it is a right paren, see if it matches the top paren of on the stack
        if (!parenStack.length) {
          throw Error('empty paren stack');
        }
        if (parenStack[parenStack.length - 1] !== pair[0]) {
          throw Error('Mismatched parens.  Expected: \'' + pair[0] + '\' but got \'' + parenStack[parenStack.length - 1] + '\'. (processing ' + member + ')');
        }
        parenStack.pop();
      }
    }

    if (member[i] === '/' && member[i + 1] === '*') inComment = true;

    if (member[i] === '=' && parenStack.length === 0) {
      defaultValueSplit = i;
    }
    if (member[i] === ':' && parenStack.length === 0) {
      split = i;
      break;
    }
  }

  var name;
  var defaultValue; 
  if (defaultValueSplit !== -1) {
    name = member.substring(0, defaultValueSplit).trim();
    defaultValue = member.substring(defaultValueSplit + 1, split).trim();
  }
  else if (split === -1) {
    var res = member.match(/\{(.*)\}/);
    if (!res) throw Error('parse error for member: ' + member);

    return { type: 'Object',
             properties: parseParamList(res[1])};
  }
  else {
    if (split === -1) throw Error('parse error');
    name = member.substring(0, split).trim();
  }

  var type = member.substring(split + 1).trim();

  var description;

  var res;
  if (type.length > 2 && type.lastIndexOf('*/') === type.length - 2) {
    var commentStartIndex = type.lastIndexOf('/*');
    description = processMarkup(currentObj, type.substring(commentStartIndex + 2, type.length - 2).trim());
    type = type.substring(0, commentStartIndex).trim();
  }

  // Process Indexer [Symbol]
  if (res = name.match(/^\s*\[\s*(\w*\.\w*)\s*\]/)) {
    return { parameters: [{ name: res[1] }],
             type: 'Indexer',
             returnType: parseMember(type),
             description: description };
  }

  // Process Indexer
  if (res = name.match(/^\s*\[(.*)\]/)) {
    return { parameters: parseParamList(res[1]),
             type: 'Indexer',
             returnType: parseMember(type),
             description: description };
  }

  // Process method
  if (res = name.match(/^\s*(\w*)\s*\((.*)\)/)) {
    name = res[1];

    return { name: name,
             parameters: parseParamList(res[2]),
             type: 'Function',
             returnType: parseMember(type),
             defaultValue: defaultValue,
             description: description };
  }

  if (res = type.match(/\s*\{(.*)\}/)) {

    return { name: name,
             type: 'Object',
             properties: parseParamList(res[1]),
             description: description };
  }

  return { name: name,
           type: parseMember(type),
           defaultValue: defaultValue,
           description: description };
};


//jsdoc.parseMember('a(b : c, [..., [f : g]]) : h');


var parseParamList = function(params) {
  var split = -1;
  var paramsList = [];
  var depth = 0;
  var optionalDepth = 0;
  var inQuote = false;
  var inComment = false;
  for (var i = 0; i < params.length; i++) {
    if (inComment) {
      if (params[i] === '*' && params[i + 1] === '/') inComment = false;
      continue;
    }

    if (params[i] === '(') depth++;
    if (params[i] === ')') depth--;

    if (params[i] === '{') depth++;
    if (params[i] === '}') depth--;

    if (params[i] === '<') depth++;
    if (params[i] === '>') depth--;

    if (params[i] === '/' && params[i + 1] === '*') inComment = true;

    if (params[i] === '\'') inQuote=!inQuote; 
    if (params[i] === '[') {
      optionalDepth++;
      split = i;
    }

    //if (params[i] === ']') optionalDepth--;
    if ((params[i] === ',' || params[i] === ']') && depth === 0 && !inQuote) {
      var param = params.substring(split + 1, i);
      
      // if there are no 'word' characters, ignore this substring. 
      // This can happen if you have ],
      if (param.match(/\w/) || param.match(/\.\.\./)) {
        paramsList.push({param: param, optionalDepth: optionalDepth});
      }
      split = i;
    }
    if (params[i] === ']') optionalDepth--;
  }
  // Add the last one
  var param = params.substring(split + 1);
  if (param.match(/\w/) || param.match(/\.\.\./)) {
    paramsList.push({param: param, optionalDepth: optionalDepth});
  }
  
  params = paramsList.map(function(m) { 
    m.param = m.param.replace(/\[/g, '');
    m.param = m.param.replace(/\]/g, '');
    var member = parseMember(m.param);

    if (typeof member !== 'string') {
      // When parsing templates (like Array<String>), the param may not have a
      // name and be of type string, which can't have properties set on it.
      member.optionalDepth = m.optionalDepth;
    }
    return member; 
  });

  // Group the params
  var grouped = [[]];

  while (params.length) {
    var param = params.shift();
    if (param.optionalDepth > grouped.length - 1) {
      grouped.unshift([]);
    }
    while (param.optionalDepth < grouped.length - 1) {
      var finishedGroup = grouped.shift();
      grouped[0].push(finishedGroup);
    }
    grouped[0].push(param);
    delete param.optionalDepth;
  }
  
  while (grouped.length > 1) {
    var finishedGroup = grouped.shift();
    grouped[0].push(finishedGroup);
  }


  return grouped[0];
};


exports.processFile = processFile;
exports.processFileContents = processFileContents;



if (false) {
  // Better regexp syntax?
  var notQuoteOrBackslash = zeroOrMore(anyCharBut("\"\\"));
  notQuoteOrBackslash.then( zeroOrMore( "\\.".then(notQuoteOrBackSlash) ));
}

exports.parseMember = parseMember;

