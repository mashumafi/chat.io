var gChatCount = 0;

//Fills friends list with users from friends array.
//friends array is composed of objects that must contain a member username,
//and possibly members _id and/or lastActivity.
function populateFriendsList(friends) {
    var $friendsPending = $("#friends-pending");
    
    //Check that friends array exists and has elements
    if(friends && friends.length > 0) {
        
        //Put friends array in alphabetical order
        friends.sort(function(a, b) {return a.username.toLowerCase()
            .localeCompare(b.username.toLowerCase());});
        
        var $friendsOnline = $("#friends-online"),
            $friendsOffline = $("#friends-offline");
        for(var i in friends) {
            if(friends[i]._id == null) {               //Friend is pending
                console.log("You are awaiting approval from " + friends[i].username
                    + ", id = " + friends[i]._id);
                getNewFriendEntry(friends[i], TIME_BEFORE_IDLE).appendTo($friendsPending);
            }
            else if(friends[i].lastActivity != null)    //Friend is online
                getNewFriendEntry(friends[i], TIME_BEFORE_IDLE).appendTo($friendsOnline);
            else                                        //Friend is offline
                getNewFriendEntry(friends[i], TIME_BEFORE_IDLE).appendTo($friendsOffline);
        }
    }   
    //Show pending section if there are pending friends, otherwise hide it.
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
            $blockedUsers.append(getNewListEntry(enemies[i], "unblock, befriend"));
        }
    }
}

function populateFriendRequests(requests) {
    var $requestList = $("#friendRequests");
    $requestList.css("height", "25em");//$("#friendsList").css("height"));
    if(requests && requests.length > 0) {
        $("#requestsTab").show();
        requests.sort(function(a, b) {return a.username.toLowerCase()
            .localeCompare(b.username.toLowerCase());});
        var $newReq;
        for(var i in requests) {
			$newReq = $(document.createElement("div")).attr("id", "r_" + requests[i].username)
				.html(requests[i].username + "<br/>")	//ADD CLASS TOO
				.append(getNewEntryMenu(requests[i].username, "befriend, deny"));
            $requestList.append($newReq);
		}
		$("#requestsTab > a").html(++i);
    }
    else
        $("#requestsTab").hide();
}

//Creates a new DOM element representing a friends or blocked list entry for
//the the given user.
//User status can be determined from user.lastActivity if provided, or a
//status of active, idle, or offline can be provided in user.status.
function getNewFriendEntry(user, timeToIdle) {
    var $entry = $(document.createElement("div")).attr("id", "u_" + user.username)
		.html(user.username + "<br/>")
		.click(function() {
			var $menu = $(this).children().first().next(),
				isHidden = $menu.css("display") === "none";
			$menu.toggle(isHidden);
			//Change to close coordinate with other entries.
		});
    var $menu,
        styleClass;
		
    //User is a friend and online.
    if(user.lastActivity != null || user.status === "active" || user.status === "idle") {
        //Determine if user is active or idle
        if((new Date().getTime()) - (new Date(user.lastActivity).getTime()) 
            >= timeToIdle || user.status === "idle")
            styleClass = "userListEntry idle";
        else
            styleClass = "userListEntry active";
        //Get menu element
        $menu = getNewEntryMenu(user.username, "message, unfriend, blockuser");
    }
    else if (user.status == null || user.status === "offline"){
        styleClass = "userListEntry offline";
        $menu = getNewEntryMenu(user.username, "unfriend, blockuser");
    }
	$entry.addClass(styleClass).append($menu.hide());
	
    return $entry;
}

function getNewListEntry(user, options) {
	var $entry = $(document.createElement("div")).attr("id", "u_" + user.username)
		.addClass("userListEntry active").html(user.username + "<br/>")
		.click(function() {
			var $menu = $(this).children().first().next(),
				isHidden = $menu.css("display") === "none";
			$menu.toggle(isHidden);
			//Change to close coordinate with other entries.
		}),
    $menu = getNewEntryMenu(user.username, options);
    $entry.append($menu.hide());
	
    return $entry;
}

