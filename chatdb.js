var crypto = require('crypto'),
    async = require("async"),
    mongoose = require("mongoose"),
    Types = mongoose.Types,
    ObjectId = Types.ObjectId,
    models = require("./models"),
    User = models.User;
module.exports.seed = function (callback) {
    async.forEachSeries([User], remove, function () {
        async.forEachSeries([{
            username: "schwowsers",
            password: "A#3edcde",
            email: "fake2@fake.fake"
        }, {
            username: "nagolyhprum",
            password: "Pa55word!",
            email: "fake@fake.fake"
        }], module.exports.register, function (err, res) {
            callback(err, res);
        })
    });
};

function remove(collection, callback) {
    async.waterfall([
        function (callback) {
        collection.remove(callback);
    }],

    function (err, result) {
        callback(err, result);
    });
}
module.exports.login = function (credentials, callback) {
    User.findOne({
        username: credentials.username
    }, function (err, user) {
        if (!user || authenticate(credentials.password, user.salt, user.password)) {
            callback({
                auth: "Invalid username/password combination"
            });
        } else {
            login(user, callback);
        }
    });
};
function login(user, callback) {
    user.session = {
        _id: new ObjectId,
        started: new Date,
        lastActivity: new Date,
    };
    user.save(function (err, user) {
        callback(err, {
            username: user.username,
            email: user.email,
            session: user.session._id
        });
    });
}
module.exports.register = function (credentials, callback) {
    var hash = generatePassword(credentials.password);
    User.create({
        username: credentials.username,
        password: hash.password,
        salt: hash.salt,
        email: credentials.email
    }, function (err, user) {
        if (err) {
            callback(err, user);
        } else {
            login(user, callback);
        }
    });
};
module.exports.addFriend = function (data, callback) {
    async.parallel({
        user: function (callback) {
            User.findOne({
                "session._id": data.session
            }, callback);
        },
        friend: function (callback) {
            User.findOne({
                username: data.friend
            }, callback)
        }
    },

    function (err, result) {
        if (!err) {
            async.parallel([
                function (callback) {
                result.user.relationships.push({
                    _id: result.friend._id,
                    relationship: true,
                    when: new Date
                });
                result.user.save(callback);
            }, function (callback) {
                result.friend.relationships.push({
                    _id: result.user._id,
                    relationship: null,
                    when: new Date
                });
                result.friend.save(callback);
            }], function (err, result) {
                if (err) {
                    callback(err, result);
                } else {
                    callback(err, [result[0][0]._id, result[1][0]._id]);
                }
            });
        } else {
            callback(err, result);
        }
    });
};
module.exports.listFriends = function (data, callback) {
    User.findOne({
        "session._id": data.session
    }).populate('relationships._id', 'username').select("relationships._id").exec(function (err, user) {
        async.map(user.relationships, function (item, callback) {
            callback(err, item._id);
        }, callback);
    });
};
module.exports.removeFriend = function (data, callback) {
    data.userid;
    data.friend; // username
    callback();
};
module.exports.blockUser = function (data, callback) {
    async.parallel({
        user: function (callback) {
            User.findOne({
                "session._id": data.session
            }, callback);
        },
        enemy: function (callback) {
            User.findOne({
                username: data.enemy
            }, callback)
        }
    },

    function (err, result) {
        if (!err) {
            result.user.relationships.push({
                _id: result.enemy._id,
                relationship: false,
                when: new Date
            });
            result.user.save(function (err) {
                if (err) {
                    callback(err, result);
                } else {
                    callback(err, [result.user._id, result.enemy._id]);
                }
            });
        } else {
            callback(err, result);
        }
    });
};
module.exports.unblockUser = function (data, callback) {
    data.userid;
    data.enemy; // username
    callback();
};
module.exports.isBlockedUser = function (data, callback) {
    data.userid;
    data.enemy; // username
    callback();
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