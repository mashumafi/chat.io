var mongo = require('mongodb'),
    Server = mongo.Server,
    Db = mongo.Db,
    crypto = require('crypto');
var server = new Server("alex.mongohq.com", 10011, {
    safe: false
});
var db = new Db("chat-io", server);

function open(success, error) {
    db.open(function(err, db) {
        db.authenticate("chat-io-admin", "pass", function(err, result) {
            if (!err) {
                success(db);
            }
            else {
                error(err);
                db.close();
            }
        });
    });
}

module.exports.login = function(credentials, callback) {
    open(function(db) {
        db.collection("users", function(err, collection) {
            if (!err) {
                collection.find({
                    username: credentials.username
                }).toArray(function(err, items) {
                    if (!err) {
                        if (items.length === 0 || authenticate(credentials.password, items[0].salt, items[0].password)) {
                            callback({
                                err: "Invalid username/password combination"
                            });
                        }
                        else {
                            var item = items[0];
                            callback({
                                username: item.username,
                                email: item.email
                            });
                        }
                        db.close();
                    }
                    else {
                        callback(err);
                        db.close();
                    }
                });
            }
            else {
                callback(err);
                db.close();
            }
        });
    }, callback);
};

module.exports.register = function(credentials, callback) {
    open(function(db) {
        db.collection("users", function(err, collection) {
            if (!err) {
                collection.find({
                    username: credentials.username
                }).toArray(function(err, items) {
                    if (!err) {
                        var hash = generatePassword(credentials.password);
                        collection.insert({
                            username: credentials.username,
                            password: hash.password,
                            salt: hash.salt,
                            email: credentials.email
                        }, function(err, item) {
                            if (!err) {
                                item = item[0];
                                callback({
                                    username: item.username,
                                    email: item.email
                                });
                            }
                            else {
                                callback(err);
                            }
                            db.close();
                        });
                    }
                    else {
                        callback(err);
                        db.close();
                    }
                });
            }
            else {
                callback(err);
                db.close();
            }
        });
    }, callback);
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