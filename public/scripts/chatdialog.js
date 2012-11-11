function receive(data) {
    console.log("received message for: " + data.username);
    
    if($("#" + data.room).length == 0)
        createDialog({room: data.room}, send);
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
    //Create a new dialog that contains an output area and an input area
    $(document.createElement("div")).attr("id", details.room).addClass("room")
    .append($(document.createElement("div")).attr("id", details.room + "output")
        .addClass("room-output"))
    .append($(document.createElement("div")).attr({id: details.room + "input", contenteditable:"true"})
        .addClass("room-input")/*.tinymce({
			theme : "advanced",
			plugins: "emotions",

			// Theme options
			theme_advanced_buttons1 : "bold,italic,underline,strikethrough,|,forecolor,backcolor,|,emotions",
			theme_advanced_toolbar_location : "bottom",
			theme_advanced_toolbar_align : "left",
			theme_advanced_statusbar_location : "none",
			theme_advanced_resizing : false
		})*/)
    .dialog({
        title: details.username || details.room,
        width: "20em",
        resizable: false,
        close: function(event, ui) {
            //Remove chat dialog and contents from DOM and leave room
            var rm = $(this).attr("id");
            leaveRoom(rm);
            $(this).dialog("destroy").remove();
        },
        buttons: [
            {
                id: details.room + "-chat-send",
                text: "Send",
                click: function () {
                    //Get room name and message.
                    var roomName = $(this).attr("id");
                    var $input = $("#" + roomName + "input");
                    console.log("send to: " + details.username);
                    var message = {
                        room: roomName,
                        username: details.username,
                        msg: $input.html()
                    };
                    $input.html("");
                    //$input[0].focus();
                    if(message.msg.length > 0) {
                        callback(message, function (err) {
                            if (err) {
                                //Handle error.
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