function getNewEntryMenu(username, options) {
    var $menu = $(document.createElement("span"));
	
	if(options.match(/message/i))
		$menu.append($(document.createElement("span")).addClass("userListEntryMenu").html("Message")
			.click(function(event) {
				event.stopPropagation();
				createDialog({
                        room: user_name + new Date().getTime() + gChatCount++,
                        username: username
                    }, send);
			}));
	if(options.match(/befriend/i))
		$menu.append($(document.createElement("span")).addClass("userListEntryMenu").html("Befriend")
			.click(function(event) {
				event.stopPropagation();
				addNewFriend(username);
			}));
	if(options.match(/blockuser/i))
		$menu.append($(document.createElement("span")).addClass("userListEntryMenu").html("Block")
			.click(function(event) {
				event.stopPropagation();
				addNewBlockedUser(username);
			}));
	if(options.match(/unfriend/i))
		$menu.append($(document.createElement("span")).addClass("userListEntryMenu").html("Remove")
			.click(function(event) {
				event.stopPropagation();
				deleteFriend(username);
			}));
	else if(options.match(/unblock/i))
		$menu.append($(document.createElement("span")).addClass("userListEntryMenu").html("Remove")
			.click(function(event) {
				event.stopPropagation();
				deleteBlockedUser(username);
			}));
	if(options.match(/accept/i))
		$menu.append($(document.createElement("span")).addClass("userListEntryMenu").html("Befriend")
			.click(function(event) {
				event.stopPropagation();
				addNewFriend(username);
			}));
	if(options.match(/deny/i))
		$menu.append($(document.createElement("span")).addClass("userListEntryMenu").html("Deny")
			.click(function(event) {
				event.stopPropagation();
				denyFriend({username: username}, function(err, result) {
					if(!err) {
						$("#r_" + username).remove();
                        
                        var numReqs = $("#friendRequests").children().length;
                        if(numReqs == 0) {
                            $("#friendsTabLink").click();
                            $("#requestsTab").hide();
                        }
                        else
    			            $("#requestsTab > a").html(numReqs);
					}
				});
			}));
		
    return $menu;
}

function addNewFriend(name) {
    if(name !== user_name) {
        addFriend({username:name}, function(err, data) {
            if(!err) {
    			var $user = $("#u_" + name);
    			if($user.length != 0)
    				$user.remove();
                    
                if(data && data.lastActivity != null)
                    insertUser(getNewFriendEntry(data, TIME_BEFORE_IDLE), "friends-online");
                else if (data)
                    insertUser(getNewFriendEntry({username: name}, TIME_BEFORE_IDLE), "friends-offline");
                else {
                    insertUser(getNewFriendEntry({username: name}, TIME_BEFORE_IDLE), "friends-pending");
                    $("#friends-pending-label").show();
                }
                
    			var $req = $("#r_" + name);
    			if($req.length > 0) {
    				$req.remove();
                    var numReqs = $("#friendRequests").children().length;
                    if(numReqs == 0) {
                        $("#friendsTabLink").click();
                        $("#requestsTab").hide();
                    }
                    else
    				    $("#requestsTab > a").html(numReqs);
    			}            
            }
            else
                console.log("Error adding friend: " + err);
        });
    }
}

function addNewBlockedUser(name) {
    if(name !== user_name) {
        blockUser({username:name}, function(err) {
            if(!err) {
    			var $user = $("#u_" + name);
    			if($user.length != 0)
    				$user.remove();
                insertUser(getNewListEntry({username:name},"unblock, befriend"), 
                    "blocked-users");
            }
            else
                console.log("Error blocking user: " + err);
        });
    }
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
	$userEntry = $("#u_" + username ).remove();
    if(status === "logout")
        insertUser(getNewFriendEntry({username:username, status:"offline"}),"friends-offline");
    else if(status === "active" || status === "idle")
        insertUser(getNewFriendEntry({username:username, status:status}),"friends-online");
}

function friendChange(username, status) {
    var $user = $("#u_" + username),
        isFriend = $user.length > 0;
    if(status === "add") {
        if(isFriend) {
			$user.remove();
            insertUser(getNewFriendEntry({username: username, status: "active"}),"friends-online");
            if($("#friends-pending").children().length == 0)
                $("#friends-pending-label").hide();
        }
        else {
			var $newReq = $(document.createElement("div")).attr("id", "r_" + username)
				.html(username + "<br/>")	//ADD CLASS TOO
				.append(getNewEntryMenu(username, "befriend, deny"));
            insertUser($newReq, "friendRequests");
			$("#requestsTab > a").html($("#friendRequests").children().length);
			$("#requestsTab").show();
        }
    }
    else if(status === "remove") {
        if(isFriend){
            $user.remove();
            if($("#friends-pending").children().length == 0)
                $("#friends-pending-label").hide();
        }
        else {
            $("#r_" + username).remove();
            if($("#friendRequests").children().length == 0)
                $("#requestsTab").hide();
        }
    }
    else if(status === "block") {
        if(isFriend){
            $user.remove();
            if($("#friends-pending").children().length == 0)
                $("#friends-pending-label").hide();
        }
        else {
            $("#r_" + username).remove();
            if($("#friendRequests").children().length == 0)
                $("#requestsTab").hide();
        }
    }
    else if(status === "unblock") {}
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