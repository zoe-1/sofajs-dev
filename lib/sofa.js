var Promise = require('bluebird');
var Config = require('./config');
var Async = require('async');

var internals = {};
internals.log = console.log;


(function () {

    var sofa = {};

    sofa.sessionid = false;

    sofa.db = false;

    sofa.connect = function (callback) {

        if (!sofa.sessionid) {

            var Connect = function () {

                return new Promise( function (resolve, reject) {

                    sofa.db = require('nano')( Config.uri + ':' + Config.port);

                    sofa.db.auth(Config.user, Config.pw, function (err, body, headers) {

                        if (err) {
                            reject({ errorNum: 1, message: err.message });
                            // throw err;
                        }

                        if (headers && headers['set-cookie']) {
                            var session = headers['set-cookie'][0].match(/(?:[^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)\s*=\s*(?:([^\x00-\x20\"\,\;\\\x7F]*))/);
                            sofa.sessionid = session[1];
                        }

                        // promise resolved
                        resolve(sofa.sessionid);
                    });
                });
            };

            Connect()
                .then(function (sessionid) {

                    callback(null, sessionid);
                })
                .catch(function (err) {

                    callback(err.message);
                });
        } else {

            // Already authenticated get session id.
            callback('already connected.');
        }

    };


    sofa.stop = function () {

        delete sofa.sessionid;
        delete sofa.db;
    };

    sofa.current = function (callback) {

        // show current sofa session details.

        var currentSession = require('nano')({ url: Config.uri + ':' + Config.port, cookie: 'AuthSession=' + sofa.sessionid });

        var sessionDetails;

        currentSession.session(function (err, session) {

            if (err) {
                // result = err.message;
                return callback(err);
            }

            sessionDetails = 'User is ' + session.userCtx.name + ' and has these roles: ' + session.userCtx.roles;
            return callback(null, sessionDetails);
        });
    };

    sofa.insert = function (newdoc, callback) {

        // Function assumes user session already exists.

        var Insert = function (document) {

            sofa.db = require('nano')({ url: Config.uri + ':' + Config.port, cookie: 'AuthSession=' + sofa.sessionid });

            // sofa.db = require('nano')({ url: 'http://localhost:5984/churchjs', cookie: 'AuthSession=' + sofa.sessionid });

            return new Promise( function (resolve, reject) {

                var db = sofa.db.use(Config.db);

                db.insert(document, function (err, body, headers) {

                    if (err) {

                        // throw err;
                        return reject(err);
                    }

                    // @Coverage
                    // Escaped out because hard to get couchDB to reproduce this.
                    // change the cookie if couchdb tells us to
                    // if (headers && headers['set-cookie']) {
                    //     auth = headers['set-cookie'];
                    //     Sofa.sessionid = auth[1];
                    // }

                    // promise resolved
                    var test = 'here is dats';
                    return resolve(body);
                });
            });
        };

        if (!sofa.sessionid) {

            // DB connection does not exist yet.  Create one first.

            this.connect(function (err, sessionid) {

                // Insert document

                Insert(newdoc)
                    .then(function (response) {

                        return callback(null, response);
                    })
                    .catch(function (err) {

                        return callback(err);
                    });
            });
        } else {

            // connection exists insert document

            Insert(newdoc)
                .then(function (response) {

                    return callback(null, response);
                })
                .catch(function (err) {

                    return callback(err);
                });
        }
    };


    sofa.create = function (callback) {

        var Create = function (document) {

            var sofaconnection = require('nano')({ url: Config.uri + ':' + Config.port, cookie: 'AuthSession=' + sofa.sessionid });

            // sofa.db = require('nano')({ url: 'http://localhost:5984/dbname', cookie: 'AuthSession=' + sofa.sessionid });

            return new Promise( function (resolve, reject) {

                sofaconnection.db.create(Config.db, function (err, body) {

                    if (!err) {
                        resolve(body);
                    }

                    reject(err);
                });
            });
        };

        if (!sofa.sessionid) {

            // DB connection does not exist yet.  Create one first.

            this.connect(function (err, sessionid) {

                // Insert document

                Create()
                    .then(function (response) {

                        return callback(null, response);
                    })
                    .catch(function (err) {

                        return callback(err);
                    });
            });
        } else {

            Create()
                .then(function (response) {

                    return callback(null, response);
                })
                .catch(function (err) {

                    return callback(err);
                });
        }
    };


    sofa.destroy = function (callback) {

        var Destroy = function () {

            var sofaconnection = require('nano')({ url: Config.uri + ':' + Config.port, cookie: 'AuthSession=' + sofa.sessionid });

            // sofa.db = require('nano')({ url: 'http://localhost:5984/churchjs', cookie: 'AuthSession=' + sofa.sessionid });

            return new Promise( function (resolve, reject) {

                sofaconnection.db.destroy(Config.db, function (err, response) {

                    if (err) {
                        reject(err);
                    }

                    resolve('destroyed db');
                });
            });
        };

        if (!sofa.sessionid) {

            // DB connection does not exist yet.  Create one first.

            this.connect(function (err, sessionid) {

                // Destroy DB

                Destroy()
                    .then(function (response) {

                        return callback(null, response);
                    })
                    .catch(function (err) {

                        // console.log('hit error' + err);
                        return callback(err);
                    });
            });
        } else {

            Destroy()
                .then(function (response) {

                    return callback(null, response);
                })
                .catch(function (err) {

                    return callback(err);
                });
        }
    };

    module.exports = sofa;
}());
