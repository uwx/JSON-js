# lmjson

Lean and simple JSON. For humans to write.

## Usage

```js
const lmjsonParse = require('lmjson');

const object = lmjsonParse(`{
  /* your LMJSON */
  key: @"value"
}`);

console.log(object) // { key: 'value' }
```

## Object -> LMJSON

LMJSON is designed only to be parsed. You cannot serialize an object into LMJSON.
On the other hand, most JavaScript object initializers are valid LMJSON, so you can use that.

## Syntax example

```
{ 
  // Key names without quotes
  wemes: "cool",
  // No reserved names
  boolean: true,
  // Inline regular expressions
  regexp: /sed/g,
  "array": [
    0, 1, 2, 3, 1.5, 8, // Trailing commas in arrays
  ],
  "nested": {
    "array": [
      1, 4,
      # Comment in a weird place
      5
    ],
    "whew": {
      "another": true
    }
  },
  "come": "on!",
  // Literal string, backslashes are ignored
  "lstrin": @"Literal string\My Documents\Memes\",
  // Can also have single-quote keys!
  'single-quote keyname': "double-quote value",
  // And literals there too!
  @'single-quote\literal keyname': "double-quote value",
  @"double-quote\literal keyname": @'single\lit value\',
  // Multiline strings like in JavaScript ES6
  multiline: `multiline string in one line`,
  multilin2: `multiline string in
two lines`,
  multilin3: `multiline string in
              three lines // this should appear in the string
              it skips the whitespace!`,
  multilin4: `multiline string in
              three lines // this should appear in the string
               it should
                keep the extra spaces`,
  // Valid in keys as well!
  `multilineKey`: {},
  `multiline
Key`: {},
  `multiline
   Key 2`: {},
  "empty": {},
  "emptyArray": [],
}
```
