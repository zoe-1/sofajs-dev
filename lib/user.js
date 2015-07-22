var ConfigNano = require('./config');
var DB = require('./index');
var Nano = require('nano')('http://localhost:5984/churchjs');

var internals = {};


internals.callback = console.log;       // noramlly some callback
internals.result = {};


var User = module.exports = function(opts) {

    this._session = false; 
    this._connection = false; 

    this.connection = function (callback) {

        if (this._connection === false) {
        
            console.log('_connection was false');

            var Nano = require('nano')('http://localhost:5984/churchjs');

            Nano.auth(ConfigNano.nanoname, ConfigNano.nanopass, function (err, body, headers) {

                console.log('Nano auth entered');
                if (err) {
                    internals.callback('new session error');
                    internals.callback(err);
                    return err;
                }

                if (headers && headers['set-cookie']) {

                    ConfigNano.cookies.session = headers['set-cookie'][0].match(/(?:[^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)\s*=\s*(?:([^\x00-\x20\"\,\;\\\x7F]*))/);
                    this._connection = require('nano')({ url : 'http://localhost:5984/churchjs', cookie: 'AuthSession=' + ConfigNano.cookies.session[1] });
                    internals.callback('made new connection');
                    //return callback(ConfigNano.cookies.session);
                    return this;
                }
            });
        } 
    };
};

/*
User.prototype.new = function (newUser) {

    var createUser = function (session) {
    
        console.log('---------------------------');
        console.log(session);
        console.log('---------------------------');
       
        return true; 
    };

    DB.session(createUser);
};
*/

User.prototype.new1 = function (newUser) {

    console.log('---------------------------');
    console.log(ConfigNano.cookies.session[0]);
    console.log('---------------------------');

    this.connection(function (session) {
    
        console.log('connection callback is running');
        connectionAfter(newUser);
    });

    var connectionAfter = function (newUser) {
    
        console.log('connection after running');
        //var doc = { name: 'Test name2', body: 'Test Body2'};
        this._connection.insert(newUser, function (err, body, headers) {

            console.log('insert is running');
            if (err) {
                return internals.callback(err);
            }
            
            var auth = false;

            // change the cookie if couchdb tells us to
            if (headers && headers['set-cookie']) {

                auth = headers['set-cookie'];
            }

            internals.callback(null, "it worked auth: " + auth);
            return  {err: err, body: body, headers: headers};
        });
    }; 

    // var churchjs = require('nano')({ url : 'http://localhost:5984/churchjs', cookie: 'AuthSession=' + ConfigNano.cookies.session[1] });
};

var boom = new User();

var result = boom.new1({ one: 'data one2', two: 'data two2'});

console.log(result);
/*
Nano.auth(ConfigNano.nanoname, ConfigNano.nanopass, function (err, body, headers) {

    if (err) {
        return err;
    }

    if (headers && headers['set-cookie']) {
        ConfigNano.cookies.session = headers['set-cookie'][0].match(/(?:[^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)\s*=\s*(?:([^\x00-\x20\"\,\;\\\x7F]*))/);
    }

    internals.callback(ConfigNano.cookies.session);

    // return ConfigNano.cookies.session[1];
    // internals.callback(null, 'it worked cookie is: ' + ConfigNano.cookies.session[1]);
    internals.afterAuth();
});



internals.afterAuth = function () {

    console.log('---------------------------');
    console.log(ConfigNano.cookies.session[0]);
    console.log('---------------------------');

    var alice = require('nano')({ url : 'http://localhost:5984/churchjs', cookie: 'AuthSession=' + ConfigNano.cookies.session[1] });

    var doc = { name: 'Test name', body: 'Test Body'};

    alice.insert(doc, function (err, body, headers) {

                if (err) {
                    return internals.callback(err);
                }
                
                var auth = false;

                // change the cookie if couchdb tells us to
                if (headers && headers['set-cookie']) {

                    auth = headers['set-cookie'];
                }

        internals.callback(null, "it worked auth: " + auth);
    });
};
*/

