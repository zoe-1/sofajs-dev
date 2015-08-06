# sofajs

Preparing to use couchDB with hapijs.
Writing and testing core couchdb logic for hapijs application. 
The more you use couchDB the more you like it :-)

Tests are written to be references to core couchdb logic.
`npm test` read tests and see the logic performed. Then, go read the code performing the logic. 

Utilizes: 
* [nano](https://github.com/dscape/nano)
* [joi](https://github.com/hapijs/joi)
* [bcrypt](https://github.com/ncb000gt/node.bcrypt.js)
* [bluebird](https://github.com/petkaantonov/bluebird)
* [lab](https://github.com/hapijs/lab)
* [code](https://github.com/hapijs/code)


Inspiration Taken From
* [couchdb apache](http://couchdb.apache.org)
* [hapijs / university](https://github.com/hapijs/university)
* [devsmash pw auth with mongoose and bcrypt](http://devsmash.com/blog/password-authentication-with-mongoose-and-bcrypt)


## Sofa Contents 

[connect(callback)](#sofa-connect)<br/>
[stop()](#sofa-stop)<br/>
[current()](#sofa-current)<br/>
[insert(document, callback(err, response))](#sofa-insert)<br/>
[insertBulk(\['array', 'Of', 'Documents'\], callback(err, response))](#sofa-insertBulk)<br/>
[createdb()](#sofa-createdb)<br/>
[destroy()](#sofa-destroy)<br/>
[insertID(document, suppliedID, callback(err, response))](#sofa-insertID)<br/>
[view(design, viewname, params, callback(err, response))](#sofa-view)<br/>









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
```
var Sofa = require('../lib/sofa');

Sofa.stop();
```
#### <a name="sofa-current">current(callback(err, details))</a> 
Get details about current session.
```
var Sofa = require('../lib/sofa');

Sofa.current(callback(err, details));
```
```
// Example usage
Sofa.current(function (err, details) {

    expect(err).to.equal(null);
    expect(details).to.equal('User is {user.name} and has these roles: {user.roles}');
    next();
});
```

#### <a name="sofa-insert">insert(callback(err, response))</a> 
Insert a new document into the database.
```
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
```
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
```
var Sofa = require('../lib/sofa');
var Config = require('../lib/config');


Sofa.createdb(function (err, response) {

    // response couchdb object 
    expect(response.ok).to.equal(true);
    next();
});
```

#### <a name="sofa-destroy">destroy(callback(err, response))</a> 
Destroy the database defined in configuration file.
Useful when when wanting to re-create the DB and reload fresh fixture data. 
```
var Sofa = require('../lib/sofa');

Sofa.destroy(function (err, response) {

    expect(response).to.equal('destroyed db');
    next();
});
```

#### <a name="sofa-insertID">insertID(document, suppliedID, callback(err, response))</a> 
Insert document into database with supplied id.  Normally, couchdb generates a uid for each<br/>
document. However, here the program supplies the id.
```
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
```
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
