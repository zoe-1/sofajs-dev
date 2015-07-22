var Code = require('code');
var Lab = require('lab');
var Config = require('../lib/config');
var User = require('../lib/user');
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



describe('manage users', function() {

    it('register user', function (done) {
    
        // var newUser = User.prototype.new1({ one: 'data one', two: 'data two'});
        // var newUser =  new User();

        var newUser = User.new1({ one: 'data one', two: 'data two'});
        expect(newUser).to.equal(true);;
        done();
    });
});
