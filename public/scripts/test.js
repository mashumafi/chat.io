test("hello test", function () {
    ok(1 == "1", "Passed!");
});
asyncTest("asynchronous test: one second later!", function () {
    // how many times start is called
    // can have multiple tests in one
    expect(1);
    setTimeout(function () {
        ok(true, "Passed and ready to resume!");
        start();
    }, 1000);
});
// how many times start is called
// can have multiple tests in one
asyncTest("asynchronous test: one second later!", function () {
    setTimeout(function () {
        ok(true, "Passed and ready to resume!");
        start();
    }, 1000);
});
asyncTest("Automate Login and Signup", function () {
    expect(1);
    login({
        username: "nagolyhprum",
        password: "Pa55word!"
    }, function (data) {
        ok(data.username == "nagolyhprum", "Passed!");
        register(data, function (data) {
            ok(data.err.username == "Cannot be blank.", "Passed!");
            start();
        });
    });
});
asyncTest("Send", function () {
    expect(1);
    send({
        msg: "Hello World"
    }, function (data) {
        ok(data == {}, "Passed");
        start();
    });
});