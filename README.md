# passwordless-nedb

[![Build Status](https://travis-ci.org/syarul/passwordless-nedb.svg)](https://travis-ci.org/syarul/passwordless-nedb) [![Coverage Status](https://coveralls.io/repos/syarul/passwordless-nedb/badge.svg?branch=master&service=github)](https://coveralls.io/github/syarul/passwordless-nedb?branch=master)

This is [NeDB](https://github.com/louischatriot/nedb) token storage module for [Passwordless](https://github.com/florianheinemann/passwordless), a node.js module for express that allows website authentication without password using verification through email or other means. Visit the project's website https://passwordless.net for more details. With NeDB you can store token on your server without the need to run another instance of database like Mongo, CouchDB, etc.

Tokens are stored in a NeDB database and are hashed and salted using [bcrypt](https://github.com/ncb000gt/node.bcrypt.js/). 

## Usage

First, install the module:

`$ npm install passwordless-nedb --save`

Afterwards, follow the guide for [Passwordless](https://github.com/florianheinemann/passwordless). A typical implementation may look like this:

```javascript
passwordless.init(new NedbStore(db));

passwordless.addDelivery(
    function(tokenToSend, uidToSend, recipient, callback) {
        // Send out a token
    });
    
app.use(passwordless.sessionSupport());
app.use(passwordless.acceptToken());
```

## Initialization

```javascript
var passwordless = require('passwordless')
var NedbStore = require('passwordless-nedb')

var Datastore = require('nedb')
var db = new Datastore({ filename: 'path/to/token.json'})

new NedbStore(db, 'my-password-tokens');
```
* **db:** *(object)* the data storage declared upon creation/loading as defined by the NeDB specification. Please check the documentation for details: at [https://github.com/louischatriot/nedb](https://github.com/louischatriot/nedb)
* **'my-password-tokens':** *(string, optional)* A valid string identifier. All created documents within database has value { _lib: passwordless-token } as the default reference, this will override the default name. Usefull for easy indexing and search when you want to integrate the database with other documents as well.

Example:
```javascript
var db = new Datastore({ filename: './token.json'})
passwordless.init(new NedbStore(db))
```
## Hash and salt
As the tokens are equivalent to passwords (even though they do have the security advantage of only being valid for a limited time) they have to be protected in the same way. passwordless-nedb uses [bcrypt](https://github.com/ncb000gt/node.bcrypt.js/) with automatically created random salts. To generate the salt 10 rounds are used.

## Tests
```
gulp
```
## Change Logs

v 0.0.1 - initial commit
v 0.0.2 - add second string arguments to allow changing '_lib' property of created tokens 

## License

[MIT License](http://opensource.org/licenses/MIT)

