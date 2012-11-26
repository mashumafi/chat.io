function userJoinsLeaves(username, joins_or_leaves, room) {
    if(joins_or_leaves === "join") {
        insertUser(getNewListEntry({username:username}, "message, befriend, blockuser"),
            room + "users");
    }
    else if(joins_or_leaves === "leave") {
        $("#" + room + "users").children("#u_" + username).remove();
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
                        if($("#" + room).length == 0)
                            createDialog({room: room}, send);
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
    //Check that dialog for room message belongs to exists.  If not, make it. 
    if($("#" + data.room).length == 0) {
        if( data.from === user_name) //Receipient is author of message
            createDialog({room: data.room}, send);
        else if($("#u_" + data.from).length != 0)   //Recipient is friend of author
            createDialog({room: data.room, username: data.from}, send);
        else {  //Recipient is not a friend of the author
            showInvite(data.from, data.room);
            return;
        }
    }
    var $output = $("#" + data.room + "output"),
        formattedName;
        //shouldAutoScroll;
    
    //Set color of username according to whether sender or receiver.
    if (data.from !== user_name) 
        formattedName = "<span class='receiver'>" + data.from + "&nbsp&nbsp</span>";
    else if (data.from != null)
        formattedName = "<span class='sender'>" + data.from + ":&nbsp&nbsp</span>";
    else
        formattedName = "";
    //shouldAutoScroll = $output.prop("scrollTop") == $output.prop("scrollHeight");
    
    //Post message in user's window.
    $output.html($output.html() + formattedName + data.msg + "<br/>");
    
    //if(shouldAutoScroll)
    $output.prop("scrollTop", $output.prop("scrollHeight"));    
}

//Creates a new chat window.
function createDialog(details, callback) {
    var $content = $(document.createElement("div")).attr("id", details.room).addClass("room");
    
    //Add left drawing panel
	$(document.createElement("div")).attr("id", details.room + "left").appendTo($content)
		.append($(document.createElement("div")).attr("id", details.room + "canvas")
		    .addClass("room-canvas"))
        .addClass("room-panel room-left").hide();
	
	//Add middle chat panel
	$(document.createElement("div")).attr("id", details.room + "middle").appendTo($content)
    .append($(document.createElement("div")).attr("id", details.room + "output")
        .addClass("room-output"))
    .append($(document.createElement("div")).attr({id: details.room + "input", contenteditable:"true"})
        .addClass("room-input"))
    .append($(document.createElement("button")).css("margin-left", "10px")
    	.button({label: "&#9668;"}).click(function() {
                var $panel = $("#" + details.room + "left");
                if($panel.css("display") === "none")
				    $panel.show();
                else
                    $panel.hide();
			})
	    )
	.append($(document.createElement("button")).attr("id", details.room + "-chat-send")
		.button({label: "Send"}).click(function() {
				sendClick(details.room, callback, details.username);
			})
	    )
    .append($(document.createElement("button")).css("margin-right", "10px")
    	.button({label: "&#9658;"}).click(function() {
				var $panel = $("#" + details.room + "right");
                if($panel.css("display") === "none")
    			    $panel.show();
                else
                    $panel.hide();
			})
        )
        .addClass("room-panel room-middle");
	
	//Add right user list panel
	$(document.createElement("div")).attr("id", details.room + "right").appendTo($content)
	.append($(document.createElement("div")).addClass("userListContainer")
        .append($(document.createElement("div")).addClass("userListLabel room-listHeight")
            .html("<del>&nbsp;&nbsp;&nbsp;&nbsp;</del>Participants<del>&nbsp;&nbsp;&nbsp;&nbsp;</del>"))
        .append($(document.createElement("div")).attr("id", details.room + "users")))
    .append("<br/><form><input type='text' style='width:5em;'/><button id='" 
            + details.room + "-invite' style='width:4em;'>Invite</button></form>")
        .addClass("room-panel room-right");
        
    $content.append($(document.createElement("div")).addClass("clear"));
    
    getUsersInRoom(details.room, function(users) {
        populateUserList(users, details.room + "users");
    });        
		
	//Wrap content in JQuery UI Dialog
    $content.dialog({
        title: details.username || details.room,
        width: "auto",
        resizable: false,
        close: function(event, ui) {
            //Remove chat dialog and contents from DOM and leave room
            var rm = $(this).attr("id");
            leaveRoom(rm);
            $(this).dialog("destroy").remove();
        }
    });
	//Restrict draggable area
    $content.dialog("widget").draggable("option", "containment", "#mainArea");
    
    //Add canvas to left drawing panel
    getCanvas({
        width: 32, 
        height: 32, 
        room: details.room    
    	}, function(cvs) {
			cvs.css({width: "100%", height: "100%"});
			$("#" + details.room + "canvas").append(cvs);    
		});
	
    //Send message if enter is pressed while chat input area has focus.
    //If shift is held while pressing enter, it acts as a newline.
    $("#" + details.room + "input").keypress( function(event) {
        if(event.which == 13 && !event.shiftKey) {
            event.preventDefault();
            $("#" + details.room + "-chat-send").click();
        }
    });
}

function sendClick(room, callback, recipient) {
	//Get room name and message.
	var $input = $("#" + room + "input");
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
    console.log("BLAHHHHHHHHH - " + names[0]);
    
    if(names && names.length > 0) {
        names.sort(function(a, b) {return a.toLowerCase()
            .localeCompare(b.toLowerCase());});
        var $list = $("#" + listID);
        for(var i in names) {
            $list.append(getNewListEntry({username:names[i]}, "message, befriend, blockuser"));
        }
    }
}