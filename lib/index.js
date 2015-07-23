var ConfigNano = require('./config');
var NanoNew = require('nano')('http://localhost:5984/churchjs');
var Nano = require('nano')({ url: 'http://localhost:5984/churchjs', cookie: 'AuthSession=' + ConfigNano.cookies.session[1] });

var internals = {};

internals.callback = console.log;       // noramlly some callback
internals.boom = function () {};

exports.session = function (callback) {

    // If has session return session
    Nano.session( function (err, session) {

        if (err) {
            return internals.newSesion(callback);
            // return console.log('oh noes!')
        }

        console.log('user is %s and has these roles: %j',
            session.userCtx.name, session.userCtx.roles);

        return callback(ConfigNano.cookies.session);
    });
};

// Else get new session and return it.
internals.newSesion = function (callback) {

    NanoNew.auth(ConfigNano.nanoname, ConfigNano.nanopass, function (err, body, headers) {

        if (err) {
            internals.callback('new session error');
            internals.callback(err);
            return err;
        }

        if (headers && headers['set-cookie']) {
            ConfigNano.cookies.session = headers['set-cookie'][0].match(/(?:[^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)\s*=\s*(?:([^\x00-\x20\"\,\;\\\x7F]*))/);
        }

        // internals.callback(ConfigNano.cookies.session);
        internals.callback('made new session');

        return callback(ConfigNano.cookies.session);

        // return ConfigNano.cookies.session
        // return ConfigNano.cookies.session[1];
        // internals.callback(null, 'it worked cookie is: ' + ConfigNano.cookies.session[1]);
    });
};
