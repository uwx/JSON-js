
/*
Contains content from HJSON-JS <https://github.com/hjson/hjson-js> under MIT:

The MIT License (MIT)

Copyright (c) 2014-2017 Christian Zangl

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

/*
  json_parse.js
  2016-05-02

  Public Domain.

  NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

  This file creates a json_parse function.

    json_parse(text, reviver)
      This method parses a JSON text to produce an object or array.
      It can throw a SyntaxError exception.

      The optional reviver parameter is a function that can filter and
      transform the results. It receives each of the keys and values,
      and its return value is used instead of the original value.
      If it returns what it received, then the structure is not modified.
      If it returns undefined then the member is deleted.

      Example:

      // Parse the text. Values that look like ISO date strings will
      // be converted to Date objects.

      myData = json_parse(text, function (key, value) {
        var a;
        if (typeof value === "string") {
          a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
          if (a) {
            return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
              +a[5], +a[6]));
          }
        }
        return value;
      });

  This is a reference implementation. You are free to copy, modify, or
  redistribute.

  This code should be minified before deployment.
  See http://javascript.crockford.com/jsmin.html

  USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
  NOT CONTROL.
*/

/*jslint for */

/*property
  at, b, call, charAt, f, fromCharCode, hasOwnProperty, message, n, name,
  prototype, push, r, t, text
*/
'use strict';

function getAllPropertyNames(obj) {
  var props = [];

  do {
    for (let prop of Object.getOwnPropertyNames(obj)) {
      if (props.indexOf(prop) == -1) {
        props.push(prop); 
      }
    }
  } while ((obj = Object.getPrototypeOf(obj)));

  return props;
}

