var Code = require('code');
var Lab = require('lab');
var Config = require('../lib/config');
var Path = require('path');
var Async = require('async');
var Sofa = require('../lib/sofa');
var Promise = require('bluebird');
var Fixtures = require('./fixtures/fixtures1');
var Nano = require('nano')('http://localhost:5984');

// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var expect = Code.expect;
var it = lab.test;

describe('pre-test cleanup', function () {

    it('connect as root, destroy old DB, create new DB', function (done) {

        // Make connect as root

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

                // Try to connect after connection established.

                Sofa.connect(function (err) {

                    expect(err).to.equal('already connected.');

                    next();
                });
            },
            function (next) {

                // Destroy old database

                Sofa.destroy(function (err, response) {

                    // console.log('------');
                    expect(err).to.exist();
                    //expect(response).to.equal('destroyed db');
                    // console.log(response);
                    next();
                });
            },
            function (next) {

                // Create new database

                Sofa.create(function (err, response) {

                    // console.log('create entered' + response);
                    expect(response.ok).to.equal(true);
                    next();
                });
            },
            function (next) {

                // Fail to create new database  Coverage play.

                Config.db = null;

                Sofa.create(function (err, response) {

                    expect(err).to.exist();
                    Config.db = 'sofajs';
                    next();
                });
            }], function (err) {

                // expect(err).to.equal('Error: Name or password is incorrect');
                done(Sofa.stop());
            });
    });


    it('create db without previous session created', function (done) {

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

                // Try to connect after connection established.

                Sofa.connect(function (err) {

                    expect(err).to.equal('already connected.');

                    next();
                });
            },
            function (next) {

                // If db exists destroy it.
                // Destroy old database. This passes even if it does not exist.

                Sofa.destroy(function (err, response) {

                    // console.log('------');
                    expect(response).to.equal('destroyed db');
                    // console.log(response);

                    // Stop here to get coverage.
                    // If stopped, no sessionid exists and new connection created.
                    Sofa.stop();
                    next();
                });
            },
            function (next) {

                // create DB with no pre-existing session

                Sofa.create(function (err, response) {

                    // console.log('create entered' + response);
                    expect(response.ok).to.equal(true);
                    Sofa.stop();
                    next();
                });
            },
            function (next) {

                // Fail to create db with no session previously existing  Coverage play.

                Sofa.create(function (err, response) {

                    expect(err).to.exist();
                    next();
                });
            }], function (err) {

                done(Sofa.stop());
            });
    });

});

describe('destroy databases', function () {

    it('destroy database when no pre-existing session created.', function (done) {

        Async.waterfall([
            function (next) {

                // Get coverage

                Sofa.destroy(function (err, response) {

                    expect(response).to.equal('destroyed db');
                    next();
                });
            }, function (next) {

                // Remake DB because future tests assume it exits.

                Sofa.create(function (err, response) {

                    // expect(err).to.exist();
                    expect(response.ok).to.equal(true);
                    next();
                });
            }], function (err) {

                done(Sofa.stop());
            });
    });

    it('failed to destroy database', function (done) {

        // No session id previously exists when making DB.

        Config.db = null;
        Sofa.destroy(function (err, response) {

            Config.db = 'sofajs';

            // console.log('destroy err here: ' + err.message + response);

            expect(err.message).to.equal('Only GET,HEAD allowed');
            done(Sofa.stop());
        });
    });

    it('failed to destroy database with session existing', function (done) {

        // No session id previously exists when making DB.

        Async.waterfall([
            function (next) {

                // Make connection to db.

                Sofa.connect(function (err, sessionid) {

                    expect(sessionid).to.have.length(50);
                    next();
                });
            }, function (next) {

                Config.db = null;

                // fail to destroy existing DB get coverage.
                Sofa.destroy(function (err, response) {

                    Config.db = 'sofajs';
                    expect(err.message).to.equal('Only GET,HEAD allowed');

                    // console.log('err here: ' + err + response);
                    // expect(err).to.exist();
                    next();
                });
            }], function (err) {

                done(Sofa.stop());
            });
    });
});

