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

            // internals.log('No session id, making connection.');

            var Connect = function () {

                return new Promise( function (resolve, reject) {

                    sofa.db = require('nano')( Config.uri + ':' + Config.port + '/' + Config.db);

                    sofa.db.auth(Config.user, Config.pw, function (err, body, headers) {

                        if (err) {
                            reject({ errorNum: 1, message: err.message });
                            // throw err;
                        }

                        if (headers && headers['set-cookie']) {
                            var session = headers['set-cookie'][0].match(/(?:[^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)\s*=\s*(?:([^\x00-\x20\"\,\;\\\x7F]*))/);
                            sofa.sessionid = session[1];
                        }

                        // internals.log('made new session ' + sofa.sessionid);

                        // promise resolved
                        resolve(sofa.sessionid);
                    });
                });
            };

            Connect()
                .then(function (sessionid) {

                    callback(sessionid);
                })
                .catch(function (err) {

                    callback(err.message);
                });
        } else {

            // Already authenticated get session id.
            internals.log('sessionid exists');
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

            var nano = require('nano')({ url: 'http://localhost:5984/churchjs', cookie: 'AuthSession=' + sofa.sessionid });

            return new Promise( function (resolve, reject) {

                nano.insert(document, function (err, body, headers) {

                    if (err) {
                        // throw err;
                        return reject(err);
                    }

                    // change the cookie if couchdb tells us to
                    if (headers && headers['set-cookie']) {
                        auth = headers['set-cookie'];
                        Sofa.sessionid = auth[1];
                    }

                    // promise resolved
                    var test = 'here is dats';
                    return resolve(body);
                });
            });
        };

        Insert(newdoc)
            .then(function (response) {

                return callback(null, response);
            })
            .catch(function (err) {

                return callback(err);
            });
    };

    module.exports = sofa;
}());