/*
ParseError from https://github.com/substack/node-syntax-error under MIT:

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
function parseError(line, column, src) {
  return 'at line ' + line + ':' + column
        + '\n    '
        + src.split('\n')[line - 1]
        + '\n    '
        + ' '.repeat(column) + '^';
}

const lineColumn = require('line-column');

var json_parse = (function() {

  // This is a function that can parse a JSON text, producing a JavaScript
  // data structure. It is a simple, recursive descent parser. It does not use
  // eval or regular expressions, so it can be used as a model for implementing
  // a JSON parser in other languages.

  // We are defining the function inside of another function to avoid creating
  // global variables.

  var at; // The index of the current character
  var ch; // The current character
  var escapee = {
    '"': '"',
    '\\': '\\',
    '/': '/',
    b: '\b',
    f: '\f',
    n: '\n',
    r: '\r',
    t: '\t'
  };
  var text;

  class JSONSyntaxError extends SyntaxError {
    constructor(message, at, text) {
      // Calling parent constructor of base Error class.
      super(message);
      
      // Saving class name in the property of our custom error as a shortcut.
      this.name = 'JSONSyntaxError';
      
      // Capturing stack trace, excluding constructor call from it.
      Error.captureStackTrace(this, error);
      
      //this.at = at;
      //this.text = text;

      //console.log(text, text.length, at);
      const index = lineColumn(text, at-1);
      const syntaxError = parseError(index.line, index.col-1, text);
      //console.log(syntaxError);
      this.stack = syntaxError + '\n' + this.stack;

      //console.log(getAllPropertyNames(this).map(e => e + ': ' + this[e]).join(',\n  '));

      /*try {
        throw {
          name: 'SyntaxError',
          message: message,
          at: at,
          text: text,
        };
      } catch (e) {
        console.log(e);
        console.error(e);
      }*/
    }
  }

  // Call error when something is wrong.
  function error(m) {
    throw new JSONSyntaxError(m, at, text);
  }

  // If a c parameter is provided, verify that it matches the current character.
  function next(c) {
    if (c && c !== ch) {
      error("Expected '" + c + "' instead of '" + ch + "'");
    }

    // Get the next character. When there are no more characters,
    // return the empty string.

    ch = text.charAt(at);
    at += 1;
    return ch;
  }

  // std: peek N chars (if !soft will error on EOF)
  // alt: peek look for string N (also obeys soft)
  function peek(n, soft = true) {
    if (typeof n == 'string') {
      return peek(n.length, soft) == n;
    }
    if (at + n > text.length) {
      if (!soft) {
        error('Ended prematurely: expected at least ' + n + ' characters after "' + ch + '"');
      } else {
        return text.substring(at, text.length);
      }
    }
    return text.substring(at, at+n);
  }

  // find a char at offset
  function peekChar(offs) {
    // range check is not required
    return text.charAt(at + offs);
  }

  // Parse a number value.
  function number() {
    var value;
    var string = '';

    if (ch === '-') {
      string = '-';
      next('-');
    }
    while (ch >= '0' && ch <= '9') {
      string += ch;
      next();
    }
    if (ch === '.') {
      string += '.';
      while (next() && ch >= '0' && ch <= '9') {
        string += ch;
      }
    }
    if (ch === 'e' || ch === 'E') {
      string += ch;
      next();
      if (ch === '-' || ch === '+') {
        string += ch;
        next();
      }
      while (ch >= '0' && ch <= '9') {
        string += ch;
        next();
      }
    }
    value = +string;
    if (!isFinite(value)) {
      error('Number is Infinity/NaN');
    } else {
      return value;
    }
  }
  
  // Parse a string value.
  function string() {
    var hex;
    var i;
    var value = '';
    var uffff;

    // When parsing for string values, we must look for " and \ characters.

    if (ch === '"') {
      while (next()) {
        if (ch === '"') {
          next();
          return value;
        }
        if (ch === '\\') {
          next();
          if (ch === 'u') {
            uffff = 0;
            for (i = 0; i < 4; i += 1) {
              hex = parseInt(next(), 16);
              if (!isFinite(hex)) {
                break;
              }
              uffff = uffff * 16 + hex;
            }
            value += String.fromCharCode(uffff);
          } else if (typeof escapee[ch] === 'string') {
            value += escapee[ch];
          } else {
            break;
          }
        } else {
          value += ch;
        }
      }
    }
    error('Bad string');
  }

  // Parse a multiline string value.
  function stringMultiline() {
    next();

    // Parse a multiline string value.
    var string = '';

    // we are at ''' +1 - get indent
    var indent = 0;
    while (true) {
      var c=peekChar(-indent-2); // was -5
      if (!c || c === '\n') break;
      indent++;
    }

    function skipIndent() {
      var skip = indent;
      while (ch && ch <= ' ' && ch !== '\n' && skip-- > 0) next();
    }

    // skip white/to (newline)
    while (ch && ch <= ' ' && ch !== '\n') next();
    if (ch === '\n') {
     next(); skipIndent(); 
    }

    // When parsing multiline string values, we must look for ' characters.
    while (true) {
      if (!ch) {
        error('Bad multiline string');
      } else if (ch === '`') {
        next();
        if (string.slice(-1) === '\n') string=string.slice(0, -1); // remove last EOL
        return string;
      }
      if (ch === '\n') {
        string += '\n';
        next();
        skipIndent();
      } else {
        if (ch !== '\r') string += ch;
        next();
      }
    }
  }

  // Skip whitespace. 
  function white() {
    while (ch) {
      // Skip spaces & control characters
      while (ch && ch <= ' ') next();
      // Allow comments
      if (ch === '#' || ch === '/' && peek(1) === '/') {
        while (ch && ch !== '\n') next();
      } else if (ch === '/' && peek(1) === '*') {
        next(); next();
        while (ch && !(ch === '*' && peek(1) === '/')) next();
        if (ch) {
          next(); next();
        }
      } else break;
    }
  }

  // true, false, or null.
  function word() {
    switch (ch) {
      case 't':
        next('t');
        next('r');
        next('u');
        next('e');
        return true;
      case 'f':
        next('f');
        next('a');
        next('l');
        next('s');
        next('e');
        return false;
      case 'n':
        next('n');
        next('u');
        next('l');
        next('l');
        return null;
    }
    error("Unexpected '" + ch + "'");
  }

  // Parse an array value.
  function array() {
    var arr = [];

    if (ch === '[') {
      next('[');
      white();
      while (ch) {
        // ignore trailing commas in arrays
        if (ch === ']') {
          next(']');
          return arr; // empty array
        }
        arr.push(value());
        white();
        if (ch === ']') {
          next(']');
          return arr;
        }
        next(',');
        white();
      }
    }
    error('Bad array');
  }

  // Parse an object value.
  function object() {
    var key;
    var obj = {};

    if (ch === '{') {
      next('{');
      white();
      while (ch) {
        // ignore trailing commas in objects
        if (ch == '}') {
          next('}');
          return obj;
        }
        key = string();
        white();
        next(':');
        if (Object.hasOwnProperty.call(obj, key)) {
          error("Duplicate key '" + key + "'");
        }
        obj[key] = value();
        white();
        if (ch === '}') {
          next('}');
          return obj;
        }
        next(',');
        white();
      }
    }
    error('Bad object');
  }


  // Parse a JSON value. It could be an object, an array, a string, a number,
  // or a word.
  function value() {
    white();
    switch (ch) {
      case '{':
        return object();
      case '[':
        return array();
      case '"':
        return string();
      case '`':
        return stringMultiline();
      case '-':
        return number();
      default:
        return (ch >= '0' && ch <= '9') ?
          number() :
          word();
    }
  }

  // Return the json_parse function. It will have access to all of the above
  // functions and variables.

  return function(source, reviver) {
    var result;

    text = source;
    at = 0;
    ch = ' ';
    result = value();
    white();
    if (ch) {
      error('Syntax error');
    }

    // If there is a reviver function, we recursively walk the new structure,
    // passing each name/value pair to the reviver function for possible
    // transformation, starting with a temporary root object that holds the result
    // in an empty key. If there is not a reviver function, we simply return the
    // result.

    return (typeof reviver === 'function') ?
      (function walk(holder, key) {
        var k;
        var v;
        var val = holder[key];
        if (val && typeof val === 'object') {
          for (k in val) {
            if (Object.prototype.hasOwnProperty.call(val, k)) {
              v = walk(val, k);
              if (v !== undefined) {
                val[k] = v;
              } else {
                delete val[k];
              }
            }
          }
        }
        return reviver.call(holder, key, val);
      }({ '': result }, '')) :
      result;
  };
}());

module.exports = json_parse;