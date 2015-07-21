
var nano     = require('nano')('http://localhost:5984')
, username = 'malachi'
, userpass = 'G0sp4l-D4ta'
, callback = console.log // this would normally be some callback
, cookies  = {} // store cookies, normally redis or something
;

nano.auth(username, userpass, function (err, body, headers) {

    if (err) {
        return callback(err);
    }

    if (headers && headers['set-cookie']) {
        // cookies['token'] = headers['set-cookie'];
        var cookie = headers['set-cookie'][0].match(/(?:[^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)\s*=\s*(?:([^\x00-\x20\"\,\;\\\x7F]*))/);
    }

    callback(null, "it worked cookie is: " + cookie[1]);
});
