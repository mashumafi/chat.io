var $loginDialog;
var $registerDialog;
var $menuBar;
var user;

$(document).ready(function () {
    $menuBar = $("#menuBar").hide();
    
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
    //Submit form if user presses enter.
    $registerDialog.keypress(function(event) {
        if(event.which == 13) {
            $("#register-submit").click();
        }
    });
    
    $("#room-join").button().click(function() {
        var rm = $("#roomName").attr("value"); 
        $("#roomName").attr("value", "");
        if(rm.length > 0)
            joinRoom(rm, function(data) {
                createDialog({room: data}, send);
            });
    });
    $("#logOff").button().click(function() {
        $(".room").dialog("destroy").remove();
        //$menuBar = $("#menuBar").hide();
        //disconnect(); 
        //$loginDialog.dialog("open");
    });
    
    /*************** Auto Login ****************/
    //Remember to remove #autoLogin hide and show from 
    //login-register & register-close
    $("#autoLogin").position({my: "left center", at: "right center", of: $loginDialog});
    $("#mashumafi").button().click(function(){
        $("input[name=usernameL]").val("mashumafi");
        $("input[name=passwordL]").val("Pa55word!");
        $("#login-login").click();
        $("#autoLogin").remove();
    });
    $("#nagolyhprum").button().click(function(){
        $("input[name=usernameL]").val("nagolyhprum");
        $("input[name=passwordL]").val("Pa55word!");
        $("#login-login").click();
        $("#autoLogin").remove();
    });
    $("#schwowsers").button().click(function(){
        $("input[name=usernameL]").val("schwowsers");
        $("input[name=passwordL]").val("A#3edcde");
        $("#login-login").click();
        $("#autoLogin").remove();
    });
    /*************** Auto Login ****************/
    
    //createDialog({ room : "room", message : "" }, send); //For testing only.
});

//Prepares client for fresh log in
function onLogin(credentials) {
    // validate that login succeeded
    if (credentials.email) {
        user = credentials.username;
        //show menubar
        $menuBar.fadeIn();   //css("visibility", "visible");
        // open chat dialog
        //createDialog({room: ""}, send);     //Global room is ""
    }
}
function receive(data) {
    var $output = $("#" + data.room + "output");
    var spanClass;
    //var shouldAutoScroll;
    
    //Set color of username according to whether sender or receiver.
    if (data.username !== user) {
        spanClass = "<span class='receiver'>";
    } else {
        spanClass = "<span class='sender'>";
    }
    //shouldAutoScroll = $output.prop("scrollTop") == $output.prop("scrollHeight");
    
    //Post message in user's window.
    $output.html($output.html() + spanClass + data.username 
            + ":&nbsp&nbsp</span>" + data.msg + "<br/>");
    
    //if(shouldAutoScroll)
    $output.prop("scrollTop", $output.prop("scrollHeight"));    
}

//Creates a new chat window where users can send and receive messages.
function createDialog(details, callback) {
    
    //Create a new dialog that contains an output area and an input area
    $(document.createElement("div")).attr("id", details.room).css("overflow","hidden")
        .addClass("room")
    .append($(document.createElement("div")).attr("id", details.room + "output")
        .addClass("room-output"))
    .append($(document.createElement("div")).attr({id:details.room + "input", contenteditable:"true"})
        .addClass("room-input"))
    .dialog({
        title: details.room,
        width: 350,
        height: 400,
        close: function(event, ui) {
            //Remove chat dialog and contents from DOM and leave room
            leaveRoom($(this).attr("id"));
            $(this).dialog("destroy").remove();
        },
        buttons: [
            {
                id: details.room + "-chat-send",
                text: "Send",
                click: function () {
                    //Get room name and message.
                    var roomName = $(this).attr("id");
                        //roomName = roomName.substring(3, roomName.length);
                    var $input = $("#" + roomName + "input");
                    var message = {
                        room: roomName,
                        username: user,
                        msg: $input.html()
                    };
                    $input.html("");
                    $input[0].focus();
                    if(message.msg.length > 0) {
                        callback(message, function (err) {
                            if (err) {
                                // handle error
                            }
                        });
                    }
                }
            }
        ]
    });
    //Send message if enter is pressed while chat input area has focus.
    //If shift is held while pressing enter, it acts as a newline.
    $("#" + details.room + "input").keypress( function(event) {
        if(event.which == 13 && !event.shiftKey) {
            event.preventDefault();
            $("#" + $(this).parent().attr("id") + "-chat-send").click();
        }
    });
}