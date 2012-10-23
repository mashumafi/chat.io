var mongo = require('mongodb'),
    Server = mongo.Server,
    Db = mongo.Db,
    crypto = require('crypto'),
    async = require("async");
var server = new Server("alex.mongohq.com", 10011, {
    safe: false
});
var db = new Db("chat-io", server);

function open(callback) {
    db.open(function(err, db) {
        db.authenticate("chat-io-admin", "pass", function(err, result) {
            callback(err, db);
        });
    });
}

module.exports.login = function(credentials, callback) {
    async.waterfall([
    open,

    function(db, callback) {
        db.collection("users", callback);
    },

    function(collection, callback) {
        collection.find({
            username: credentials.username
        }).toArray(callback);
    },

    function(items, callback) {
        if (items.length === 0 || authenticate(credentials.password, items[0].salt, items[0].password)) {
            callback({
                err: "Invalid username/password combination"
            });
        }
        else {
            var item = items[0];
            callback(null, {
                username: item.username,
                email: item.email
            });
        }
    }],

    function(err, result) {
        if (!err) {
            callback(result);
        }
        else {
            callback(err);
        }
        db.close();
    });
};

module.exports.register = function(credentials, callback) {
    async.waterfall([
    open,

    function(db, callback) {
        db.collection("users", callback);
    },

    function(collection, callback) {
        var hash = generatePassword(credentials.password);
        collection.insert({
            username: credentials.username,
            password: hash.password,
            salt: hash.salt,
            email: credentials.email
        }, callback);
    },

    function(items, callback) {

        var item = items[0];
        callback({
            username: item.username,
            email: item.email
        });
    }],

    function(err, result) {
        if (!err) {
            callback(result);
        }
        else {
            callback(err);
        }
        db.close();
    });
};

function generatePassword(password) {
    var salt = makeSalt();
    return {
        password: encryptPassword(salt, password),
        salt: salt
    };
}

function authenticate(password, salt, hashed_password) {
    return encryptPassword(password, salt) === hashed_password;
}

function makeSalt() {
    return Math.round((new Date().valueOf() * Math.random())) + '';
}

function encryptPassword(salt, password) {
    return crypto.createHmac('sha1', salt).update(password).digest('hex');
}