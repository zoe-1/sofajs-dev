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


                next();
            }], function (err) {

                // expect(err).to.equal('Error: Name or password is incorrect');
                done(Sofa.stop());
            });
    });


    it('locked out user reactivated.', function (done) {

        Async.waterfall([
            function (next) {

                // Make connection to db.

                Sofa.connect(function (err, sessionid) {

                    expect(sessionid).to.have.length(50);
                    next();
                });
            },
            function (next) {

                // Update locked out user to have expired lockUntil value.
                User.findby('email', 'foo@hapiu.com', function (err, response) {

                    // console.log('locked out user: ' + JSON.stringify(response));

                    expect(response.value.email).to.equal('foo@hapiu.com');


                    // Update user


                    response.value.lockUntil = Date.now() - (60 * 1000 * 60 * 48);

                    // Add _id and _rev values essention to update document.

                    response.value._id = response.id;
                    response.value._rev = response.key[1];

                    // console.log('prepared to update user' + JSON.stringify(response.value));

                    User.update(response.value, function (err, result) {

                        if (result) {
                            // console.log('result' + JSON.stringify(result));
                            //  expect(err).to.exist();;
                            expect(result.ok).to.equal(true);
                            internals.userid = result.id
                            return next();
                        }

                    });
                });
            }, function (next) {

                // Ensure lockUntil date changed to be expired.

                expect(internals.userid).to.have.length(32);

                User.findbyid(internals.userid, function (err, response) {
                
                   // console.log('END findbyid response: ' + JSON.stringify(response));  

                   //  User no longer locked out.

                   expect(response.value.lockUntil).to.be.below(Date.now());
                   next();
                });

            }, function (next) {

                // Authenticate with user and loginAttempts should be reset. 

                User.authenticate('foo@hapiu.com', 'badpw', function (err, response) {

                    // User is authentic
                    // console.log('authenticate: err: ' + err +' response: ' + response);

                    expect(response).to.equal(false);
                    // expect(response.value.loginAttempts).to.equal(1);
                    next();
                });

            }, function (next) {

                // Authenticate with user and loginAttempts should be reset. 

                User.authenticate('foo@hapiu.com', 'foo', function (err, response) {

                    // User is authentic
                    // console.log('authenticate: err: ' + err +' response: ' + response);

                    expect(response).to.equal(true);
                    // expect(response.value.loginAttempts).to.equal(1);
                    next();
                });
                
            }], function (err) {

                // expect(err).to.equal('Error: Name or password is incorrect');
                done(Sofa.stop());
            });
    });

    it('findby key value match', function (done) {

        Async.waterfall([
            function (next) {

                // Make connection to db.

                Sofa.connect(function (err, sessionid) {

                    expect(sessionid).to.have.length(50);
                    next();
                });
            },
            function (next) {


                User.findby('email', 'waka@hapiu.com', function (err, response) {

                    // console.log('END findby: ' + JSON.stringify(response));

                    expect(response).to.equal('no record found');
                    Sofa.stop();
                    next();
                });
            }, function (next) {

                // Make connection to db.

                Sofa.connect(function (err, sessionid) {

                    expect(sessionid).to.have.length(50);
                    next();
                });
            }, function (next) {

                User.findby('email', 'foo@hapiu.com', function (err, response) {

                    // console.log('END findby: ' + JSON.stringify(response));

                    expect(response.value.email).to.equal('foo@hapiu.com');
                    next();
                });
            }], function (err) {

                // expect(err).to.equal('Error: Name or password is incorrect');
                done(Sofa.stop());
            });
    });


    it('get first user', function (done) {

        internals.firstuser = {};

        Async.waterfall([
            function (next) {

                // Make connection to db.

                Sofa.connect(function (err, sessionid) {

                    expect(sessionid).to.have.length(50);
                    next();
                });
            },
            function (next) {

                User.getfirst(function (userdoc) {

                    // Edit the usedoc
                    // console.log('userdoc: ' + JSON.stringify(userdoc));
                    expect(userdoc.value.first).to.equal('Moo');

                    return next();
                });
            }], function (err) {

                // expect(err).to.equal('Error: Name or password is incorrect');
                done(Sofa.stop());
            });
    });

    it('update first user', function (done) {

        internals.firstuser = {};

        Async.waterfall([
            function (next) {

                // Make connection to db.

                Sofa.connect(function (err, sessionid) {

                    expect(sessionid).to.have.length(50);
                    next();
                });
            },
            function (next) {

                User.getfirst(function (userdoc) {

                    // Edit the usedoc
                    // console.log('userdoc: ' + JSON.stringify(userdoc));
                    expect(userdoc.value.first).to.equal('Moo');

                    // Make variable to modify user

                    internals.firstuser = userdoc;

                    //  Modify firstuser values

                    internals.firstuser.value.first = 'Nooky';
                    internals.firstuser.value.last = 'Nook';


                    // Add _id and _rev values essention to update document.

                    internals.firstuser.value._id = internals.firstuser.id;
                    internals.firstuser.value._rev = internals.firstuser.key[1];

                    User.update(internals.firstuser.value, function (err, result) {

                        //  expect(err).to.exist();;
                        expect(result.ok).to.equal(true);
                        return next();
                    });
                });
            }], function (err) {

                // expect(err).to.equal('Error: Name or password is incorrect');
                done(Sofa.stop());
            });
    });

    it('fail to update Sofa.insert broken', function (done) {

        internals.firstuser = {};

        Async.waterfall([
            function (next) {

                // Make connection to db.

                Sofa.connect(function (err, sessionid) {

                    expect(sessionid).to.have.length(50);
                    next();
                });
            },
            function (next) {

                User.getfirst(function (userdoc) {

                    // Edit the usedoc
                    // console.log('userdoc: ' + JSON.stringify(userdoc));
                    expect(userdoc.value.first).to.equal('Nooky');

                    // Make variable to modify user

                    var original = Sofa.insert;

                    Sofa.insert = function (doc, callback) {

                        return callback(new Error('Sofa insert failed to load.'));
                    };

                    User.update(userdoc.value, function (err, result) {

                        Sofa.insert = original;

                        if (err) {

                            expect(err.message).to.equal('Sofa insert failed to load.');
                            return next();
                        }
                        //  expect(err).to.exist();;
                    });
                });
            }], function (err) {

                // expect(err).to.equal('Error: Name or password is incorrect');
                done(Sofa.stop());
            });
    });

    it('fail to update first user', function (done) {

        internals.firstuser = {};

        Async.waterfall([
            function (next) {

                // Make connection to db.

                Sofa.connect(function (err, sessionid) {

                    expect(sessionid).to.have.length(50);
                    next();
                });
            },
            function (next) {

                User.getfirst(function (userdoc) {

                    // Edit the usedoc
                    // console.log('userdoc: ' + JSON.stringify(userdoc));
                    expect(userdoc.value.first).to.equal('Nooky');

                    User.update(null, function (err, result) {

                        if (err) {

                            // Joi validation did not pass.

                            expect(err.message).to.equal('\"value\" must be an object');
                            return next();
                        }
                        //  expect(err).to.exist();;
                    });
                });
            }], function (err) {

                // expect(err).to.equal('Error: Name or password is incorrect');
                done(Sofa.stop());
            });
    });
});
