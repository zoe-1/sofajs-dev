var Code = require('code');
var Lab = require('lab');
var Path = require('path');
var Async = require('async');
var Hoek = require('hoek');
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
var before = lab.before;
var expect = Code.expect;
var it = lab.test;

describe('users', function () {

    it('successfully create a user', function (done) {

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

    it('fail to authenticate user bad pw ', function (done) {

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

    it('fail authentication multiple times and lockout ', function (done) {

        Async.waterfall([
            function (next) {

                // Make connection to db.

                Sofa.connect(function (err, sessionid) {

                    expect(sessionid).to.have.length(50);
                    next();
                });
            },
            function (next) {

                // Make 9-10 failed attempts and cause lockdown.

                var attempt = function attempt () {

                    User.authenticate('foo@hapiu.com', 'badpw', function (err, response) {

                        ++counter;

                        if (counter === 9) {
                            return next();
                        }

                        // recursion

                        attempt();
                    });
                };

                var counter = 0;

                attempt();

            }, function (next) {

                // Ensure loginAttempts value is correct
                // and expire the lockout date.

                User.findby('email', 'foo@hapiu.com', function (err, response) {

                    // Get uid for next test.

                    internals.userid = response.id;

                    // Ensure user locked out with appropriate values.

                    expect(response.value.loginAttempts).to.equal(11);
                    expect(response.value.email).to.equal('foo@hapiu.com');
                    expect(response.value.lockUntil).to.be.above(Date.now());

                    // Expire the lockout

                    response.value.lockUntil = Date.now() - (60 * 1000 * 60 * 48);

                    response.value._id = response.id;
                    response.value._rev = response.key[1];

                    User.update(response.value, function (err, result) {

                        if (result) {
                            // console.log('Update result' + JSON.stringify(result));
                            //  expect(err).to.exist();;
                            expect(result.ok).to.equal(true);
                            internals.userid = result.id;
                            return next();
                        }
                    });
                });
            }, function (next) {

                 // Ensure lockUntil date is now expired.

                expect(internals.userid).to.have.length(32);

                User.findbyid(internals.userid, function (err, response) {

                    expect(response.value.lockUntil).to.be.below(Date.now());
                    next();
                });
            }, function (next) {

                // user with expired lockout attempts to login.
                // reset the loginAttempts event if auth fails.

                User.authenticate('foo@hapiu.com', 'badfoopw', function (err, response) {

                    // User authentication failed

                    expect(response).to.equal(false);
                    next();
                });
                next();
            }, function (next) {

                // Ensure loginAttempts reset to 1

                expect(internals.userid).to.have.length(32);

                User.findbyid(internals.userid, function (err, response) {

                    expect(response.value.loginAttempts).to.equal(1);
                    next();
                });
            }], function (err) {

                // expect(err).to.equal('Error: Name or password is incorrect');
                done(Sofa.stop());
            });
    });
});


describe('locked out', function () {

    it('locked out user reactivated.', function (done) {

        Async.waterfall([
            function (next) {

                // make connection to db.

                Sofa.connect(function (err, sessionid) {

                    expect(sessionid).to.have.length(50);
                    next();
                });
            },
            function (next) {

                // Expire the lockout

                User.findby('email', 'foo@hapiu.com', function (err, response) {

                    // console.log('locked out user: ' + JSON.stringify(response));

                    expect(response.value.email).to.equal('foo@hapiu.com');


                    // Simulated lockUntil date time expiriation.

                    response.value.lockUntil = Date.now() - (60 * 1000 * 60 * 48);

                    // Add _id and _rev values essention to update document.

                    response.value._id = response.id;
                    response.value._rev = response.key[1];

                    User.update(response.value, function (err, result) {

                        if (result) {
                            // console.log('Update result' + JSON.stringify(result));
                            //  expect(err).to.exist();;
                            expect(result.ok).to.equal(true);
                            internals.userid = result.id;
                            return next();
                        }
                    });
                });
            }, function (next) {

                 // Ensure lockUntil date changed to be expired.

                expect(internals.userid).to.have.length(32);

                User.findbyid(internals.userid, function (err, response) {

                    //  User no longer locked out.
                    // console.log('END findbyid response updated user: ' + JSON.stringify(response));

                    expect(response.value.lockUntil).to.be.below(Date.now());
                    next();
                });
            }, function (next) {

                // Successfully login and user incrementReset occurs.

                User.authenticate('foo@hapiu.com', 'foo', function (err, response) {

                    // User successfully logged in.
                    // IncrementReset occurs setting athenticate user's loginAttempts back to 1.
                    // console.log('authenticate lockuntil > Now and good pw: err: ' + err +' response: ' + response);

                    expect(response).to.equal(true);
                    next();
                });
            }], function (err) {

                // expect(err).to.equal('error: name or password is incorrect');
                done(Sofa.stop());
            });
    });

    it('valid credentials submitted but locked out.', function (done) {

        Async.waterfall([
            function (next) {

                // make connection to db.

                Sofa.connect(function (err, sessionid) {

                    expect(sessionid).to.have.length(50);
                    next();
                });
            }, function (next) {

                // Lockout the user, set lockUntil value to a future date.

                User.findby('email', 'foo@hapiu.com', function (err, response) {

                    // console.log('locked out user: ' + JSON.stringify(response));

                    expect(response.value.email).to.equal('foo@hapiu.com');

                    // Simulated lockUntil date time expiriation.

                    response.value.lockUntil = Date.now() + (60 * 1000 * 60 * 48);

                    // Add _id and _rev values essention to update document.

                    response.value._id = response.id;
                    response.value._rev = response.key[1];

                    User.update(response.value, function (err, result) {

                        if (result) {
                            // console.log('Updated locked down result' + JSON.stringify(result));
                            //  expect(err).to.exist();;
                            expect(result.ok).to.equal(true);
                            internals.userid = result.id;
                            return next();
                        }
                    });
                });
            }, function (next) {

                // Ensure user is locked down.

                expect(internals.userid).to.have.length(32);

                User.findbyid(internals.userid, function (err, response) {

                    //  User no longer locked out.
                    // console.log('END findbyid response updated user: ' + JSON.stringify(response));

                    expect(response.value.lockUntil).to.be.above(Date.now());
                    next();
                });
            }, function (next) {

                // attempt to authenticate locked down user w. valid credentials.

                User.authenticate('foo@hapiu.com', 'foo', function (err, response) {


                    // User login failed.
                    // IncrementReset occurs setting athenticate user's loginAttempts back to 1.
                    // console.log('authenticate lockuntil > Now and good pw: err: ' + err +' response: ' + response);

                    // expect(response).to.equal('locked out -- okpw');
                    expect(response).to.equal(false);
                    next();
                });
            }], function (err) {

                // expect(err).to.equal('error: name or password is incorrect');
                done(Sofa.stop());
            });
    });

    it('invalid credentials submitted and locked out', function (done) {

        Async.waterfall([
            function (next) {

                // make connection to db.

                Sofa.connect(function (err, sessionid) {

                    expect(sessionid).to.have.length(50);
                    next();
                });
            }, function (next) {

                // authenticate locked down user w. invalid credentials.

                User.authenticate('foo@hapiu.com', 'badfoopw', function (err, response) {


                    // User login failed.
                    // IncrementReset occurs setting athenticate user's loginAttempts back to 1.
                    // expect(response).to.equal('locked out -- badpw33');
                    expect(response).to.equal(false);
                    next();
                });

                next();
            }], function (err) {

                done(Sofa.stop());
            });
    });
});

describe('mock ups', function () {

    before(function (done) {

        // Update User db first

        // console.log('before running');
        Async.waterfall([
            function (next) {

                // make connection to db.

                Sofa.connect(function (err, sessionid) {

                    expect(sessionid).to.have.length(50);
                    next();
                });
            }, function (next) {

                // Turn off lockout of the user, set lockUntil value to a earlier date.

                User.findby('email', 'foo@hapiu.com', function (err, response) {

                    // console.log('locked out user: ' + JSON.stringify(response));

                    expect(response.value.email).to.equal('foo@hapiu.com');

                    // Simulated unlocked time settings.

                    response.value.lockUntil = Date.now() - (60 * 1000 * 60 * 48);

                    // Add _id and _rev values essention to update document.

                    response.value._id = response.id;
                    response.value._rev = response.key[1];

                    User.update(response.value, function (err, result) {

                        if (result) {
                            // console.log('Updated locked down result' + JSON.stringify(result));
                            //  expect(err).to.exist();;
                            expect(result.ok).to.equal(true);
                            internals.userid = result.id;
                            return next();
                        }
                    });
                });
            }, function (next) {

                // Ensure lockdown expired

                expect(internals.userid).to.have.length(32);

                User.findbyid(internals.userid, function (err, response) {

                    //  User no longer locked out.
                    // console.log('END findbyid response updated user: ' + JSON.stringify(response));

                    expect(response.value.lockUntil).to.be.below(Date.now());
                    next();
                });
            }, function (next) {

                next();

            }], function (err) {

                done(Sofa.stop());
            });
    });



    it('findby error', function (done) {

        Async.waterfall([
            function (next) {

                // make connection to db.

                Sofa.connect(function (err, sessionid) {

                    expect(sessionid).to.have.length(50);
                    next();
                });
            }, function (next) {

                internals.original = Sofa.view;

                Sofa.view = function (users, list, options, callback) {

                    Sofa.view = internals.original;
                    // console.log('entered mock view');
                    return callback(true, null);
                };

                User.findby('boom', 'err', function (err, response) {

                    // console.log('get bad err' + err + response);

                    //  User no longer locked out.
                    // console.log('findbyid response: ' + JSON.stringify(response));
                    expect(err).to.equal(true);
                    next();
                });
            }, function (next) {

                next();
            }], function (err) {

                done(Sofa.stop());
            });
    });

    it('findby no record exists', function (done) {

        Async.waterfall([
            function (next) {

                // make connection to db.

                Sofa.connect(function (err, sessionid) {

                    expect(sessionid).to.have.length(50);
                    next();
                });
            }, function (next) {

                User.findby('email', 'nonexisting', function (err, response) {

                    // console.log('no record found' + err + response);

                    //  User no longer locked out.
                    // console.log('findbyid response: ' + JSON.stringify(response));
                    expect(err).to.equal(null);
                    expect(response).to.equal('no record found');
                    next();
                });
            }, function (next) {

                next();
            }], function (err) {

                done();
            });
    });

    it('findbyid coverage', function (done) {

        User.findbyid('1baduserid34567', function (err, response) {

            //  User no longer locked out.
            // console.log('findbyid response: ' + JSON.stringify(response));

            expect(response).to.equal('no record found');
            expect(response).to.equal('no record found');
            done();
        });
    });

    it('mock user.update joi fail', function (done) {

        User.findby('email', 'foo@hapiu.com', function (err, response) {

            // console.log('mock bad user document update: ' + JSON.stringify(response));

            // Get uid for next test.

            internals.userid = response.id;

            // Ensure user locked out with appropriate values.

            expect(response.value.email).to.equal('foo@hapiu.com');

            // Expire the lockout

            response.value.lockUntil = Date.now() - (60 * 1000 * 60 * 48);

            response.value._id = response.id;
            response.value._rev = response.key[1];

            // Add bad data to user update document

            response.value.badkey = 'bad data';

            User.update(response.value, function (err, result) {

                if (!err) {

                    //  expect(err).to.exist();;
                    expect(result.ok).to.equal(true);
                    internals.userid = result.id;
                    return done();
                }

                expect(err.message).to.equal('\"badkey\" is not allowed');
                return done(Sofa.stop());
            });
        });
    });

    it('mock user.update Sofa.insert failure', function (done) {

        Async.waterfall([
            function (next) {

                // make connection to db.

                Sofa.connect(function (err, sessionid) {

                    expect(sessionid).to.have.length(50);
                    next();
                });
            }, function (next) {

                // mock Sofa.insert failure

                internals.original = Sofa.insert;

                Sofa.insert = function (newdoc, callback) {

                    Sofa.insert = internals.original;
                    var error = new Error('mock Sofa.insert error');

                    return callback(error);
                };

                User.findby('email', 'foo@hapiu.com', function (err, response) {

                    // console.log('mock bad user document update: ' + JSON.stringify(response));

                    // Get uid for next test.

                    internals.userid = response.id;

                    // Ensure user locked out with appropriate values.

                    expect(response.value.email).to.equal('foo@hapiu.com');

                    // Expire the lockout

                    response.value.lockUntil = Date.now() - (60 * 1000 * 60 * 48);

                    response.value._id = response.id;
                    response.value._rev = response.key[1];

                    // Add bad data to user update document

                    User.update(response.value, function (err, result) {

                        if (!err) {

                            //  expect(err).to.exist();;
                            expect(result.ok).to.equal(true);
                            internals.userid = result.id;
                            return next();
                        }

                        expect(err.message).to.equal('mock Sofa.insert error');
                        return next();
                    });
                });

            }], function (err) {

                return done(Sofa.stop());
            });
    });
});