describe('initiate session', function () {

    it('success authentication and connect', function (done) {

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

                // Try to connect after connection established.

                Sofa.connect(function (err) {

                    expect(err).to.equal('already connected.');
                    next();
                });
            }], function (err) {

                // expect(err).to.equal('Error: Name or password is incorrect');
                done(Sofa.stop());
            });
    });

    it('fail bad authentication credentials', function (done) {

        // Set bad pw

        Config.pw = 'badpwyoyo';

        Async.waterfall([
            function (next) {

                // Make connection to db.

                Sofa.connect(function (err) {

                    expect(err).to.equal('Name or password is incorrect.');
                    next();
                });
            },
            function (next) {

                // Ensure db sessionid was set.

                expect(Sofa.sessionid).to.equal(undefined);
                next();
            }], function (err) {

                Config.pw = 'G0sp4l-D4ta';
                // expect(err).to.equal('Error: Name or password is incorrect');
                done(Sofa.stop());
            });
    });

    it('success get current session details', function (done) {

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

                // Get details of current session
                Sofa.current(function (err, details) {

                    expect(err).to.equal(null);
                    expect(details).to.equal('User is malachi and has these roles: _admin');
                    next();
                });
            }], function (err) {

                // expect(err).to.equal('Error: Name or password is incorrect');
                done(Sofa.stop());
            });
    });


    it('fail to get current session data', function (done) {

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

                Sofa.sessionid = '8899badid';

                // Get details of current session
                Sofa.current(function (err, details) {

                    expect(err.message).to.equal('Malformed AuthSession cookie. Please clear your cookies.');
                    // expect(details).to.equal('User is malachi and has these roles: _admin');
                    next();
                });
            }], function (err) {

                // expect(err).to.equal('Error: Name or password is incorrect');
                done(Sofa.stop());
            });
    });

    it('couchdb makes new session cookie -- @fix this', function (done) {

        // @todo this test does not work.
        // must re-work it to get nano coverage
        Async.waterfall([
            function (next) {

                // Make connection to db.
                Nano.db.insert = function (newuser, callback) {

                    console.log('mock insert ran');
                    var headers = 'mock couchdb new header value';
                    db.insert = orig;
                    return callback('breakit', 'test response', headers);
                };

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


                next();
            },
            function (next) {

                var fakeInsert = function (userdoc) {

                    Sofa.insert(userdoc, function (err, result) {

                        // console.log(JSON.stringify(err));
                        // console.log(JSON.stringify(result));
                        // expect(err.message).to.equal('message');;
                        // expect(err).to.equal('breakit');
                        //expect(err).to.equal(null);
                        //expect(result).to.equal('test response');
                        // expect(err.name).to.equal('ValidationError');
                        // expect(err.message).to.equal('\"value\" must be an object');
                        // console.log('error details: ' + JSON.stringify(err.details) );
                        // console.log('error ' + JSON.stringify(err) + ' ' + JSON.stringify(result));
                        next();
                    });
                };

                fakeInsert(Fixtures.users[2]);
            }], function (err) {

                // expect(err).to.equal('Error: Name or password is incorrect');
                done(Sofa.stop());
            });
    });
});


describe('insert documents', function () {

    it('success insert document with previous DB connection', function (done) {

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

                Sofa.insert({ name: 'sofa doc test', body: 'more docs' }, function (err, response) {

                    // console.log('after insert: ', response);
                    expect(response.ok).to.equal(true);
                    expect(response.id).to.have.length(32);
                    next();
                });
            }], function (err) {

                // expect(err).to.equal('Error: Name or password is incorrect');
                done(Sofa.stop());
            });
    });

    it('fail insert with previous DB connection', function (done) {

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

                Sofa.sessionid = 'badsessionid';

                // Insert Document to DB.

                Sofa.insert({ name: 'sofa doc test', body: 'more docs' }, function (err, response) {

                    // console.log('after insert: ', response);
                    expect(err.message).to.equal('Malformed AuthSession cookie. Please clear your cookies.');
                    next();
                });
            }], function (err) {

                // expect(err).to.equal('Error: Name or password is incorrect');
                done(Sofa.stop());
            });
    });

    it('successfully insert document no previous DB connection', function (done) {

        Async.waterfall([
            function (next) {

                Sofa.insert({ name: 'sofa doc test', body: 'more docs' }, function (err, response) {

                    // Successful insert document response.

                    expect(response.ok).to.equal(true);
                    expect(response.id).to.have.length(32);
                    next();
                });
            }], function (err) {

                // expect(err).to.equal('Error: Name or password is incorrect');
                done(Sofa.stop());
            });
    });

    it('fail insert document no previous DB connection', function (done) {

        Async.waterfall([
            function (next) {

                Sofa.insert('bad data submitted', function (err, response) {

                    // Successful insert document response.

                    expect(err.error).to.equal('bad_request');
                    next();
                });
            }], function (err) {

                // expect(err).to.equal('Error: Name or password is incorrect');
                done(Sofa.stop());
            });
    });

    it('fail to load document with custom id', function (done) {

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

                Sofa.insertID(null, null, function (err, response) {

                     // Failed to insert document with ID supplied to couchDB.

                    expect(err).to.exist();
                    expect(err.message).to.equal('invalid_json');
                    next();
                });

            }], function (err) {

                // expect(err).to.equal('Error: Name or password is incorrect');
                done(Sofa.stop());
            });
    });

    it('fail _design/user list view function', function (done) {

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

                Sofa.view('wakakadoc', 'missingview', null, function (err, response) {

                     // Fail to execute view.

                    expect(err).to.exist();

                    next();
                });

            }], function (err) {

                // expect(err).to.equal('Error: Name or password is incorrect');
                done(Sofa.stop());
            });
    });
});
