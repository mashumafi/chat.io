/**
 * Updates chat window user list when a user joins or leaves, and changes 
 * window title if needed.
 * @param {String} Username of user who joined or left the chat.
 * @param {String} Action taken by user.  Must be either "join" or "leave."
 * @param {String} Name of room affected.
 **/
function userJoinsLeaves(username, join_or_leave, room) {
    var $room = $("#" + room);
    if($room.length !== 0) {
        var title = $room.prev().children(".ui-dialog-title").html(),
            numUsers;
        
        if(join_or_leave === "join"
         && $("#" + room + "_users").children("#u_" + username).length === 0) {
            //Add new user to the dialog's user list
            insertUser(getNewListEntry({username:username}, "message, befriend, blockuser"),
                room + "_users"); 
            numUsers = $("#" + room + "_users").children().length;
            
            //User joined a private chat & was not one of original 2 participants
            if(room.substring(0,3) === "pr_" && title !== username 
             && username !== user_name) {
                //Chat was a direct chat between two users, not yet a group chat
                if(title.substring(0,10) !== "Group Chat") {
                    //Stop sending messages to a specific user.
                    $("#" + room + "_send").unbind("click").click(function() {
                        sendClick(room, send);});
                }
                //Change title to reflect group chat status.
                $room.dialog("option", "title", "Group Chat(" + numUsers + ")");
            }
            //User joined a public room
            else if(room.substring(0,3) !== "pr_")
                //Update dialog title's user count.
                $room.dialog("option", "title", room + "(" + numUsers + ")");
        }
        else if(join_or_leave === "leave") {
            $("#" + room + "_users").children("#u_" + username).remove();
            
            //Update dialog title's user count.
            numUsers = $("#" + room + "_users").children().length;
            if(title.substring(0,10) === "Group Chat") {
                $room.dialog("option", "title", "Group Chat(" + numUsers + ")");
            }
            else if(title !== username) {
                $room.dialog("option", "title", room + "(" + numUsers + ")");
            }
        }
    }
}

function showInvite(username, room) {
    //leaveRoom(room);  //add join() in accept function if using this   
    
    $(document.createElement("div")).html("<p>" + username + " has invited you to chat!</p>")
        .dialog({
            title: "Chat Invite",
            resizable: false,
            dialogClass: "no-close-x",
            buttons: [
                {
                    text: "Accept",
                    click: function() {
                        if($("#" + room).length == 0) {
                            var dialogTitle;
                            if(room.substring(0,3) === "pr_")
                                dialogTitle = "Group Chat";
                            else
                                dialogTitle = room;
                            createDialog({room: room, title: dialogTitle}, send);
                        }
                        $(this).dialog("destroy").remove();
                    }
                },
                {
                    text: "Deny",
                    click: function() {
                        leaveRoom(room);
                        $(this).dialog("destroy").remove();
                    }
                }
            ]
        });
}

function receive(data) {
    //If sender is blocked by recipient, ignore message.
    if(isBlocked(data.from) >= 0) {
        leaveRoom(data.room);
        return;
    }
    
    //No dialog exists for the room to which the message belongs.
    if($("#" + data.room).length == 0) {
        if( data.from === user_name) //Recipient is author of message
            createDialog({room: data.room}, send);
        else if(!data.isGroup)   //One on one chat
            createDialog({room: data.room, username: data.from}, send);
        else {  //User has been invited to a group chat room
            showInvite(data.from, data.room);
            return;
        }
    }
    var $output = $("#" + data.room + "_output"), formattedName;
    if(data.msg) {        
        //Set color of username according to whether sender or receiver.
        if (data.from !== user_name) 
            formattedName = "<span class='receiver'>" + data.from + ":&nbsp&nbsp</span>";
        else if (data.from != null)
            formattedName = "<span class='sender'>" + data.from + ":&nbsp&nbsp</span>";
        else
            formattedName = "";
        //shouldAutoScroll = $output.prop("scrollTop") == $output.prop("scrollHeight");
        
        //Post message in user's window.
        $output.html($output.html() + "<p>" + formattedName + data.msg.substring(3));
    }
    //if(shouldAutoScroll)
    $output.prop("scrollTop", $output.prop("scrollHeight"));    
}

