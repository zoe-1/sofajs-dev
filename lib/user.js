var Promise = require('bluebird');
var Config = require('./config');
var Nano = require('nano')('http://localhost:5984/churchjs');
var Async = require('async');

var internals = {};
internals.callback = console.log;
internals.this = {};
internals.session = false;

internals.newDoc = function (database, sessionid, doc){

    return new Promise( function (resolve, reject) {

        var nano = require('nano')({url: 'http://localhost:5984/' + database, cookie: 'AuthSession=' + sessionid});

        nano.insert(doc, function (err, body, headers) {

            if (err) {
                throw err;
            }

            // change the cookie if couchdb tells us to
            if (headers && headers['set-cookie']) {
                auth = headers['set-cookie'];
                internals.session = auth;
            }

            // promise resolved
            resolve(null, "it worked", body);
        });
    });
};


internals.getConnection = function (username, password){

        return new Promise( function (resolve, reject) {

            Nano.auth(username, password, function (err, body, headers) {

                if (err) {
                    // internals.callback('new session error');
                    // internals.callback(err);
                    throw err;
                }

                if (headers && headers['set-cookie']) {
                    Config.cookies.session = headers['set-cookie'][0].match(/(?:[^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)\s*=\s*(?:([^\x00-\x20\"\,\;\\\x7F]*))/);
                    internals.this.session = Config.cookies.session;
                    //this.session = Config.cookies.session;
                }

                // internals.callback(ConfigNano.cookies.session);
                internals.callback('made new session');

                // promise resolved
                resolve(internals.this.session);
            });
        });
};

internals.getSession = function (database, sessionid){

        return new Promise( function (resolve, reject) {

            var nano = require('nano')({url: 'http://localhost:5984/' + database, cookie: 'AuthSession=' + sessionid});

            nano.session(function(err, session) {

                  if (err) {
                    throw err;
                    //      return console.log('oh noes!')
                  }

                    console.log('user is %s and has these roles: %j',
                            session.userCtx.name, session.userCtx.roles);

                // promise resolved
                resolve(session);
            });
        });
};

internals.connections = function (next) {

    // Make database connection.
    // If already started a session then gets the sesion id to use.
    // Regardless if started or not, it will create a sessionid for use.
    
        if (!internals.session) {

             // Make Connection
        
            internals.getConnection(Config.nanoname, Config.nanopass)
            .then( function (sessionid) {

                internals.session = sessionid;
                console.log('bluebird success created session '+ sessionid);
                // return sessionid;
                next();
            })
            .catch( function (err) {

                internals.session = false;
                console.log('connection error ' + err);
                // return err; // "oh, no!"
                next();
            });

        } else {

            // Get existing connection 
            
            internals.getSession(Config.database, id[1])
                .then( function (session) {

                    console.log('session success '+ session);
                    internals.session = session;
                    // return sessionid;
                    next();
                })
                .catch( function (err) {

                    // Old connection expired make new one
                    
                    console.log('get session error ' + err);
                    internals.session = false;
                      // Make Connection
                
                    internals.getConnection(Config.nanoname, Config.nanopass)
                    .then( function (sessionid) {

                        internals.session = sessionid;
                        console.log('bluebird success created session '+ sessionid);
                        // return sessionid;
                        next();
                    })
                    .catch( function (err) {

                        console.log('connection error ' + err);
                        return err; // "oh, no!"
                        next();
                    });
                });

            // Go forth and create databases 
            console.log('get session end'+ internals.session);
        }
};

(function () {

    var churchdb = {};

    churchdb.session = false;

    churchdb.config = function (username, password, database) {

        this.username = username;
        this.password = password;
        this.database = database;

        return this;
    };

    churchdb.connect = function () {

        internals.getConnection(Config.nanoname, Config.nanopass)
            .then( function (sessionid) {

                console.log('bluebird success');
                return sessionid;
            })
            .catch( function (err) {

                return err; // "oh, no!"
            });
    };
    

    churchdb.insertDoc = function (document, callback) {

        var id;

        Async.waterfall([
            function (next) {
                internals.connections(next);
            },
            function (next) {

                id = internals.session;
                console.log('session set newDoc' + internals.session);

                // Make new document.
                internals.newDoc('churchjs', internals.session[1], document)
                    .then(function (err, message, body){
                    
                        console.log('resolving the newDoc promise');
                        // return callback(err, message, body);
                        callback(err, message, body)
                        next();
                    }).catch(function () {
                    
                        next();
                    });
            }
            ], function (err) {

                console.log('insertDoc ended execute callback()');
                // callback(internals.session);
            });
    };

    module.exports = churchdb;
}());


