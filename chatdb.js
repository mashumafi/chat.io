var mongo = require('mongodb'),
    Server = mongo.Server,
    Db = mongo.Db,
    crypto = require('crypto'),
    async = require("async");
var server = new Server("alex.mongohq.com", 10011, {
    safe: true
});
var db = new Db("chat-io", server);

function open(callback) {
    db.open(function (err, db) {
        db.authenticate("chat-io-admin", "pass", function (err, result) {
            callback(err, db);
        });
    });
}
module.exports.seed = function (callback) {
    async.forEach(["users"], remove, callback);
};

function remove(collectionName, callback) {
    var p_db;
    async.waterfall([
        open,

        function (db, callback) {
        p_db = db;
        db.collection(collectionName, callback);
    },

        function (collection, callback) {
        collection.remove(callback);
    }],

    function (err, result) {
        p_db.close();
        callback(err);
    });
}
module.exports.login = function (credentials, callback) {
    var p_db;
    async.waterfall([
        open,

        function (db, callback) {
        p_db = db;
        db.collection("users", callback);
    },

        function (collection, callback) {
        collection.find({
            username: credentials.username
        }).toArray(callback);
    },

        function (items, callback) {
        if (items.length === 0 || authenticate(credentials.password, items[0].salt, items[0].password)) {
            callback({
                err: "Invalid username/password combination"
            });
        } else {
            var item = items[0];
            callback(null, {
                username: item.username,
                email: item.email
            });
        }
    }],

    function (err, result) {
        p_db.close();
        if (!err) {
            callback(result);
        } else {
            callback(err);
        }
    });
};
module.exports.register = function (credentials, callback) {
    var p_db;
    async.waterfall([
        open,

        function (db, callback) {
        p_db = db;
        db.collection("users", callback);
    },

        function (collection, callback) {
        var hash = generatePassword(credentials.password);
        collection.insert({
            username: credentials.username,
            password: hash.password,
            salt: hash.salt,
            email: credentials.email
        }, {
            safe: true
        }, callback);
    },

        function (items, callback) {
        var item = items[0];
        callback({
            username: item.username,
            email: item.email
        });
    }],

    function (err, result) {
        p_db.close();
        if (!err) {
            callback(result);
        } else {
            callback(err);
        }
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