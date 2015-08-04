var Sofa = require('./sofa.js');
var Promise = require('bluebird');
var Async = require('async');
var Hoek = require('hoek');
var Bcrypt = require('bcrypt');
var Joi = require('joi');
var SALT_WORK_FACTOR = 10;
var LOCKOUT = 10;
var LOCKOUT_LENGTH = 60 * 1000 * 60 * 24; // 24 hours

var internals = {};
internals.log = console.log;


(function () {

    var user = {};

    user.schema = {
        user: Joi.object({ // schema required for creating a new user.
                _id: Joi.string(),
                _rev: Joi.string(),
                username: Joi.string().required(),
                pw: Joi.string().required(),
                email: Joi.string().email().required(),
                first: Joi.string().min(1).max(50).required(),
                last: Joi.string().min(1).max(50).required(1),
                scope: Joi.array().items(Joi.string().valid('admin', 'user').required()),
                loginAttempts: Joi.number().greater(-1).required(),
                lockUntil: Joi.date().required()
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

    user.authenticate = function (email, pw, callback) {

        // Get user foo@hapiu.com

        Sofa.view('users', 'list', null, function (err, response) {

             // Successful insert document response.

            // console.log('_design/users/list CALLBACK' + err);
            // console.log('_design/users/list CALLBACK' + JSON.stringify(response));

            // expect(response.rows.length).to.equal(4);

            response.rows.forEach(function (doc) {

                if (doc.value.email === email){

                    // Found matching user

                    Bcrypt.compare(pw, doc.value.pw, function (err, res) {

                        if (err) {
                            return callback(err);
                        }

                        // @todo rework this logic and tests.
                        // Increment error count

                        if (res === false) {

                            // pw incorrect

                            // Attempt to get most recent revision
                            // This gets the most recent revision.  couchDB caching seems to do some
                            // funky stuff with views where you do not allows get the most recent revision in the views.
                            // Below is an example of that. However, using the user.findbyid() seems to get around it. 

                            user.findbyid(doc.id, function (err, docu) {
                            
                                // console.log('bad pw given');
                                // console.log('before test doc.value.lockUntil: ' + doc.value.lockUntil);
                                // console.log('before test Date(doc.value.lockUntil): ' + Date(doc.value.lockUntil));
                                // console.log('before test doc.now(): ' + Date.now());

                                if (docu.value.lockUntil > Date.now()) {

                                    console.log('lockUntil > Date.now already locked out' + docu.id);
                                    console.log('' + JSON.stringify(docu));
                                    console.log(docu.value.lockUntil);
                                    console.log(Date.now());
                                    // User locked out but attempted access.
                                    // return callback(null, 'locked out -- badpw33');
                                    return callback(null, false);
                                }

                                user.increment(docu, function (result){

                                    return callback(null, res);
                                });
                            }); 
                        } else {

                            console.log('correct pw given:');
                            // console.log('AUTH doc.:  ' + JSON.stringify(doc));
                            // console.log('doc.value.lockUntil:  ' + Date(doc.value.lockUntil));

                            if (doc.value.lockUntil > Date.now()) {

                                // User locked out but attempted access.
                                // res is true because authenticate ok, but lockUntil trumps
                                // valid credentials. Reject the auth request.
                                // console.log('but lockUntil: >  Now ');
                                // return callback(null, 'locked out -- okpw');
                                return callback(null, false);
                            }

                            // Successfully logged in. Restart log lockout count

                            user.incrementReset(doc, function (result){

                                // console.log('---reset increment started');
                                if (result === 'reset incrementation') {
                                    // console.log('bcrypt compare: ' + res);
                                    // res == true or res == false
                                    return callback(null, res);
                                }
                            });
                            // return callback(null, res);
                        }
                    });
                }

                // Make response if email does not exist.
            });
        });
    };


    user.increment = function (doc, callback) {

        ++doc.value.loginAttempts;

        // Set _id & _rev values for update
        doc.value._id = doc.id;
        doc.value._rev = doc.key[1];

        // console.log(doc.value.loginAttempts);

        // lock them out

        if (doc.value.loginAttempts >= LOCKOUT && doc.value.lockUntil < Date.now() ) {
            // console.log('lockout turned on' + JSON.stringify(doc.value));
            // doc.value.lockUntil = new Date.now() + LOCKOUT_LENGTH;
            doc.value.lockUntil = Date.now() + LOCKOUT_LENGTH;
        } else if (doc.value.loginAttempts >= LOCKOUT && doc.value.lockUntil > Date.now()) {

            // Restart incrementation count

            // console.log('reset loginAttempts');
            doc.value.loginAttempts = 1;
        }

        // console.log('----');
        // console.log('_id: ' + doc.value._id +
        //             '\n' +
        //             '_rev: ' + doc.value._rev +
        //             '\n' +
        //             'email: ' + doc.value.email
        //             );

        user.update(doc.value, function (err, result) {

            // update succeeded

            return callback('incremented');
        });
    };

    user.incrementReset = function (doc, callback) {

        // Logged in successfully reset incrementation count.

        // Set _id & _rev values for update
        doc.value._id = doc.id;
        doc.value._rev = doc.key[1];

        // console.log(doc.value.loginAttempts);

        // lock them out

        doc.value.loginAttempts = 1;

        // console.log('----');
        // console.log('_id: ' + doc.value._id +
        //             '\n' +
        //             '_rev: ' + doc.value._rev +
        //             '\n' +
        //             'email: ' + doc.value.email
        //             );

        user.update(doc.value, function (err, result) {

            // reset the incrementation

            return callback('reset incrementation');
        });
    };

    user.findby = function (key, value, callback) {

        // console.log('key: ' + key + ' value: ' + value);
        // callback(null, 'findby callback response');

        // Get key and search for doc with it.

        Sofa.view('users', 'list', null, function (err, response) {

             // Successful insert document response.

            var counter = 0;

            if (!err) {

                response.rows.forEach(function (doc) {

                    ++counter;

                    // console.log('doc here: ' + JSON.stringify(doc));
                    // console.log('key here: ' + key);
                    // console.log('lenght: ' +response.rows.length);
                    // console.log('attempt here: ' + doc.value[key]);

                    if (doc.value[key] === value) {

                        // console.log('found');
                        // found match
                        return callback(null, doc);
                    } else if (counter > (response.rows.length - 1)) {
                        return callback(null, 'no record found');
                    }
                });
            }
        });
    };

    // @problem This function would not stop executing the loop
    // after finding the id.  It would keep executing so switched to every() logic.
    // See: http://stackoverflow.com/questions/6260756/how-to-stop-javascript-foreach
    //
    // user.findbyid = function (id, callback) {

    //     // console.log('findbyid id: ' + id);
    //     // callback(null, 'findby callback response');

    //     // Get key and search for doc with it.

    //     Sofa.view('users', 'list', null, function (err, response) {

    //          // Successful insert document response.

    //         var counter = 0;

    //         if (!err) {

    //             response.rows.forEach(function (doc) {

    //                 ++counter;

    //                 // console.log('doc here: ' + JSON.stringify(doc));
    //                 // console.log('id here: ' + id);
    //                 // console.log('rows length: ' +response.rows.length);
    //                 // console.log('rows id: ' + doc.id);
    //                 // console.log('attempt here: ' + doc.value[key]);

    //                 if (doc.id === id) {

    //                     // console.log('found match');
    //                     // found match
    //                     return callback(null, doc);
    //                 }

    //                 if (counter === response.rows.length) {
    //                     // No record found
    //                     return callback(null, 'no record found');
    //                 }
    //             });
    //         }
    //     });
    // };

    user.findbyid = function (id, callback) {

        Sofa.view('users', 'list', null, function (err, response) {

            // Search user rows for user.

            if (!err) {

                // internals.result = null;
                var counter = 0;

                response.rows.every(function (doc) {

                    ++counter;

                    // console.log('id ' + id);
                    // console.log('doc.id ' + doc.id);

                    if (doc.id === id) {
                        // console.log('false here' + JSON.stringify(doc));
                        // internals.result =  doc;
                        callback(null, doc);
                        return false;
                    }

                    if (counter < response.rows.length) {
                        // console.log('ooped');
                        return true;
                    }

                    if (counter === response.rows.length) {
                        // callback(null, 'no record found');
                        console.log('last record reached');
                        callback(null, 'no record found');
                        return true;
                    }
                });
            }
        });
    };

    user.update = function (newdoc, callback) {

        // Expects that _id and _rev are set.

        Joi.validate(newdoc, this.schema.user, function (err, value) {

            if (err) {
                return callback(err);
            }

            // Joi validations passed

            Sofa.insert(newdoc, function (err, result) {

                // err and result are couchdb JSON doc response messages
                if (err) {

                    return callback(err);
                }

                // user succesfully updated

                return callback(null, result);
            });
        });

    };

    user.getfirst = function (callback) {

        Sofa.view('users', 'list', null, function (err, response) {

             // Successful insert document response.

            // console.log('_design/users/list CALLBACK' + err);
            // console.log('_design/users/list CALLBACK' + JSON.stringify(response));

            var i = 0;

            response.rows.some(function (doc) {

                if (i === 0){

                    ++i;
                    // got first user
                    // console.log(doc);
                    return callback(doc);
                }
                ++i;
            });
        });
    };

    module.exports = user;
}());
