var crypto = require('crypto'),
    async = require("async"),
    mongoose = require("mongoose"),
    Types = mongoose.Types,
    ObjectId = Types.ObjectId,
    models = require("./models"),
    User = models.User,
    Relationship = models.Relationship;
module.exports.seed = function (callback) {
    async.forEachSeries([User, Relationship], remove, function () {
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
            login(credentials, user, callback);
        }
    });
};

function login(credentials, user, callback) {
    user.session = {
        _id: credentials.session,
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
            login(credentials, user, callback);
        }
    });
};
module.exports.logout = function (data, callback) {
    User.findOne({
        "session._id": data.session
    }, function (err, user) {
        if (!err && user && user.session) {
            user.session._id = null;
            user.session.started = null;
            user.session.lastActivity = null
            user.save(callback);
        } else {
            callback("Unexpected error!");
        }
    });
};
module.exports.addFriend = function (data, callback) {
    addRelationship(true, data, callback);
};

function addRelationship(relationship, data, callback) {
    async.parallel({
        user: function (callback) {
            User.findOne({
                "session._id": data.session
            }, callback);
        },
        friend: function (callback) {
            User.findOne({
                username: data.username
            }, callback)
        }
    },

    function (err, result) {
        if (!err && result.user && result.friend) {
            if (ObjectId.toString(result.user._id) != ObjectId.toString(result.friend._id)) {
                Relationship.update({
                    owner: result.user._id,
                    other: result.friend._id
                }, {
                    relationship: relationship,
                    when: new Date
                }, {
                    upsert: true
                }, function (err) {
                    if (err) {
                        callback( !! err);
                    } else {
                        Relationship.findOne({
                            owner: result.friend._id,
                            other: result.user._id
                        }, function (err, relationship) {
                            if (err) {
                                callback( !! err);
                            } else {
                                if (relationship && relationship.relationship) {
                                    callback(null, {
                                        _id: result.friend._id,
                                        username: result.friend.username,
                                        lastActivity: result.friend.session.lastActivity
                                    });
                                } else {
                                    callback(null, false);
                                }
                            }
                        });
                    }
                });
            } else {
                callback("You cannot add yourself");
            }
        } else {
            callback( !! err);
        }
    });
}
module.exports.listFriends = function (data, callback) {
    User.findOne({
        "session._id": data.session
    }, function (err, user) {
        async.parallel({
            owner: function (callback) {
                Relationship.find().where('owner').equals(user._id).sort({
                    'other': 1
                }).populate("other", 'username session.lastActivity').select('-_id other relationship').exec(callback);
            },
            other: function (callback) {
                Relationship.find().where('other').equals(user._id).sort({
                    'owner': 1
                }).populate("owner", 'username session.lastActivity').select('-_id owner relationship').exec(callback);
            }
        }, function (err, results) {
            if (!err) {
                var ret = {
                    friends: [],
                    blocked: [],
                    requests: []
                };
                var other, owner;
                for (var i = 0, j = 0; i < results.owner.length; i++) {
                    owner = results.owner[i];
                    other = results.other[j];
                    while (j < results.other.length && Object.toString(other.owner._id) < Object.toString(owner.other._id)) {
                        /*if (other && other.relationship) {
                            ret.requests.push(other.owner.username);
                        }*/
                        j++;
                        other = results.other[j];
                    }
                    if (j < results.other.length) {
                        if (Object.toString(other.owner._id) == Object.toString(owner.other._id) && owner.relationship && other.relationship) {
                            // both are friends
                            ret.friends.push({
                                username: owner.other.username,
                                _id: owner.other._id,
                                lastActivity: owner.other.session.lastActivity
                            });
                            results.other.splice(j, 1);
                        } else if (owner.relationship) {
                            // unary friendship
                            ret.friends.push({
                                username: owner.other.username
                            });
                        } else {
                            // blocked
                            ret.blocked.push({
                                username: owner.other.username
                            });
                        }
                    } else {
                        if (owner.relationship) {
                            // unary friendship
                            ret.friends.push({
                                username: owner.other.username
                            });
                        } else {
                            // blocked
                            ret.blocked.push({
                                username: owner.other.username
                            });
                        }
                    }
                }
                var others = results.other;
                for (var i = 0; i < others.length; i++) {
                    if (others[i].relationship) {
                        ret.requests.push({
                            username: others[i].owner.username
                        });
                    }
                }
                callback(null, ret);
            } else {
                callback( !! err);
            }
        });
    });
};

function removeRelationship(data, callback) {
    async.parallel({
        user: function (callback) {
            User.findOne({
                "session._id": data.session
            }, callback);
        },
        friend: function (callback) {
            User.findOne({
                username: data.username
            }, callback)
        }
    },

    function (err, result) {
        if (!err && result.user && result.friend) {
            Relationship.find({
                owner: result.user._id,
                other: result.friend._id
            }).remove(function (err, result) {
                callback( !! err);
            });
        } else {
            callback( !! err);
        }
    });
}
module.exports.removeFriend = function (data, callback) {
    removeRelationship(data, callback);
};
module.exports.blockUser = function (data, callback) {
    addRelationship(false, data, callback);
};
module.exports.unblockUser = function (data, callback) {
    removeRelationship(data, callback);
};
module.exports.denyFriend = function (data, callback) {
    async.parallel({
        user: function (callback) {
            User.findOne({
                "session._id": data.session
            }, callback);
        },
        friend: function (callback) {
            User.findOne({
                username: data.username
            }, callback)
        }
    },

    function (err, result) {
        if (!err && result.user && result.friend) {
            Relationship.find({
                owner: result.friend._id,
                other: result.user._id
            }).remove(function (err, result) {
                callback( !! err);
            });
        } else {
            callback( !! err);
        }
    });
};
module.exports.isBlockedUser = function (data, callback) {
    async.parallel({
        user: function (callback) {
            User.findOne({
                "session._id": data.session
            }, callback);
        },
        friend: function (callback) {
            User.findOne({
                username: data.username
            }, callback)
        }
    },

    function (err, result) {
        if (!err) {
            Relationship.findOne({
                owner: result.user._id,
                other: result.friend._id
            }, function (err, result) {
                callback(err, result.relationship === false);
            });
        } else {
            callback(err);
        }
    });
};
module.exports.isFriend = function (data, callback) {
    async.parallel({
        user: function (callback) {
            User.findOne({
                "session._id": data.session
            }, callback);
        },
        friend: function (callback) {
            User.findOne({
                username: data.username
            }, callback)
        }
    },

    function (err, result) {
        if (!err) {
            Relationship.find().or([{
                owner: result.user._id,
                other: result.friend._id
            }, {
                owner: result.friend._id,
                other: result.user._id
            }]).exec(function (err, result) {
                callback(err, result && result.length === 2 && result[0].relationship && result[1].relationship);
            });
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
    return crypto.createHmac('sha1', salt + "secret string").update(password + "super secret").digest('hex');
}
