var Code = require('code');
var Lab = require('lab');
var Config = require('../lib/config');
var User = require('../lib/user');
var DB = require('../lib/index');
var Nano = require('nano');
var Path = require('path');
var Async =require('async');

// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var expect = Code.expect;
var it = lab.test;

internals.id = false;

internals.mockInsertDoc = function (document) {

    return new Promise( function (resolve, reject) {

        var id;
        User.insertDoc(document, function (err, message, body) {

            console.log('promise insertDoc enterd ' + message);
            id = sessionid; 

            if (!id) {
            
                throw new Error('Failed to set session id');
            }

            // promise resolved send session id
            // @todo pass response body through.
            resolve(message);
        });
    });
};



describe('manage users', function () {

    lab.before('start session', function () {
    
    
    });

    it('insert doc 1', function (done) {

        // var newUser = User.prototype.new1({ one: 'data one', two: 'data two'});
        // var newUser =  new User();

        // var newUser = User.new1({ one: 'data one', two: 'data two'});
        // expect(newUser).to.equal(true);;
        //
        //var result = User.config(Config.nanoname, Config.nanopass, 'churchjs').connect().insertDoc({ one: 'go doc one', two: 'happy' });



        // expect(id).to.equal(false);

        Async.waterfall([
            function (next) {

                internals.next = next;
                internals.mockInsertDoc()
                    .then(function (message) {

                        console.log('resolved');
                        internals.message = message;
                        // expect(sessionid).to.equal('malachi');
                        console.log('resolved');
                        // internals.expect(internals.id[1]).to.have.length(50);;
                        //internals.done();
                        internals.next();
                    })
                    .catch(function (err) {
                     
                        internals.next();
                        //next();
                    });
            },
            function (next) {

                console.log('test ran it ');
                // assert(sessionid).to.equal('malachi');

                next();
            }
            ], function (err) {

                console.log('end of test');

                internals.expect(message).to.equal('it worked');;
                //expect(internals.id).to.have.length(50);;
                done();
                // callback(id);
            });
    });


    it('insert doc 2', function (done) {

        internals.mockInsertDoc({ one: 'go doc one', two: 'happy' })
            .then(function (message) {

                console.log('resolved');
                internals.id = sessionid;
                // expect(sessionid).to.equal('malachi');
                console.log('resolved');
                // internals.expect(internals.id[1]).to.have.length(50);;
                expect(message).to.equal('it worked');;
                done();
            })
            .catch(function (err) {
             
                done();
            });
    });
});
