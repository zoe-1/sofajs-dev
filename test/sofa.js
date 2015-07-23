var Code = require('code');
var Lab = require('lab');
var Config = require('../lib/config');
var Path = require('path');
var Async = require('async');
var Sofa = require('../lib/sofa');
var Promise = require('bluebird');

// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var expect = Code.expect;
var it = lab.test;


describe('couchdb', function () {

    it('authenticate and connect', function (done) {

        Async.waterfall([
            function (next) {

                // Make connection to db.

                Sofa.connect(function (sessionid) {

                    expect(sessionid).to.have.length(50);
                    next();
                });
            },
            function (next) {

                // Ensure db sessionid was set.

                expect(Sofa.sessionid).to.have.length(50);
                next();
            }], function (err) {

                // expect(err).to.equal('Error: Name or password is incorrect');
                done(Sofa.stop());
            });
    });

    it('authentication fails', function (done) {

        // Set bad pw

        Config.pw = 'badpwyoyo';

        Async.waterfall([
            function (next) {

                // Make connection to db.

                Sofa.connect(function (errormessage) {

                    expect(errormessage).to.equal('Name or password is incorrect.');
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

    it('get current session details', function (done) {

        Async.waterfall([
            function (next) {

                // Make connection to db.

                Sofa.connect(function (sessionid) {

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

    it('fail to get session details', function (done) {

        Async.waterfall([
            function (next) {

                // Make connection to db.

                Sofa.connect(function (sessionid) {

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

    it('Add new document', function (done) {

        Async.waterfall([
            function (next) {

                // Make connection to db.

                Sofa.connect(function (sessionid) {

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
});
