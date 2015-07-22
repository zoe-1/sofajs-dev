var Code = require('code');
var Lab = require('lab');
var Config = require('../lib/config');
var DB = require('../lib/index');
var Nano = require('nano');
var Path = require('path');

// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var expect = Code.expect;
var it = lab.test;



describe('start couchdb', function() {

    /*
    it('register user', function (done) {
    
        var sessionCookie = DB.session();
        expect(sessionCookie).to.have.length(38);;
        done();
    });

    it('register user', function (done) {
    
        var orig = Nano.auth;
        Nano.auth = function () {
        
            return next(new Error('register version failed'));
        };

        var sessionCookie = DB.session();
        expect(sessionCookie).to.have.length(38);;
        done();
    });
    */
});
