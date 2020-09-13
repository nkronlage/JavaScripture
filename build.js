'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const jsdoc = require('./jsdocparser.js');
const ejs = require('ejs');
const template = require('./template.js');

const sets = {};

const generateMetadata = filename => {
  console.log(`Generating metadata for ${filename}`);
  const obj = jsdoc.processFile(filename);

  if (!new RegExp('/' + obj.name + '\\.jsdoc', 'i').test(filename)) {
    throw `Object ${obj.name} defined in unexpected file ${filename}`;
  }

  obj.jsdocSourceFile = filename;

  const setName = path.basename(path.dirname(filename));

  const hasDescriptions = !!obj.description ||
    obj.constructors.some(constructor => !!constructor.description) ||
    obj.instanceMembers.some(member => !!member.description) || 
    obj.prototypeMembers.some(member => !!member.description);

  const metadata = {
    name: obj.name,
    setName: setName,
    hasDescriptions: hasDescriptions
  };

  const addMembers = name => {
    metadata[name] = obj[name].map(member => ({ name: member.name, onname: member.onname }));
  };

  addMembers('instanceProperties');
  addMembers('instanceMethods');
  addMembers('instanceEvents');
  addMembers('properties');
  addMembers('methods');

  let set = sets[setName];
  if (!set) {
    set = sets[setName] = [];
  }
  set.push(metadata);

  const pretty = false;
  const json = JSON.stringify(metadata, null, pretty ? ' ' : undefined);

  fs.writeFileSync(`./tmp/metadata/${obj.name}.json`, json, { flag: 'wx' });

  obj.apiSet = { name: setName };
  createPage(obj);
};


const createPage = (obj) => {
  // Validation
  const errors = [];
  const all = [].concat(obj.overloads, obj.constructors, obj.instanceProperties, obj.instanceMethods, obj.properties, obj.methods);

  all.forEach(member => {
    if (!member) {
      errors.push('undefined member in ' + obj.name);
      return;
    }

    if (!member.spec) {
      errors.push('No spec for ' + obj.name + '.' + member.name);
    }
    
    if (!member.description) {
      errors.push('No description for ' + obj.name + '.' + member.name);
    }

    if (member.type ===  'Function') {
      // TODO: check member.parameters
    }
  });


  if (errors.length) {
    console.warn(errors.join('\n'));
  }

  const body = template.render('object', { obj }); 

  const title = obj.name + ' JavaScript API';
  const html = template.render('page', { title, body, obj });

  fs.writeFileSync(`./docs/${obj.name}.html`, html);
};


fs.rmdirSync('./tmp', { recursive: true });
fs.mkdirSync('./tmp/metadata', { recursive: true });

fs.readdirSync('./docs').map(doc => {
    fs.unlinkSync(`./docs/${doc}`);
  });

fs.readdirSync('./content').map(set => {
    fs.readdirSync(`./content/${set}/`).map(doc => {
        generateMetadata(`./content/${set}/${doc}`);
      });
  });

for (const set of Object.values(sets)) {
  set.sort((a, b) => a.name.localeCompare(b.name));
}

fs.writeFileSync('./tmp/apisets.json', JSON.stringify(sets));

const makeCustomPage = (page, extension = 'html') => {
  const locals = {
    apiSets: sets,
    wrapInPageTemplate: true
  };

  let output = template.render(page, locals);
  if (locals.wrapInPageTemplate) {
    locals.body = output;
    output = template.render('page', locals);
  }

  fs.writeFileSync(`./docs/${page}.${extension}`, output);
};

makeCustomPage('feedback');
makeCustomPage('index');
makeCustomPage('license');
makeCustomPage('thankyou');
makeCustomPage('javascripture', 'js');

fs.readdirSync('./static').map(file => {
    fs.copyFile(`./static/${file}`, `./docs/${file}`, err => { if (err) { throw err } });
  });

