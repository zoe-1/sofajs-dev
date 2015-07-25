var Code = require('code');
var Lab = require('lab');
var Config = require('../lib/config');
var Path = require('path');
var Async = require('async');
var Promise = require('bluebird');
var Fixtures = require('./fixtures/fixtures1');
var Sofa = require('../lib/sofa');

// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var expect = Code.expect;
var it = lab.test;

describe('bulk loading documents', function () {

    it('bulk insert events no previous connection', function (done) {

        // @passes
        // below is proof case of how to pass bulk docs to nano.
        // Sofa.connect(function (err, sessionid) {

        //     var sofajs = Sofa.db.use('sofajs');

        //     console.log(err + sessionid);

        //     // expect(sessionid[1]).to.have.length(50);

        //     var array = [{"one":"one"}, {"two":"two"}];
        //     var object = JSON.parse(JSON.stringify(Fixtures.events));
        //     var test  = { "docs": object };
        //     sofajs.bulk(test, function (err, body, header) {

        //         console.log(err);
        //         done();
        //     });
        // });

        Sofa.insertBulk(Fixtures.events, function (err, response) {

            // console.log('bulk insert err: '+ err );
            // console.log('bulk insert response: '+ response);
            // console.log('response[0].name: '+ response[0].id);
            expect(err).to.equal(null);
            expect(response.length).to.equal(3);
            expect(response[0].id).to.have.length(32);
            expect(response[0].ok).to.equal(true);

            // done();
            done(Sofa.stop());
        });
    });

    it('bulk insert events has previous connection', function (done) {

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

                Sofa.insertBulk(Fixtures.events, function (err, response) {

                    expect(err).to.equal(null);
                    expect(response.length).to.equal(3);
                    expect(response[0].id).to.have.length(32);
                    expect(response[0].ok).to.equal(true);

                    // console.log('after insert: ', response);
                    //expect(err.message).to.equal('Malformed AuthSession cookie. Please clear your cookies.');
                    next();
                });
            }], function (err) {

                // expect(err).to.equal('Error: Name or password is incorrect');
                done(Sofa.stop());
            });
    });

    it('fail bulk insert with previous DB connection', function (done) {

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

                Sofa.insertBulk(Fixtures.events, function (err, response) {

                    // console.log('after insert: ', response);
                    expect(err.message).to.equal('Malformed AuthSession cookie. Please clear your cookies.');
                    next();
                });
            }], function (err) {

                // expect(err).to.equal('Error: Name or password is incorrect');
                done(Sofa.stop());
            });
    });

    it('fail insertBulk document no previous DB connection', function (done) {

        Async.waterfall([
            function (next) {

                Sofa.insertBulk('bad data', function (err, response) {

                    // console.log(err +' '+ response);

                    // Successful insert document response.

                    expect(err.statusCode).to.equal(500);
                    next();
                });
            }], function (err) {

                // expect(err).to.equal('Error: Name or password is incorrect');
                done(Sofa.stop());
            });
    });


});

