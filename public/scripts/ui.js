var $loginDialog,
    $registerDialog,
    $menuBar,
    $userLists,
    user_name;

$(document).ready(function () {
    $menuBar = $("#menuBar").hide();
    $userLists = $("#userLists").tabs().hide();
    
    $loginDialog = $("#login").dialog({
        resizable: false,
        draggable: false,
        title: "Log In",
        dialogClass: "no-close-x",
        buttons: [
            {
                id: "login-login",
                text: "Log In",
                click: function () {
                    var credentials = {
                        username: $("input[name=usernameL]").val(),
                        password: $("input[name=passwordL]").val()
                    };
                    login(credentials, function (err, result) {
                        $(".error").text("");
                        if (err) {
                            for (var e in err) {
                                $("#" + e + "L").text(err[e]);
                            }
                        } else {
                            $loginDialog.dialog("close");
                            $loginDialog[0].reset();
                            onLogin(result);
                        }
                    });
                }
            },{
                id: "login-register",
                text: "Register",
                click: function () {
                    $loginDialog.dialog("close");
                    $loginDialog[0].reset();
                    $registerDialog.dialog("open");
                    $("#autoLogin").hide();
                }
            }
        ]
    });
    $loginDialog.keypress(function(event) {
        if(event.which == 13) {
            $("#login-login").click();
        }
    });

    $registerDialog = $("#register").dialog({
        resizable: false,
        draggable: false,
        autoOpen: false,
        title: "Register",
        dialogClass: "no-close-x",
        buttons: [
            {
                id: "register-submit",
                text: "Submit",
                click: function () {
                    var credentials = {
                        username: $("input[name=usernameR]").val(),
                        password: $("input[name=passwordR]").val(),
                        passwordCfm: $("input[name=passwordCfmR]").val(),
                        email: $("input[name=emailR]").val(),
                        emailCfm: $("input[name=emailCfmR]").val()
                    };
                    register(credentials, function (err, result) {
                        $(".error").text("");
                        if (err) {
                            for (var e in err) {
                                $("#" + e + "R").text(err[e]);
                            }
                        } else {
                            $registerDialog.dialog("close");
                            onLogin(result);
                        }
                    });
                }
            },{
                id: "register-close",
                text: "Close",
                click: function () {
                    $registerDialog.dialog("close");
                    $registerDialog[0].reset();
                    $loginDialog.dialog("open");
                    $("#autoLogin").show();
                }
            }
        ]
    });
    //Submit registration form if user presses enter.
    $registerDialog.keypress(function(event) {
        if(event.which == 13) {
            $("#register-submit").click();
        }
    });
    
    $("#room-join").button().click(function() {
        var rm = $("#roomName").attr("value"); 
        $("#roomName").attr("value", "");
        if(rm.length > 0)
            joinRoom(rm, function(rm) {
                createDialog({room: rm}, send);
                /*send({
                    room: rm,
                    username: null,
                    msg: "*** " + user + " has joined ***"
                }, function(err) {});  */
            });
    });
    $("#logOff").button().click(function() {
        logout(function() {
            /*$(".room").dialog("destroy").remove();
            $menuBar.hide();
            $userLists.hide();
            $(".userListEntry").remove();
            $loginDialog.dialog("open");
            $("#autoLogin").show(); */
            location.reload();
        });
    });
    $("#friend-add").click(function() {
        var $inputBox = $("#friend-name"),
            name = $inputBox.val();
        if(name != null && name.length > 0) {
            $inputBox.val("");
            addNewFriend(name);
        }
    });
    $("#blocked-add").click(function() {
        var $inputBox = $("#blocked-name"),
            name = $inputBox.val();
        if(name != null && name.length > 0) {
            $inputBox.val("");
            addNewBlockedUser(name);
        }
    });
    
    /*************** Auto Login ****************/
    //Remember to remove #autoLogin hide and show from 
    //login-register & register-close, and from logoff()
    $("#autoLogin").position({my: "left center", at: "right center", of: $loginDialog});
    $("#mashumafi").button().click(function(){
        $("input[name=usernameL]").val("mashumafi");
        $("input[name=passwordL]").val("Pa55word!");
        $("#login-login").click();
        $("#autoLogin").hide();
    });
    $("#nagolyhprum").button().click(function(){
        $("input[name=usernameL]").val("nagolyhprum");
        $("input[name=passwordL]").val("Pa55word!");
        $("#login-login").click();
        $("#autoLogin").hide();
    });
    $("#schwowsers").button().click(function(){
        $("input[name=usernameL]").val("schwowsers");
        $("input[name=passwordL]").val("A#3edcde");
        $("#login-login").click();
        $("#autoLogin").hide();
    });
    /*************** Auto Login ****************/
});

//Prepares client for fresh log in
function onLogin(userData) {
    // validate that login succeeded
    if (userData.email) {
        user_name = userData.username;
        document.title = "chat.io - " + user_name;
        populateFriendsList(userData.friends.friends);
        populateBlockedList(userData.friends.blocked);
        populateFriendRequests(userData.friends.requests);
        $menuBar.fadeIn();
        $userLists.fadeIn();
    }
}