//Creates a new chat window.
function createDialog(info, callback) {
    var $content,
        $parent,
		chat,
		canvas,
		userList;
    
    //HTML for middle chat panel
	chat = "<div id='" + info.room + "_middle' class='chat-middle'>\
                <div id='" + info.room + "_output' class='chat-output'></div>\
                <textarea id='" + info.room + "_input' class='chat-input'></textarea>\
                <div style='position:relative;margin-top:10px;'>\
                    <button type='button' id='" + info.room 
                        + "_send' style='display:block;margin:auto;'>Send</button>\
                    <button type='button' id='" + info.room 
                        + "_toggle_left' style='position:absolute;left:10px;top:0;'>&lt;</button>\
                    <button type='button' id='" + info.room 
                        + "_toggle_right' style='position:absolute;right:10px;top:0;'>&gt;</button>\
                </div>\
            </div>";
	
	$content = $("<div id='" + info.room + "' class='chat'>" + chat + "</div>");
		
	//Wrap content in JQuery UI Dialog
    $content.dialog({
		autoOpen: false,
        resizable: false,
        close: function(event, ui) {
            //Remove chat dialog and contents from DOM and leave room
            var rm = $(this).attr("id");
            leaveRoom(rm);
            $(this).dialog("destroy").remove();
        }
    });
	//Restrict dialog's draggable area
    $content.dialog("widget").draggable("option", "containment", "#mainArea");
    
    $("#" + info.room + "_input").tinymce({
        width: "100%",
        theme: "advanced",
        handle_event_callback: function(e) {
            if(e.which == 13 && !e.shiftKey) {
                e.preventDefault();
                $("#" + info.room + "_send").click();
            }
        },

		// Theme options
		theme_advanced_buttons1 : "bold,italic,underline,strikethrough,|,forecolor,backcolor",
		theme_advanced_toolbar_location : "bottom",
		theme_advanced_toolbar_align : "left",
		theme_advanced_statusbar_location : "none",
		theme_advanced_resizing : false
	});
    
    //HTML for left canvas panel
	canvas =    "<div id='" + info.room + "_left' class='chat-left ui-widget ui-widget-content ui-corner-left'>\
                    <h5 style='text-align:center;margin:10px;'>Group Canvas</h5>\
                    <div id='" + info.room + "_canvas' class='chat-canvas'></div>\
                </div>";
	
    //HTML for right user list panel
	userList =  "<div id='" + info.room + "_right' class='chat-right ui-widget ui-widget-content ui-corner-right'>\
                    <h5 style='text-align:center;margin:10px;'>Users in Room</h5>\
                    <div class='userListContainer chat-listHeight'>\
                        <div id='" + info.room + "_users'></div>\
                    </div>\
                    <form>\
                        <table>\
                            <tr>\
                                <td>\
                                    <input type='text'/>\
                                </td>\
                                <td>\
                                    <button id='" + info.room + "_invite'>Invite</button>\
                                </td>\
                            </tr>\
                        </table>\
                    </form>\
                </div>";
    
    $parent = $content.parent().append(canvas + userList).css("overflow", "visible");
	
	//Set button to show or hide canvas panel
    $("#" + info.room + "_toggle_left").button()
		.click(function() {
            var $panel = $("#" + info.room + "_left");
            if($panel.css("display") === "none")
                $panel.show();
            else
                $panel.hide();
		});
	//Set up send button
	$("#" + info.room + "_send").button()
		.click(function() {
			sendClick(info.room, callback, info.username);
		});
    //Set button to show or hide chat room user list panel
    $("#" + info.room + "_toggle_right").button()
        .click(function() {
            var $panel = $("#" + info.room + "_right");
            if($panel.css("display") === "none")
                $panel.show();
            else
                $panel.hide();
		});
    $("#" + info.room + "_invite").button()
        .click(function(e) {
            e.preventDefault();
            var recipient = $(this).parent().prev().children().val(),
                currentTitle = $("#" + info.room).prev().children(".ui-dialog-title").html();
                groupStatus = (info.room.substring(0,3) !== "pr_" 
                        || (info.room.substring(0,3) === "pr_" 
                        && currentTitle !== recipient)),
                message = {
                    room: info.room,
                    isGroup: groupStatus,
                    username: recipient,
                    msg: ""
                };
            $(this).parent().prev().children().val("");
            send(message, function(err) {});
        });
		
    getUsersInRoom(info.room, function(users) {
        populateUserList(users, info.room + "_users");
        var dialogTitle;
        if(info.title)
           dialogTitle = info.title + "(" + users.length + ")";
        else
           dialogTitle = info.username ? info.username : info.room + "(" + users.length + ")";
        $("#" + info.room).dialog("option", "title", dialogTitle);
    });
	
    //Add canvas to left drawing panel
    getCanvas({
        width: 32, 
        height: 40, 
        room: info.room    
        }, function(cvs) {
			cvs.css({width: "100%", height: "100%"});
			$("#" + info.room + "_canvas").append(cvs);    
		});
        
    var width = $parent.innerWidth();
    $("#" + info.room + "_left").css({"right":width, "top":"0px", "bottom":"0px"})
        .hide();
    $("#" + info.room + "_right").css({"left":width, "top":"0px", "bottom":"0px"})
        .hide();
	
	$content.dialog("open");
}

function sendClick(room, callback, recipient) {
	//Get room name and message.
	var $input = $("#" + room + "_input");
	var message = {
		room: room,
		username: recipient,
		msg: $input.html()
	};
	$input.html("");
	if(message.msg.length > 0) {
		callback(message, function (err) {
			if (err) {
				//Handle error.
			}
		});
	}
}

function populateUserList(names, listID) {
    if(names && names.length > 0) {
        names.sort(function(a, b) {return a.toLowerCase()
            .localeCompare(b.toLowerCase());});
        var $list = $("#" + listID);
        for(var i in names) {
            $list.append(getNewListEntry({username:names[i]}, "message, befriend, blockuser"));
        }
    }
}