var $loginDialog,
    $registerDialog,
    $userLists,
    user_name;
    
$(document).ready(function () {
    $("#room-join").button().click(function(event) {
        event.preventDefault();
        var rm = $("#roomName").attr("value"); 
        $("#roomName").attr("value", "");
        if(rm.length > 0 && $("#" + rm).length === 0) {
            $(this).button("disable");
            joinRoom(rm, function(rm) {
                console.log("**Attempting to join " + rm);
                createDialog({room: rm}, send);
                $("#room-join").button("enable");
            });
        }
    });
    $("#message-user").button().click(function(event) {
        event.preventDefault();
        var name = $("#userName").attr("value"); 
        $("#userName").attr("value", "");
        if(name.length > 0 ) {//&& $("#" + name).length === 0) { //check if dialog between users exists
            $(this).button("disable");
            createDialog({
                room: "pr_" + user_name + new Date().getTime() + gChatCount++,
                username: name
                }, send);
            $(this).button("enable");
        }
    });
    $("#logOff").button().click(function() {
        $(this).button("disable");
        logout(function() {
            $("#logOff").button("enable");
            $(".chat").dialog("destroy").remove();
            document.title = "chat.io";
            toggleSideBar();
            
            //Clear user lists
            $("#friends-online").empty();
            $("#friends-offline").empty();
            $("#friends-pending").empty();
            $("#blocked-users").empty();
            $("#friend-requests").empty();
            
            $("#friendsTabLink").click();
            
            $loginDialog.dialog("open");
            $("#autoLogin").show();
            //location.reload();
        });
    });
    $("#friend-add").click(function(event) {
        event.preventDefault();
        var $inputBox = $("#friend-name"),
            name = $inputBox.val();
        if(name != null && name.length > 0) {
            $inputBox.val("");
            addNewFriend(name);
        }
    });
    $("#blocked-add").click(function(event) {
        event.preventDefault();
        var $inputBox = $("#blocked-name"),
            name = $inputBox.val();
        if(name != null && name.length > 0) {
            $inputBox.val("");
            addNewBlockedUser(name);
        }
    });
    
    $("#friendRequests").css("height", $("#friendsList").css("height"));
    
    $userLists = $("#userLists").tabs();
    
    $("#sideBar").css("margin-left", -$("#sideBar").outerWidth());
    
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
                    $("#login-login").button("disable");
                    var credentials = {
                        username: $("input[name=usernameL]").val(),
                        password: $("input[name=passwordL]").val()
                    };
                    login(credentials, function (err, result) {
                        $("#login-login").button("enable");
                        $(".error").text("");
                        if (err) {
                                $("#loginError").text("Invalid username/password combination");
                        }
                        else {
                            $loginDialog.dialog("close");
                            $loginDialog[0].reset();
                            $("#loginError").html("&nbsp;");
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
                    $("#loginError").html("&nbsp;");
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
                    $("#register-submit").button("disable");
                    var credentials = {
                        username: $("input[name=usernameR]").val(),
                        password: $("input[name=passwordR]").val(),
                        passwordCfm: $("input[name=passwordCfmR]").val(),
                        email: $("input[name=emailR]").val(),
                        emailCfm: $("input[name=emailCfmR]").val()
                    };
                    register(credentials, function (err, result) {
                        $("#register-submit").button("enable");
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
    
    /*************** Auto Login ****************/
    //Remember to remove #autoLogin hide and show from 
    //login-register, register-close, onLogin(), and logoff()
    $("#autoLogin").position({my: "left center", at: "right center", of: $loginDialog});
    $("#mashumafi").button().click(function(){
        $("input[name=usernameL]").val("mashumafi");
        $("input[name=passwordL]").val("Pa55word!");
        $("#login-login").click();
    });
    $("#nagolyhprum").button().click(function(){
        $("input[name=usernameL]").val("nagolyhprum");
        $("input[name=passwordL]").val("Pa55word!");
        $("#login-login").click();
    });
    $("#schwowsers").button().click(function(){
        $("input[name=usernameL]").val("schwowsers");
        $("input[name=passwordL]").val("A#3edcde");
        $("#login-login").click();
    });
    /*************** Auto Login ****************/
});

//Prepares client for fresh log in
function onLogin(userData) {
    // validate that login succeeded
    if (userData.email) {
        $("#autoLogin").hide();
        user_name = userData.username;
        document.title = "chat.io - " + user_name;
        //$("#friendRequests").css("height", $("#friendsList").css("height"));
        populateFriendsList(userData.friends.friends, TIME_BEFORE_IDLE);
        populateBlockedList(userData.friends.blocked);
        populateFriendRequests(userData.friends.requests);
        toggleSideBar();
    }
}

function toggleSideBar() {
    var $sideBar = $("#sideBar");
    $sideBar.animate({
        marginLeft: parseInt($sideBar.css("margin-left"), 10) == 0 ?
            -$sideBar.outerWidth() : 0
    });
  }