var chatdb = require('./chatdb'),
    assert = require("assert")
    credentials = {
        mashumafi: {
            username: "mashumafi",
            password: "Pa55word!",
            session: "mashumafi"
        },
        nagolyhprum: {
            username: "nagolyhprum",
            password: "Pa55word!",
            session: "nagolyhprum"
        },
        schwowsers: {
            username: "schwowsers",
            password: "A#3edcde",
            session: "schwowsers"
        }
    };
describe("Chat Db", function () {
    describe("Clear database", function () {
        it("should clear the database", function (done) {
            chatdb.seed(done);
        });
    });
    describe("Register new account", function () {
        it("should create an account", function (done) {
            var credentials = {
                username: "mashumafi",
                password: "Pa55word!",
                email: "mashumafi@gmail.com",
                session: "mashumafi"
            };
            chatdb.register(credentials, function (err, result) {
                delete credentials.password;
                assert.deepEqual(result, credentials, "Failed to create an account");
                done(err, result);
            });
        });
    });
    describe("Register same account", function () {
        it("should not create an account again or change anything when same username used", function (done) {
            var credentials = {
                username: "mashumafi",
                password: "test",
                email: "nagolyhprum@gmail.com",
                session: "mashumafi"
            };
            chatdb.register(credentials, function (err, result) {
                assert.equal(err.code, 11000, "Wrong error code");
                done();
            });
        });
        it("should not create an account again or change anything when same email used", function (done) {
            var credentials = {
                username: "nagolyhprum",
                password: "test",
                email: "mashumafi@gmail.com",
                session: "nagolyhprum"
            };
            chatdb.register(credentials, function (err, result) {
                assert.equal(err.code, 11000, "Wrong error code");
                done();
            });
        });
    });
    describe("Login", function () {
        it("should return details of who logged in", function (done) {
            var credentials = {
                username: "mashumafi",
                password: "Pa55word!",
                session: "test"
            };
            chatdb.login(credentials, function (err, result) {
                assert.equal(result.email, "mashumafi@gmail.com", "Login failed");
                chatdb.logout({
                    session: credentials.session
                }, function (err, result) {
                    done();
                });
            });
        });
    });
    describe("Friends", function () {
        it("should add a friend", function (done) {
            var credentials = {
                username: "mashumafi",
                password: "Pa55word!",
                session: "mashumafi"
            };
            chatdb.login(credentials, function (err, result) {
                chatdb.addFriend({
                    session: result.session,
                    username: "nagolyhprum"
                }, function (err, result) {
                    chatdb.logout({
                        session: credentials.session
                    }, function (err, result) {
                        done();
                    });
                });
            });
        });
        it("should add a friend", function (done) {
            var credentials = {
                username: "mashumafi",
                password: "Pa55word!",
                session: "mashumafi"
            };
            chatdb.login(credentials, function (err, result) {
                chatdb.addFriend({
                    session: result.session,
                    username: "schwowsers"
                }, function (err, result) {
                    chatdb.logout({
                        session: credentials.session
                    }, function (err, result) {
                        done();
                    });
                });
            });
        });
        it("should add a friend", function (done) {
            var credentials = {
                username: "nagolyhprum",
                password: "Pa55word!",
                session: "nagolyhprum"
            };
            chatdb.login(credentials, function (err, result) {
                chatdb.addFriend({
                    session: result.session,
                    username: "mashumafi"
                }, function (err, result) {
                    chatdb.logout({
                        session: credentials.session
                    }, function (err, result) {
                        done();
                    });
                });
            });
        });
        it("should block an enemy", function (done) {
            var credentials = {
                username: "mashumafi",
                password: "Pa55word!",
                session: "mashumafi"
            };
            chatdb.login(credentials, function (err, result) {
                chatdb.blockUser({
                    session: result.session,
                    username: "schwowsers"
                }, function (err, result) {
                    chatdb.logout({
                        session: credentials.session
                    }, function (err, result) {
                        done();
                    });
                });
            });
        });
        it("should list friends", function (done) {
            var credentials = {
                username: "mashumafi",
                password: "Pa55word!",
                session: "mashumafi"
            };
            chatdb.login(credentials, function (err, result) {
                chatdb.listFriends({
                    session: result.session
                }, function (err, result) {
                    chatdb.logout({
                        session: credentials.session
                    }, function (err, result) {
                        done();
                    });
                });
            });
        });
        it("should check if nagolyhprum is mashumafi's friend", function (done) {
            var credentials = {
                username: "nagolyhprum",
                password: "Pa55word!",
                session: "nagolyhprum"
            };
            chatdb.login(credentials, function (err, result) {
                chatdb.isFriend({
                    session: result.session,
                    username: 'mashumafi',
                }, function (err, result) {
                    assert.ok(result, 'nagolyhprum is not mashumafi\'s friend');
                    chatdb.logout({
                        session: credentials.session
                    }, function (err, result) {
                        done();
                    });
                });
            });
        });
        it("should remove a friend", function (done) {
            var credentials = {
                username: "mashumafi",
                password: "Pa55word!",
                session: "mashumafi"
            };
            chatdb.login(credentials, function (err, result) {
                chatdb.removeFriend({
                    session: result.session,
                    username: "nagolyhprum"
                }, function (err, result) {
                    chatdb.logout({
                        session: credentials.session
                    }, function (err, result) {
                        done();
                    });
                });
            });
        });
        it("should remove a friend", function (done) {
            var credentials = {
                username: "mashumafi",
                password: "Pa55word!",
                session: "mashumafi"
            };
            chatdb.login(credentials, function (err, result) {
                chatdb.removeFriend({
                    session: result.session,
                    username: "asdfjkl"
                }, function (err, result) {
                    chatdb.logout({
                        session: credentials.session
                    }, function (err, result) {
                        done();
                    });
                });
            });
        });
        it("should list friends", function (done) {
            var credentials = {
                username: "mashumafi",
                password: "Pa55word!",
                session: "mashumafi"
            };
            chatdb.login(credentials, function (err, result) {
                chatdb.listFriends({
                    session: result.session
                }, function (err, result) {
                    chatdb.logout({
                        session: credentials.session
                    }, function (err, result) {
                        done();
                    });
                });
            });
        });
        it("should list friends", function (done) {
            var credentials = {
                username: "nagolyhprum",
                password: "Pa55word!",
                session: "nagolyhprum"
            };
            chatdb.login(credentials, function (err, result) {
                chatdb.listFriends({
                    session: result.session
                }, function (err, result) {
                    chatdb.logout({
                        session: credentials.session
                    }, function (err, result) {
                        done();
                    });
                });
            });
        });
        it("checks if enemy is blocked", function (done) {
            var credentials = {
                username: "mashumafi",
                password: "Pa55word!",
                session: "mashumafi"
            };
            chatdb.login(credentials, function (err, result) {
                chatdb.isBlockedUser({
                    session: result.session,
                    username: "schwowsers"
                }, function (err, result) {
                    chatdb.logout({
                        session: credentials.session
                    }, function (err, result) {
                        done();
                    });
                });
            });
        });
        it("logout", function (done) {
            var credentials = {
                username: "mashumafi",
                password: "Pa55word!",
                session: "mashumafi"
            };
            chatdb.login(credentials, function (err, result) {
                chatdb.logout({
                    session: credentials.session
                }, function (err, result) {
                    done();
                });
            });
        });
    });
});