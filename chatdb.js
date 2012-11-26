var crypto = require('crypto'),
    async = require("async"),
    mongoose = require("mongoose"),
    Types = mongoose.Types,
    ObjectId = Types.ObjectId,
    models = require("./models"),
    User = models.User,
    Relationship = models.Relationship;
/**
 * Initialize the database for testing
 * @param {Function} callback the function that is called when everything is finsihed
 * @returns
 */
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
/**
 * @collection {Model} collection the collection to remove
 * @param {function} callback the function that is called when everything is finsihed
 * @returns
 */
function remove(collection, callback) {
    async.waterfall([
        function (callback) {
        collection.remove(callback);
    }],

    function (err, result) {
        callback(err, result);
    });
}
/**
 * The external login function
 * @param {Object} credentials details used to login
 * @param {Function} callback the function that is called when everything is finsihed
 * @returns
 */
module.exports.login = function (credentials, callback) {
    User.findOne({
        username: credentials.username
    }, function (err, user) {
        if (!user || !authenticate(credentials.password, user.salt, user.password)) {
            callback({
                auth: "Invalid username/password combination"
            });
        } else {
            login(credentials, user, callback);
        }
    });
};
/**
 * Logs a user into chat
 * @param {Object} credentials the details the user provided for login/registration
 * @param {Object} user the user from the database
 * @param {Function} callback the function that is called when everything is finsihed
 * @returns callback(err, res) if it succeeds the callback is passed to login
 * @see login()
 */
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
/**
 * Registers a new user and logs them in
 * @param {Object} credentials the details the user provided for registration
 * @param {Function} callback the function that is called when everything is finsihed
 * @returns callback(err, res) if it succeeds the callback is passed to login
 * @see login()
 */
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
/**
 * @param {Object} data contains session of current user
 * @param {Function} callback the function that is called when everything is finsihed
 */
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
/**
 * @param {Object} data contains session of current user and username of the friend to add
 * @param {Function} callback the function that is called when everything is finsihed
 * @returns callback(err, res) res will contain details of relation if mutual friends
 */
module.exports.addFriend = function (data, callback) {
    addRelationship(true, data, callback);
};
/**
 * @param {Boolean} relationship whether to block or friend someone
 * @param {Object} data contains session of current user and username of relation to add
 * @param {Function} callback the function that is called when everything is finsihed
 * @returns callback(err, res) res will contain details of relation if mutual friends
 */
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
/**
 * @param {Object} data contains session of current user
 * @param {Function} callback the function that is called when everything is finsihed
 * @returns callback(err, res) where res is {Object} with friends, blocked and request {Array}
 */
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
/**
 * @param {Object} data contains session of current user and username of the user unrelate
 * @param {function} callback the function that is called when everything is finsihed
 * @returns callback(err, res) if err is false then it succeeded
 */
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
/**
 * @param {Object} data contains session of current user and username of the user to defriend
 * @param {Function} callback the function that is called when everything is finsihed
 * @returns callback(err, res) if err is false then it succeeded
 */
module.exports.removeFriend = function (data, callback) {
    removeRelationship(data, callback);
};
/**
 * @param {Object} data contains session of current user and username of the user to block
 * @param {Function} callback the function that is called when everything is finsihed
 * @returns callback(err, res) if err is false then it succeeded
 */
module.exports.blockUser = function (data, callback) {
    addRelationship(false, data, callback);
};
/**
 * @param {Object} data contains session of current user and username of the user to unblock
 * @param {Function} callback the function that is called when everything is finsihed
 * @returns callback(err, res) if err is false then it succeeded
 */
module.exports.unblockUser = function (data, callback) {
    removeRelationship(data, callback);
};
/**
 * @param {Object} data contains session of current user and username of the user to deny
 * @param {Function} callback the function that is called when everything is finsihed
 * @returns callback(err, res) if err is false then it succeeded
 */
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
/**
 * @param {Object} data contains session of current user and username of the blocked user
 * @param {Function} callback the function that is called when everything is finsihed
 * @returns callback(err, res) where res is true if they are blocked by the 
 */
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
/**
 * @param {Object} data contains session of current user and username of the friend
 * @param {Function} callback the function that is called when everything is finsihed
 * @returns callback(err, res) if res is true then they are friends
 */
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
/**
 * @param {String} password the password to be hashed with salt
 * @returns {Object} contains the hashed password and the salt used
 */
function generatePassword(password) {
    var salt = makeSalt();
    return {
        password: encryptPassword(salt, password),
        salt: salt
    };
}
/**
 * @param {String} password this is the value a user types
 * @param {String} salt this is the encryption used, must be stored
 * @param {String} hashed_password this is the stored encrypted password
 * @returns {Boolean} whether the password is valid
 */
function authenticate(password, salt, hashed_password) {
    return encryptPassword(salt, password) === hashed_password;
}
/**
 * @returns {String} a random String for encryption
 */
function makeSalt() {
    return Math.round((new Date().valueOf() * Math.random())) + '';
}
/**
 * @param {String} salt the encryption for the passpwrd
 * @param {String} password the password to encrypt
 * @returns a hashed password
 */
function encryptPassword(salt, password) {
    return crypto.createHmac('sha1', salt + "secret string").update(password + "super secret").digest('hex');
}
