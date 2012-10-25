var chatdb = require('./chatdb'),
    mocha = require("mocha"),
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
                password: "password",
                email: "mashumafi@gmail.com"
            };
            chatdb.register(credentials, function (result) {
                delete credentials.password;
                assert.deepEqual(result, credentials, "Failed to create an account");
                done();
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
            chatdb.register(credentials, function (result) {
                assert.equal(result.code, 11000, "Wrong error code");
                done();
            });
        });
        it("should not create an account again or change anything when same email used", function (done) {
            var credentials = {
                username: "nagolyhprum",
                password: "test",
                email: "mashumafi@gmail.com"
            };
            chatdb.register(credentials, function (result) {
                assert.equal(result.code, 11000, "Wrong error code");
                done();
            });
        });
    });
    describe("Login", function () {
        it("should return details of who logged in", function (done) {
            var credentials = {
                username: "mashumafi",
                password: "password"
            };
            chatdb.login(credentials, function (result) {
                assert.equal(result.email, "mashumafi@gmail.com", "Login failed");
                done();
            });
        });
    });
});