var Code = require('code');
var Lab = require('lab');
var Path = require('path');
var Async = require('async');
var Promise = require('bluebird');
var Fixtures = require('./fixtures/fixtures1');
var Bcrypt = require('bcrypt');
var Sofa = require('../lib/sofa');

var User = require('../lib/user');

// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var expect = Code.expect;
var it = lab.test;

describe('user tests', function () {

    it('successfully create a user', function (done) {


        User.create(Fixtures.users[0], function (err, result) {

            if (err && err.name === 'ValidationError') {

                console.log();
                console.log('-----------------------');
                console.log('error name: ' + err.name );
                console.log('error message: ' + err.message);
                console.log('error details: ' + JSON.stringify(err.details) );
                console.log('complete error object below: ');
                console.log('error ' + JSON.stringify(err) + ' ' + JSON.stringify(result));
                return done();

            } else if (err === 'Error: data and salt arguments required') {

                // bcrypt hash creation failed.

                console.log('');
                console.log('--------------------');
                console.log('hash error occurred: ' + JSON.stringify(err));
                console.log(': ' + err);
                return done();
            }

            // console.log('hash created: ' + result);
            // console.log('hash created: ' + JSON.stringify(result));

            // user successfully created

            expect(result.err).to.equal(null);
            expect(result.result.ok).to.equal(true);
            expect(result.result.id).to.have.length(32);
            expect(result.result.rev).to.include('1');
            return done();
        });
    });

    it('fail to create users', function (done) {

        Fixtures.users[2].username = null;

        var createUser = function (userdoc) {

            User.create(userdoc, function (err, result) {

                Fixtures.users[2].username = 'user1ono';

                if (err && err.name === 'ValidationError') {
                    expect(err).to.exist();
                    expect(err.name).to.equal('ValidationError');
                    expect(err.message).to.equal('\"value\" must be an object');
                    // console.log('error details: ' + JSON.stringify(err.details) );
                    // console.log('error ' + JSON.stringify(err) + ' ' + JSON.stringify(result));
                    return done();
                }
            });
        };

        createUser(Fixtures.users[2].username);

    });

    it('bcrypt.genSalt fail on create user', function (done) {

        var orig = Bcrypt.genSalt;
        Bcrypt.genSalt = function (saltwork, callback) {

            Bcrypt.genSalt = orig;
            return callback(new Error('genSalt function failed'));
        };

        var createUser = function (userdoc) {

            User.create(userdoc, function (err, result) {

                if (err) {
                    expect(err).to.exist();
                    expect(err.message).to.equal('genSalt function failed');
                    // expect(err.name).to.equal('ValidationError');
                    // expect(err.message).to.equal('\"value\" must be an object');
                    // console.log('error details: ' + JSON.stringify(err.details) );
                    // console.log('error ' + JSON.stringify(err) + ' ' + JSON.stringify(result));
                    return done();
                }
            });
        };

        createUser(Fixtures.users[2]);

    });

    it('bcrypt.hash fail on create user', function (done) {

        var orig = Bcrypt.hash;
        Bcrypt.hash = function (pw, salt, callback) {

            Bcrypt.hash = orig;
            return callback(new Error('bcrypt.hash function failed'));
        };

        var createUser = function (userdoc) {

            User.create(userdoc, function (err, result) {

                if (err) {
                    expect(err).to.exist();
                    expect(err.message).to.equal('bcrypt.hash function failed');
                    // expect(err.name).to.equal('ValidationError');
                    // expect(err.message).to.equal('\"value\" must be an object');
                    // console.log('error details: ' + JSON.stringify(err.details) );
                    // console.log('error ' + JSON.stringify(err) + ' ' + JSON.stringify(result));
                    return done();
                }
            });
        };

        createUser(Fixtures.users[2]);
    });

    it('Sofa.insert fail on create user', function (done) {

        var orig = Sofa.insert;
        Sofa.insert = function (newuser, callback) {

            Sofa.insert = orig;
            return callback(new Error('Sofa.insert function failed'));
        };

        var createUser = function (userdoc) {

            User.create(userdoc, function (err, result) {

                if (err) {
                    expect(err).to.exist();
                    expect(err.message).to.equal('Sofa.insert function failed');
                    // expect(err.name).to.equal('ValidationError');
                    // expect(err.message).to.equal('\"value\" must be an object');
                    // console.log('error details: ' + JSON.stringify(err.details) );
                    // console.log('error ' + JSON.stringify(err) + ' ' + JSON.stringify(result));
                    return done();
                }
            });
        };

        createUser(Fixtures.users[2]);
    });

    it('create fixture users', function (done) {

        Async.waterfall([
            function (next) {

                var createUser = function (userdoc) {

                    User.create(userdoc, function (err, result) {

                        ++counter;

                        expect(result.err).to.equal(null);
                        expect(result.result.ok).to.equal(true);
                        expect(result.result.id).to.have.length(32);
                        expect(result.result.rev).to.include('1');

                        if (counter === Fixtures.users.length) {
                            next();
                        }
                    });
                };

                var counter = 0;

                for (var i = 0; i < Fixtures.users.length; ++i) {

                    createUser(Fixtures.users[i]);
                }
            },
            function (next) {

                // Ensure db sessionid was set.

                next();
            }], function (err) {

                // expect(err).to.equal('Error: Name or password is incorrect');
                done();
            });
    });
});
