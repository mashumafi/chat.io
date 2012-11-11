function populateFriendsList(friends) {
    var $friendsPending = $("#friends-pending");
    if(friends && friends.length > 0) {
        friends.sort(function(a, b) {return a.username.toLowerCase()
            .localeCompare(b.username.toLowerCase());});
        var $friendsOnline = $("#friends-online"),
            $friendsOffline = $("#friends-offline");
        for(var i in friends) {
            if(friends[i]._id == null)
                getNewListEntry(friends[i], "friend").appendTo($friendsPending);
            else if(friends[i].lastActivity != null)
                getNewListEntry(friends[i], "friend").appendTo($friendsOnline);
            else
                getNewListEntry(friends[i], "friend").appendTo($friendsOffline);
        }
    }
    if($friendsPending.children().length > 0) {
        $("#friends-pending-label").show();
    }
    else
        $("#friends-pending-label").hide();
}

function populateBlockedList(enemies) {
    if(enemies && enemies.length > 0) {
        enemies.sort(function(a, b) {return a.username.toLowerCase()
            .localeCompare(b.username.toLowerCase());});
        var $blockedUsers = $("#blocked-users");
        for(var i in enemies) {
            $blockedUsers.append(getNewListEntry(enemies[i], "blocked"));
        }
    }
}

function populateFriendRequests(requests) {
    if(requests && requests.length > 0) {
        $("#requestsTab").show();
        requests.sort(function(a, b) {return a.username.toLowerCase()
            .localeCompare(b.username.toLowerCase());});
        var $requestList = $("#friendRequests");
        $requestList.css("height", $("#friendsList").css("height"));
        for(var i in requests)
            ;//$requestList.append($("<div>" + requests.username + " friended you!</div>"));
    }
    else
        $("#requestsTab").hide()}
//Creates a new DOM element representing a friends or blocked list entry for
//the the given username which is formatted as specified by userType.
function getNewListEntry(user, userType) {
    var $result = null,
        classes;
    if(userType === "friend") {
        if(user.lastActivity != null) {
            if((new Date().getTime()) - (new Date(user.lastActivity).getTime()) 
                >= TIME_BEFORE_IDLE)
                classes = "' class='userListEntry idle'>";
            else
                classes = "' class='userListEntry active'>";
            $result = $("<div id='u_" + user.username + classes
                + user.username + "</div>")
                .click(function() {})                    
                .dblclick(function() {
                    createDialog({
                        room: user_name + new Date().getTime(),
                        username: user.username
                    }, send);
                });
        }
        else
            $result = $("<div id='u_" + user.username + "' class='userListEntry offline'>" 
                + user.username + "</div>")
                .click(function() {})                    
                .dblclick(function() {
                    createDialog({
                        room: user_name + new Date().getTime(),
                        username: user.username
                    }, send);
                });
    }
    else if(userType === "blocked")
        $result = $("<div id='u_" + user.username + "' class='userListEntry active'>" 
            + user.username + "</div>").click(function() {
                deleteBlockedUser(user.username);
                
            });
        
    return $result;
}

function addNewFriend(name) {
    addFriend({username:name}, function(err, data) {
        if(!err) {
            if(data && data.lastActivity != null)
                insertUser(getNewListEntry({username:name}, "friend"), "friends-online");
            else if (data)
                insertUser(getNewListEntry({username:name}, "friend"), "friends-offline");
            else {
                insertUser(getNewListEntry({username:name}, "friend"), "friends-pending");
                $("#friends-pending-label").show();
            }
        }
        else
            console.log("Error adding friend: " + err);
    });
}

function addNewBlockedUser(name) {
    blockUser({username:name}, function(err) {
        if(!err) {
            insertUser(getNewListEntry({username:name}, "blocked"), "blocked-users");
        }
        else
            console.log("Error blocking user: " + err);
    });
}

function deleteFriend(name) {
    removeFriend({username:name}, function(err) {
        if(!err) {
            $("#u_" + name).remove();
            if($("#friends-pending").children().length == 0)
                $("#friends-pending-label").hide();
        }
        else
            console.log("Error removing friend: " + err);
    });
}

function deleteBlockedUser(name) {
    unblockUser({username:name}, function(err) {
        if(!err) {
            $("#u_" + name).remove();
        }
        else
            console.log("Error unblocking user: " + err);
    });
}


//logout active idle
function statusChange(username, status) {
    console.log("statusChange: " + username + " - " + status);  //For Testing
        if(status === "logout")
            insertUser($("#u_" + username ).removeClass("idle").removeClass("active").addClass("offline"),
                "friends-offline");
        else if(status === "active")
            insertUser($("#u_" + username ).removeClass("idle").removeClass("offline").addClass("active"),
                "friends-online");
        else if(status === "idle")
            insertUser($("#u_" + username ).removeClass("offline").removeClass("active").addClass("idle"),
                "friends-online");
}

function friendChange(username, status) {
    console.log("friendChange: " + username + " - " + status);   //For Testing
    var $user = $("#u_" + username),
        isFriend = $user.length > 0;
    if(status === "add") {
        console.log(username + " has added you as a friend.")    //For Testing
        if(isFriend) {
            insertUser($user.removeClass("offline").addClass("active"),
                "friends-online");
            if($("#friends-pending").children().length == 0)
                $("#friends-pending-label").hide();
        }
        else;
            $("#requestsTab").show();
    }
    else if(status === "remove") {
        console.log(username + " has removed you as a friend.") //For Testing
        if(isFriend){
            //deleteFriend(username); ??
            $user.remove();
        }
    }
    else if(status === "block") {
        console.log(username + " has blocked you.")             //For Testing
        if(isFriend){
            //deleteFriend(username); ??
            $user.remove();
        }
    }
    else if(status === "unblock") {
        console.log(username + " has unblocked you.")            //For Testing
        
    }
}

//Inserts JQuery object $user in to the element with id listID.
function insertUser($user, listID) {
    var $list = $("#" + listID),
        $listItems = $list.children(),
        nItems = $listItems.length,
		done = false,
		result;
		
	$listItems = $listItems.first();
	for(var i = 1; i <= nItems && !done; i++) {
		result = $user.attr("id").toLowerCase()
            .localeCompare($listItems.attr("id").toLowerCase());
		if(result < 0) {
            $listItems.before($user);
            done = true;
		}
		else if(result > 0)
			$listItems = $listItems.next();
		else
			done = true;
	}
	if(!done)
    //New user will be the last (and possibly first & only) element in list
		$list.append($user);
}