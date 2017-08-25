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

LMJSON is designed only to be parsed. There are many valid ways to express an Object or a tree-like syntax in LMJSON (Should the strings be literal? Should you have single or double quotes? Should you avoid quotes in key names?), so having a serializer would be silly.
On the other hand, most JavaScript object initializers are valid LMJSON, so you can use that.

## Syntax example

#### Rendered pretty syntax (click to open rendered HTML)

<a href="https://cdn.rawgit.com/uwx/673faceeba2a1deaa0676ad94ff0e21f/raw/2c5f598985619f349d0addbffc9519b060d799f6/lmjson-example.html"><img src="https://cdn.rawgit.com/uwx/adaa8ed38f7030b40221e8fe2d5b4c5c/raw/9392b70f47efa7ad5e89193ff23a8409831c028b/svg2.svg"></a>  
<sup>Because of certain SVG quirks, this may not look correct on mobile devices. Click it to open the original HTML file, which renders properly.</sup>

#### Pure text example

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
