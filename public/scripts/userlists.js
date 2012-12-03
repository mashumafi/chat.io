var gChatCount = 0,
    gBlockedUsers;

//Fills friends list with users from friends array.
//friends array is composed of objects that must contain a member username,
//and possibly members _id and/or lastActivity.
function populateFriendsList(friends, timeToIdle) {
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
                getNewFriendEntry(friends[i], timeToIdle).appendTo($friendsPending);
            }
            else if(friends[i].lastActivity != null)    //Friend is online
                getNewFriendEntry(friends[i], timeToIdle).appendTo($friendsOnline);
            else                                        //Friend is offline
                getNewFriendEntry(friends[i], timeToIdle).appendTo($friendsOffline);
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
    gBlockedUsers = [];
    if(enemies && enemies.length > 0) {
        enemies.sort(function(a, b) {return a.username.toLowerCase()
            .localeCompare(b.username.toLowerCase());});
        var $blockedUsers = $("#blocked-users");
        for(var i in enemies) {
            gBlockedUsers.push(enemies[i].username);
            $blockedUsers.append(getNewListEntry(enemies[i], "unblock, befriend"));
        }
    }
}

function populateFriendRequests(requests) {
    var $requestList = $("#friend-requests");
    if(requests && requests.length > 0) {
        $("#requestsTab").show();
        requests.sort(function(a, b) {return a.username.toLowerCase()
            .localeCompare(b.username.toLowerCase());});
        var $newReq;
        for(var i in requests) {
			$newReq = $(document.createElement("div")).attr("id", "r_" + requests[i].username)
				.addClass("userListEntry").html(requests[i].username + "<br/>")
				.append(getNewEntryMenu(requests[i].username, "befriend, deny"));
            $requestList.append($newReq);
		}
		$("#requestsTab > a").html(++i);
    }
    else
        $("#requestsTab").hide();
}

function isBlocked(username) {
    var nUsers = gBlockedUsers.length,
        result;
        
    for(var i = 0; i < nUsers; i++) {
        result = gBlockedUsers[i].toLowerCase().localeCompare(username.toLowerCase());
        if(result === 0)
            return i;
    }
    
    return -1;    
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
            styleClass = "userListEntry highlight idle";
        else
            styleClass = "userListEntry highlight active";
        //Get menu element
        $menu = getNewEntryMenu(user.username, "message, unfriend, blockuser");
    }
    else if (user.status == null || user.status === "offline"){
        styleClass = "userListEntry highlight offline";
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
                        
                        var numReqs = $("#friend-requests").children().length;
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
                //If user is on blocked list, remove.
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
                    var numReqs = $("#friend-requests").children().length;
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
                    
                gBlockedUsers.push(name); 
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
        var i;
        if(!err) {
            $("#u_" + name).remove();
            if((i = isBlocked(name)) >= 0)
                gBlockedUsers.splice(i,1);
        }
        else
            console.log("Error unblocking user: " + err);
    });
}

/**
 * Updates moves a friends list element to the appropriate section of the
 * list, changing the style and menu options accordingly.
 * @param {String} Username of friend whose status changed.
 * @param {String} Friend's new status.  Must be "active," "idle," or "offline."
 **/
function statusChange(username, status) {
    var $userEntry = $("#u_" + username ),
        prevStatus;
        
    if($userEntry.length != 0) {
        //Find current status
        if($userEntry.hasClass("offline"))
            prevStatus = "offline";
        else if($userEntry.hasClass("active"))
            prevStatus = "active";    
        else
            prevStatus = "idle";
        
        //Update user list element
        if(status === "offline") {
        //User logged out, so delete old list element and create a new one
            $userEntry = $("#u_" + username ).remove();
            insertUser(getNewFriendEntry({username:username, status:status}),"friends-offline");
        }
        else if((status === "active" || status === "idle") && prevStatus ==="offline") {
        //User came online, so delete old list element and create a new one
            $userEntry = $("#u_" + username ).remove();
            insertUser(getNewFriendEntry({username:username, status:status}),"friends-online");
        }
        else if(status === "active" || status === "idle") {
        //User went from active to idle or vice versa.  Just change the style.
            $userEntry.removeClass(prevStatus).addClass(status);
        }
    }
}

/**
 * Updates displayed friend, blocked user, and friend request lists to reflect
 * changes in user relationships.
 * @param {String} Username of friend whose status changed.
 * @param {String} Action taken towards this user by the given user.  Must be 
 * "add," "remove," or "block."
 **/
function friendChange(username, status) {
    var $user = $("#u_" + username),
        isFriend = $user.length > 0;
    console.log("**" + username + status + "ed you. Current friend status: " + isFriend);
    if(status === "add") {
        if(isFriend) {
			$user.remove();
            insertUser(getNewFriendEntry({username: username, status: "active"}),"friends-online");
            if($("#friends-pending").children().length == 0)
                $("#friends-pending-label").hide();
        }
        else {
			var $newReq = $(document.createElement("div")).attr("id", "r_" + username)
				.addClass("userListEntry").html(username + "<br/>")
				.append(getNewEntryMenu(username, "befriend, deny"));
            insertUser($newReq, "friend-requests");
			$("#requestsTab > a").html($("#friend-requests").children().length);
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
            if($("#friend-requests").children().length == 0)
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
            if($("#friend-requests").children().length == 0)
                $("#requestsTab").hide();
        }
    }
    //else if(status === "unblock") {}
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