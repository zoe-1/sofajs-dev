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

describe('users', function () {

    it('successfully create a user', function (done) {

        var mockuser = {
            'type': 'user',
            'username': 'Mock',
            'first': 'Moo',
            'last': 'Mook',
            'pw': 'moo',
            'email': 'mock@hapiu.com',
            'scope': ['user']
        };

        User.create(mockuser, function (err, result) {

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
                done(Sofa.stop());
            });
    });

    it('load user views', function (done) {

        Async.waterfall([
            function (next) {

                // Make connection to db.

                Sofa.connect(function (err, sessionid) {

                    expect(sessionid).to.have.length(50);
                    next();
                });
            },
            function (next) {

                // Ensure db sessionid was set.

                expect(Sofa.sessionid).to.have.length(50);
                next();
            },
            function (next) {

                // Insert Document to DB.

                Sofa.insertID(Fixtures.views[0], '_design/users', function (err, response) {

                     // Successful insert document response.

                    // console.log('CALLBACK' + JSON.stringify(response));
                    // expect(response).to.equal('ok');
                    // expect(err).to.equal(true);
                    // expect(response.ok).to.equal(true);
                    // expect(response.id).to.have.length(32);
                    next();
                });

            }], function (err) {

                // expect(err).to.equal('Error: Name or password is incorrect');
                done(Sofa.stop());
            });
    });

    it('successful use of _design/user list view', function (done) {

        Async.waterfall([
            function (next) {

                // Make connection to db.

                Sofa.connect(function (err, sessionid) {

                    expect(sessionid).to.have.length(50);
                    next();
                });
            },
            function (next) {

                // Ensure db sessionid was set.

                expect(Sofa.sessionid).to.have.length(50);
                next();
            },
            function (next) {

                // Insert Document to DB.

                // Syntax Sofa.view(designname, viewname, params, callback)

                Sofa.view('users', 'list', null, function (err, response) {

                     // Successful insert document response.

                    // console.log('_design/users/list CALLBACK' + err);
                    // console.log('_design/users/list CALLBACK' + JSON.stringify(response));

                    expect(response.rows.length).to.equal(4);

                    response.rows.forEach(function (doc) {

                        // Each row from view emitted here.
                        if (doc.value.email === 'foo@hapiu.com'){

                            // current loading makes two foo@hapiu.com users.
                            // console.log(doc.key);
                            expect(doc.key).to.have.length(2);
                            // console.log(doc.value);
                        }
                    });

                    // console.log('map start');
                    next();
                });

            }], function (err) {

                // expect(err).to.equal('Error: Name or password is incorrect');
                done(Sofa.stop());
            });
    });

    it('successfully authenticate user', function (done) {

        Async.waterfall([
            function (next) {

                // Make connection to db.

                Sofa.connect(function (err, sessionid) {

                    expect(sessionid).to.have.length(50);
                    next();
                });
            },
            function (next) {

                User.authenticate('foo@hapiu.com', 'foo', function (err, response) {

                    // User is authentic
                    // console.log('authenticate: err: ' + err +' response: ' + response);

                    expect(response).to.equal(true);
                    next();
                });
            }], function (err) {

                // expect(err).to.equal('Error: Name or password is incorrect');
                done(Sofa.stop());
            });
    });

    it('errors when authenticating user', function (done) {

        Async.waterfall([
            function (next) {

                // Make connection to db.

                Sofa.connect(function (err, sessionid) {

                    expect(sessionid).to.have.length(50);
                    next();
                });
            },
            function (next) {

                User.authenticate('foo@hapiu.com', null, function (err, response) {

                    // console.log('authenticate: err: ' + err + ' response: ' + response);

                    expect(err).to.exist();
                    expect(err.message).to.equal('data and hash arguments required');

                    next();
                });
            }], function (err) {

                // expect(err).to.equal('Error: Name or password is incorrect');
                done(Sofa.stop());
            });
    });

    it('bad pw fails to authenticate user', function (done) {

        Async.waterfall([
            function (next) {

                // Make connection to db.

                Sofa.connect(function (err, sessionid) {

                    expect(sessionid).to.have.length(50);
                    next();
                });
            },
            function (next) {

                User.authenticate('foo@hapiu.com', 'badpw', function (err, response) {

                    // pw fails, user is not authentic
                    // log bad attempt
                    // console.log('authenticate: err: ' + err +' response: ' + response);

                    expect(response).to.equal(false);
                    next();
                });
            }], function (err) {

                // expect(err).to.equal('Error: Name or password is incorrect');
                done(Sofa.stop());
            });
    });
});
