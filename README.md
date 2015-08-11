# sofajs

couchDB the hapijs way: [hapijs lab](https://github.com/hapijs/lab), [hapijs code](https://github.com/hapijs/code), and 100% test coverage.
Plus, [hapijs joi](https://github.com/hapijs/joi) to enforce validation of data.



### Getting Started
Place your couchDB admin user credentials in: `lib/config.js`
Make sure these credentials match the user you created with couchDB.
Read [couchdb](http://couchdb.apache.org) documentation for details on creating DB users.
Note: after installing couchdb documentation wil then be on your local machine. 

Set your credentials in: `lib/config.js`

```
config.db = 'sofajs';
config.uri = 'http://localhost';
config.port = '5984';
config.user = 'adminuser';
config.pw = 'secretpw';
```

`npm install` install needed packages.
`npm test` read tests and see the logic performed. Then, go read the code performing the logic. 

#### Fixtures
`test/fixtures/fixtures1.js` contains fixture's data which `npm test` loads and uses.

#### Schemas
`lib/user.js` top of file has user Joi.schema used to validate user data when 
creating or updating. 


## Contents 

### Sofa
[connect(callback)](#sofa-connect)<br/>
[createdb()](#sofa-createdb)<br/>
[current()](#sofa-current)<br/>
[destroydb()](#sofa-destroy)<br/>
[insert(document, callback(err, response))](#sofa-insert)<br/>
[insertBulk(\['array', 'Of', 'Documents'\], callback(err, response))](#sofa-insertBulk)<br/>
[insertID(document, suppliedID, callback(err, response))](#sofa-insertID)<br/>
[stop()](#sofa-stop)<br/>
[view(design, viewname, params, callback(err, response))](#sofa-view)<br/>

### User
[authenticate(email, pw, callback(err, response))](#user-authenticate)<br/>
[create(userdoc, callback(err, result))](#user-create)<br/>
[findby(key, value, callback(err, document))](#user-findby)<br/> 
[findbyid(id, callback(err, document))](#user-findbyid) <br/>
[schema](#user-schema)<br/>
[update(newdoc, callback(err, result))](#user-update) <br/>

#### user internals
[_increment(doc, callback(err, result))](#user-_increment)<br/>
[_incrementReset(doc, callback(err, result))](#user-_incrementReset)<br/>


### <a name="packages-used">Dependencies</a> 

* [async](https://www.npmjs.com/package/async)
* [bcrypt](https://github.com/ncb000gt/node.bcrypt.js)
* [code](https://github.com/hapijs/code)
* [bluebird](https://github.com/petkaantonov/bluebird)
* [joi](https://github.com/hapijs/joi)
* [lab](https://github.com/hapijs/lab)
* [marked](https://github.com/chjj/marked)
* [nano](https://github.com/dscape/nano)


#### Credits
Much logic and db interaction relies on [nano](https://github.com/dscape/nano).
Plus, the following heavily influenced this: 
* [couchdb apache](http://couchdb.apache.org)
* [hapijs / university](https://github.com/hapijs/university)
* [devsmash pw auth with mongoose and bcrypt](http://devsmash.com/blog/password-authentication-with-mongoose-and-bcrypt)




<br/>
<br/>
<br/>
<br/>


### Sofa Functions 

#### <a name="sofa-connect">connect(callback(err, sessionid))</a> 
```
var Sofa = require('../lib/sofa');

Sofa.connect(function (err, sessionid) {

    expect(sessionid).to.have.length(50);
    next();
});
```

#### <a name="sofa-stop">stop()</a> 
Destroy couchdb session credentials.
```JavaScript
var Sofa = require('../lib/sofa');

Sofa.stop();
```
#### <a name="sofa-current">current(callback(err, details))</a> 
Get details about current session.
```JavaScript
var Sofa = require('../lib/sofa');

Sofa.current(callback(err, details));
```

``` JavaScript
// Example usage
Sofa.current(function (err, details) {

    expect(err).to.equal(null);
    expect(details).to.equal('User is {user.name} and has these roles: {user.roles}');
    next();
});
```

#### <a name="sofa-insert">insert(callback(err, response))</a> 
Insert a new document into the database.
``` JavaScript
var Sofa = require('../lib/sofa');

Sofa.insert({ name: 'sofa doc test', body: 'more docs' }, function (err, response) {

    // inspect couchdb response 
    expect(response.ok).to.equal(true);
    expect(response.id).to.have.length(32);
    next();
});

```

#### <a name="sofa-insertBulk">insertBulk(['array', 'Of', 'Documents'], callback(err, response))</a> 
Insert array of documents into the database.
``` JavaScript
var Sofa = require('../lib/sofa');

Sofa.insertBulk(['array', 'Of', 'Documents'], function (err, response) {

    // Note: Response will be an array corresponding to the submitted bulk array. 
    // Every array element in the response will be an object response related to bulk submission. 
  
    expect(response[0].ok).to.equal(true);
    expect(response[0].id).to.have.length(32);
    next();
});

```

#### <a name="sofa-createdb">createdb(callback(err, response))</a> 
Create the database defined in configuration file.
``` JavaScript
var Sofa = require('../lib/sofa');
var Config = require('../lib/config');


Sofa.createdb(function (err, response) {

    // response couchdb object 
    expect(response.ok).to.equal(true);
    next();
});
```

#### <a name="sofa-destroy">destroydb(callback(err, response))</a> 
Destroy the database defined in configuration file.
Useful when when wanting to re-create the DB and reload fresh fixture data. 
``` JavaScript
var Sofa = require('../lib/sofa');

Sofa.destroy(function (err, response) {

    expect(response).to.equal('destroyed db');
    next();
});
```

#### <a name="sofa-insertID">insertID(document, suppliedID, callback(err, response))</a> 
Insert document into database with supplied id.  Normally, couchdb generates a uid for each<br/>
document. However, here the program supplies the id.
``` JavaScript
var Sofa = require('../lib/sofa');

Sofa.insertID(document, 'suppliedID', function (err, response) {

     // Successfully inserted document with ID supplied to couchDB.

    expect(response.id).to.equal('hapi');
    expect(response.ok).to.equal(true);
    next();
});
```

#### <a name="sofa-view">view(design, viewname, params, callback(err, response))</a> 
Execute a view in your database.
May want to change forEach to every().
``` JavaScript
var Sofa = require('../lib/sofa');

    Sofa.view('users', 'list', null, function (err, response) {

        // length depends on fixtures data.
        expect(response.rows.length).to.equal(4);

        response.rows.forEach(function (doc) {

            // Each row from view emitted here.
            // foo user successfully found

            if (doc.value.email === 'foo@hapiu.com'){

                // below key from view is an array with two elements.
                // view key data is an array of id and _rev

                expect(doc.key).to.have.length(2);
            }
        });

        next();
    });
```

#### <a name="user-schema">schema</a> 
Joi.schema used to validate user data.<br/>
Configure this to fit your user document specs.<br/>
Location: `./lib/user.js`
``` JavaScript

user.schema = {
    user: Joi.object({ // schema required for creating a new user.
            _id: Joi.string(),
            _rev: Joi.string(),
            username: Joi.string().required(),
            pw: Joi.string().min(3).max(64).required(),  // length long b/c of bcrypt
            email: Joi.string().email().required(),
            first: Joi.string().min(1).max(50).required(),
            last: Joi.string().min(1).max(50).required(1),
            scope: Joi.array().items(Joi.string().valid('admin', 'user').required()),
            loginAttempts: Joi.number().greater(-1).required(),
            lockUntil: Joi.date().required()
        })
};
```

#### <a name="user-create">create(userdoc, callback(err, result))</a> 
Create a user.
```JavaScript

    var User = require('../lib/user');

    var mockuser = {
        'username': 'Mock',
        'first': 'Moo',
        'last': 'Mook',
        'pw': 'moo',
        'email': 'mock@hapiu.com',
        'scope': ['user'],
        loginAttempts: 0,
        lockUntil: Date.now() - 60 * 1000
    };

    User.create(mockuser, function (err, result) {

        if (err && err.name === 'ValidationError') {

            return done();

        } else if (err === 'Error: data and salt arguments required') {

            // bcrypt hash creation failed.

            return done();
        }

        // user successfully created

        expect(result.err).to.equal(null);
        expect(result.result.ok).to.equal(true);
        expect(result.result.id).to.have.length(32);
        expect(result.result.rev).to.include('1');
        return done();
    });
```

#### <a name="user-authenticate">authenticate(email, pw, callback(err, response))</a> 
Authenticate user based on email and password.<br/>
Response equals true or false. 
``` JavaScript

    var User = require('../lib/user');

    User.authenticate('foo@hapiu.com', 'foo', function (err, response) {

        // User is authentic

        expect(response).to.equal(true);
        next();
    });
```



#### <a name="user-findby">findby(key, value, callback(err, document))</a> 
Submit key and value:
* key: is JSON object key name in the document being searched.
* value: is the value associated with the key name.  
It matching key value is found the user document is returned.

``` JavaScript

    var User = require('../lib/user');

    // get foo@hapiu.com's user document. 
    // Modify the document and save/update it.

    User.findby('email', 'foo@hapiu.com', function (err, response) {

        expect(response.value.email).to.equal('foo@hapiu.com');

        // simulated lockUntil date time expiriation.

        response.value.lockUntil = Date.now() - (60 * 1000 * 60 * 48);

        // simulate loginAttempts exceeded limit causing lockout

        response.value.loginAttempts = 11;

        // add _id and _rev values essential to update document.

        response.value._id = response.id;
        response.value._rev = response.key[1];

        User.update(response.value, function (err, result) {

            if (result) {

                // user document successfully updated
                // no longer locked out

                expect(result.ok).to.equal(true);
                internals.userid = result.id;
                return next();
            }
        });
    });

```


#### <a name="user-findbyid">findbyid(id, callback(err, document))</a> 
Submit id and document with matching id will be returned. 
else, 'no record found' message is returned.

``` JavaScript

    var User = require('../lib/user');

    User.findbyid(internals.userid, function (err, response) {


        // Response if user does not exist.

        expect(response).to.equal('no record found');

        //  Else, can access user data.
        //  user no longer locked out.

        expect(response.value.lockUntil).to.be.below(Date.now());

        // user loginAttempts is still above lock out threshold

        expect(response.value.loginAttempts).to.equal(11);

        next();
    });

```



#### <a name="user-update">update(document, callback(err, result))</a> 
Submit a document with '_id' and '_rev' uids set and insert it to couchdb. 
Couchdb interprets this as a request to update the existing document at the '_rev' id.
Else, 'no record found' message' is returned.

Below causes Joi validation to fail.
Error message is: "badkey" is not allowed

``` JavaScript

    var User = require('../lib/user');

    // badkey not in validation schema. 
    // response.value is user document

    response.value.badkey = 'bad data';

    User.update(response.value, function (err, result) {

        // validation error message 

        expect(err.message).to.equal('\"badkey\" is not allowed');

        return done(Sofa.stop());
    });

```

### User Internals
#### <a name="user-_increment">_increment(doc, callback(err, sessionid))</a> 
Internal function used to increment the users login attempts.

#### <a name="user-_incrementReset">_incrementReset(doc, callback)</a> 
Internal function resets a user's login attempts.

