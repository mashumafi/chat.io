var chatdb = require('./chatdb'),
    assert = require("assert");
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
                email: "mashumafi@gmail.com"
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
                email: "nagolyhprum@gmail.com"
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
                email: "mashumafi@gmail.com"
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
                password: "Pa55word!"
            };
            chatdb.login(credentials, function (err, result) {
                assert.equal(result.email, "mashumafi@gmail.com", "Login failed");
                done();
            });
        });
    });
    describe("Friends", function () {
        it("should add a friend", function (done) {
            var credentials = {
                username: "mashumafi",
                password: "Pa55word!"
            };
            chatdb.login(credentials, function (err, result) {
                chatdb.addFriend({
                    session: result.session,
                    friend: "nagolyhprum"
                }, function (err, result) {
                    console.log(result);
                    done();
                });
            });
        });
        it("should add a friend", function (done) {
            var credentials = {
                username: "mashumafi",
                password: "Pa55word!"
            };
            chatdb.login(credentials, function (err, result) {
                chatdb.addFriend({
                    session: result.session,
                    friend: "schwowsers"
                }, function (err, result) {
                    console.log(result);
                    done();
                });
            });
        });
        it("should list friends", function (done) {
            var credentials = {
                username: "mashumafi",
                password: "Pa55word!"
            };
            chatdb.login(credentials, function (err, result) {
                chatdb.listFriends({
                    session: result.session
                }, function (err, result) {
                    console.log(result);
                    done();
                });
            });
        });
        it("should block an enemy", function (done) {
            var credentials = {
                username: "mashumafi",
                password: "Pa55word!"
            };
            chatdb.login(credentials, function (err, result) {
                chatdb.blockUser({
                    session: result.session,
                    enemy: "schwowsers"
                }, function (err, result) {
                    console.log(result);
                    done();
                });
            });
        });
    });
});