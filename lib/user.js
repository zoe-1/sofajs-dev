var Sofa = require('./sofa.js');
var Promise = require('bluebird');
var Async = require('async');
var Bcrypt = require('bcrypt');
var Joi = require('joi');
var SALT_WORK_FACTOR = 10;

var internals = {};
internals.log = console.log;


(function () {

    var user = {};

    user.schema = {
        user: Joi.object({ // schema required for creating a new user.
                type: Joi.string().valid('user').required(),
                username: Joi.string().required(),
                pw: Joi.string().required(),
                email: Joi.string().email().required(),
                first: Joi.string().min(1).max(50).required(),
                last: Joi.string().min(1).max(50).required(1),
                scope: Joi.array().items(Joi.string().valid('admin', 'user').required())
        })
    };

    // Create User
    // Configure JSON object bcrypt etc.
    // Assume data is valid. Or, validate with joi.
    // Insert into DB.

    user.create = function (newuser, callback) {

        return Joi.validate(newuser, this.schema.user, function (err, value) {

            if (err) {
                return callback(err);
            }

           // Joi validations passed

            return internals.createAfterValidation(newuser, callback);
        });
    };

    internals.createAfterValidation = function (newuser, callback) {

        // hash newuser's password

        Bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {

            if (err) {
                return callback(err);
            }

            // hash the password using our new salt
            Bcrypt.hash(newuser.pw, salt, function (err, hash) {

                if (err) {

                    return callback(err);
                }

                // set hash in JSON document
                newuser.pw = hash;

                // Ensure newuser JSON is according to couchdb schema.
                Sofa.insert(newuser, function (err, result) {

                    // err and result are couchdb JSON doc response messages
                    if (err) {

                        return callback(err);
                    }

                    // user made
                    var response = { err: err, result: result };
                    return callback(null, response);
                });
            });
        });
    };

    module.exports = user;
}());
