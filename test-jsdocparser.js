var jsdoc = require('./jsdocparser.js');
var util = require('util');

var assert = {
  ok: function(passed, message) {
    if (!passed) {
      console.log(message);
    }
  },
  equal: function(expected, actual, message) {
    if (expected !== actual) {
      message = message || 'expected ' + util.inspect(expected) + ' but got ' + util.inspect(actual);
      console.log(message);
    }
  },
  fail: function(message) {
    console.log(message);
  }
}


var compare = function(actual, expected) {
  if (expected === undefined) {
    assert.ok(actual === undefined, 'expected undefined');
    return;
  }
  
  if (actual === undefined) {
    assert.equal(expected, actual);
    return;
  }

  assert.equal(typeof actual, typeof expected);

  assert.equal(Array.isArray(actual), Array.isArray(expected));

  if (Array.isArray(expected)) {
    assert.equal(actual.length, expected.length);
    for (var i = 0; i < expected.length; i++ ) { 
      compare(actual[i], expected[i]);
    }
  }
  else if (expected instanceof Object) { 

    for (var propertyName in expected) {
      compare(actual[propertyName], expected[propertyName]);
    }

    for (var propertyName in actual) {
      if (propertyName in expected) {
        continue;
      }

      compare(actual[propertyName], expected[propertyName]);
    }
  }
  else {
    assert.equal(expected, actual);
  }
}

var testParse = function(string, expected) {
  console.log('Testing', string);
  compare(jsdoc.parseMember(string), expected);
  console.log();
};

testParse('foo : bar', // property
  { name: 'foo', 
    type: 'bar' });


testParse('foo(baz : bip) : bar', // function
  { name: 'foo', 
    type: 'Function', 
    returnType: 'bar',
    parameters: [ { name: 'baz', 
                    type: 'bip'}]});

testParse('foo(baz : bip, zip: zag) : bar', // function with multiple params
  { name: 'foo', 
    type: 'Function', 
    returnType: 'bar',
    parameters: [ { name: 'baz', 
                    type: 'bip'},
                  { name: 'zip',
                    type: 'zag'}]});

testParse("foo(baz = ',' : bip, zip: zag) : bar", // function with default values
  { name: 'foo', 
    type: 'Function', 
    parameters: [ { name: 'baz', 
                    type: 'bip',
                    defaultValue: "','"},
                  { name: 'zip',
                    type: 'zag'}],
    returnType: 'bar'});


testParse("foo(baz : bip,[ zip: zag]) : bar", // function with optional params
  { name: 'foo', 
    type: 'Function', 
    parameters: [ { name: 'baz', 
                    type: 'bip'},
                  [ { name: 'zip',
                      type: 'zag'}]],
    returnType: 'bar'});


testParse("foo(baz(zog : zug) : bip) : bar",  // nested functions
  { name: 'foo', 
    type: 'Function', 
    parameters: [ { name: 'baz', 
                    type: 'Function',
                    parameters: [{name: 'zog', type: 'zug'}],
                    returnType: 'bip'}],
    returnType: 'bar'});

testParse('a(b(c:d,e:f,g:h):i,[j:k]):l', // nested functions with optional params
  { name: 'a',
    type: 'Function',
    parameters: [ { name: 'b', 
                    type: 'Function',
                    parameters: [ { name: 'c',
                                    type: 'd' },
                                  { name: 'e',
                                    type: 'f' },
                                  { name: 'g',
                                    type: 'h' }],
                    returnType: 'i' },
                  [ { name: 'j',
                      type: 'k' }]],
    returnType: 'l' });


testParse('a(b : c, [d : e], f : g):h', // function with optional params
  { name: 'a',
    type: 'Function',
    parameters: [ { name: 'b', 
                    type: 'c' },
                  [ { name: 'd',
                      type: 'e' } ],
                  { name: 'f',
                    type: 'g' }],
    returnType: 'h' });


testParse('a(b : c, [d : e, [...]], f : g):h', // function with optional params
  { name: 'a',
    type: 'Function',
    parameters: [ { name: 'b', 
                    type: 'c' },
                  [ { name: 'd',
                      type: 'e' },
                    [ { name: '...' } ]],
                  { name: 'f',
                    type: 'g' }],
    returnType: 'h' });

testParse('a : b(c : d) : e', //type is a function (single parameters)
  { name: 'a',
    type: { name: 'b',
            type: 'Function',
            parameters: [ { name: 'c',
                            type: 'd' }],
            returnType: 'e' }
  });

testParse('a : b(c : d, e : f) : g', // type is a function (multiple parameters)
  { name: 'a',
    type: { name: 'b',
            type: 'Function',
            parameters: [ { name: 'c',
                            type: 'd' },
                          { name: 'e',
                            type: 'f' }],
            returnType: 'g' }
  });

testParse('a : { b : c }', // object (single property)
  { name: 'a',
    type: 'Object',
    properties: [ { name: 'b',
                    type: 'c' } ]
  });
    
testParse('a : { b : c, d : e }', // object (multiple properties)
  { name: 'a',
    type: 'Object',
    properties: [ { name: 'b',
                    type: 'c' },
                  { name: 'd',
                    type: 'e' } ]
  });

testParse('a : { b : c, d : { e : f } }', // subobjects
  { name: 'a',
    type: 'Object',
    properties: [ { name: 'b',
                    type: 'c' },
                  { name: 'd',
                    type: 'Object',
                    properties: [ { name: 'e',
                                    type: 'f' } ] 
                   } 
                ]
  });

testParse('a(b : { c : d }) : e', // function taking object parameter
  { name: 'a',
    type: 'Function',
    parameters: [ { name: 'b',
                    type: 'Object',
                    properties: [ { name: 'c',
                                    type: 'd' } ]
                  } ],
    returnType: 'e'
  });

testParse('a(b : { c : d, e : f }) : g', // object
  { name: 'a',
    type: 'Function',
    parameters: [ { name: 'b',
                    type: 'Object',
                    properties: [ { name: 'c',
                                    type: 'd' },
                                  { name: 'e',
                                    type: 'f' } ]
                  } ],
    returnType: 'g'
  });

testParse('a(b : c) : { d : e, f : g }', // function returning object parameter
  { name: 'a',
    type: 'Function',
    parameters: [ { name: 'b',
                    type: 'c' } ],
    returnType: { type: 'Object',
                  properties: [ { name: 'd',
                                  type: 'e' },
                                { name: 'f',
                                  type: 'g' } ] }
  });

testParse('a : b<c>', // template types
  { name: 'a',
    type: { name: 'b',
            templates: [ 'c' ] }
  });

testParse('a : b /* c */', // comments
  { name: 'a',
    type: 'b',
    description: 'c'
  });

testParse('a : { b : c /* d */ } /* e */', // object with comments
  { name: 'a',
    type: 'Object',
    properties: [ { name: 'b',
                    type: 'c',
                    description: 'd' } ],
    description: 'e'
  });

testParse('[b : c] : d', // indexer
  { type: 'Indexer',
    parameters: [ { name: 'b',
                    type: 'c'} ],
    returnType: 'd'
  });

testParse('[a.b] : c', // symbol indexer
  { type: 'Indexer',
    parameters: [ { name: 'a.b' } ],
    returnType: 'c'
  });
