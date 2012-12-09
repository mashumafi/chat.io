var gChatCount = 0,
    gBlockedUsers;
/**
 * Fills friends list with users from friends array.
 * @param {Object[]} friends The list of the user's friends.
 * @param {Number} friends._id The id of the friend.
 * @param {String} friends.username The username of the friend.
 * @param {String} friends.lastActivity Date of friend's last activity in milliseconds.
 * @return
 **/
function populateFriendsList(friends, timeToIdle) {
    var $friendsPending = $("#friends-pending");
    
    //Check that friends array exists and has elements
    if(friends != null && friends.length > 0) {
        
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
/**
 * Fills user's blocked list with blocked users.
 * @param {Object[]} enemies List of blocked users.
 * @param {String} enemies.username The username of a blocked user.
 * @return
 **/
function populateBlockedList(enemies) {
    gBlockedUsers = [];
    if(enemies != null && enemies.length > 0) {
        enemies.sort(function(a, b) {return a.username.toLowerCase()
            .localeCompare(b.username.toLowerCase());});
        var $blockedUsers = $("#blocked-users");
        for(var i in enemies) {
            gBlockedUsers.push(enemies[i].username);
            $blockedUsers.append(getNewListEntry(enemies[i], "unblock, befriend"));
        }
    }
}
/**
 * Fills user's requests list with incoming friend requests.
 * @param {Object[]} requests List of users requesting to be added a friend.
 * @param {String} requests.username The username of a user who sent a friend request.
 * @return
 **/
function populateFriendRequests(requests) {
    var $requestList = $("#friend-requests");
    if(requests != null && requests.length > 0) {
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
/**
 * Determines if a user is on the blocked list or not.
 * @param {String} username The name of the user who's status is to be checked.
 * @return {Number} The position of the user in the blocked users array if found,
 * otherwise -1.
 **/
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
/**
 * Creates a new DOM element representing a friend list entry.
 * @param {Object[]} user Information about the user for which an entry shall be made.
 * @param {String} user.username The username of the user.
 * @param {String} user.lastActivity Date of last user's last activity in milliseconds.
 * @param {String} user.status A status, if desired.  Can be "active," "idle," or "offline."
 * @param {Number} timeToIdle Amount of time before user goes idle, in milliseconds.
 * @return {Object} The new DOM object.
 */
function getNewFriendEntry(user, timeToIdle) {
    var $entry = $(document.createElement("div")).attr("id", "u_" + user.username)
		.html(user.username + "<br/>")
		.click(function() {
			var $menu = $(this).children().first().next(),
				isHidden = $menu.css("display") === "none";
			$menu.toggle(isHidden);
		});
    var $menu,
        styleClass;
		
    //User is online.
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
    //User is offline
    else if (user.status == null || user.status === "offline"){
        styleClass = "userListEntry highlight offline";
        $menu = getNewEntryMenu(user.username, "unfriend, blockuser");
    }
	$entry.addClass(styleClass).append($menu.hide());
	
    return $entry;
}
/**
 * Creates a new DOM element representing a user list entry.
 * @param {Object} user Information about the user for which an entry shall be made.
 * @param {String} user.username The username of the user.
 * @param {String} options Menu options for the user entry.  May be "message," "befriend,"
 * "blockuser," "unfriend," "unblock," "accept," or "deny."
 * @return {Object} The new DOM object.
 */
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
/**
 * Creates a new DOM element representing a user list entry menu.
 * @param {String} username The username of the user.
 * @param {String} options Menu options.  May be a string consusting of 
 * "message," "befriend," "blockuser," "unfriend," "unblock," "accept," 
 * and/or "deny."
 * @return {Object} The new DOM object.
 */
function getNewEntryMenu(username, options) {
    var $menu = $(document.createElement("span"));
	
	if(options.match(/message/i))
		$menu.append($(document.createElement("span")).addClass("userListEntryMenu").html("Message")
			.click(function(event) {
				event.stopPropagation();
				createDialog({
                        room: "pr_" + user_name + new Date().getTime() + gChatCount++,
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
                        
                        //Set requests tab to display number of requests or hide it
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
/**
 * Adds given user to friends list.
 * @param {String} name Username of user to add.
 * @return
 */
function addNewFriend(name) {
    if(name !== user_name) {
        addFriend({username:name}, function(err, data) {
            if(!err) {
                //If user is on blocked list, remove.
                var $user = $("#blockedList").find("#u_" + name);
                if($user.length != 0)
                    $user.remove();
                
                //Add new friend to appropriate section of list
                if(data && data.lastActivity != null)
                    insertUser(getNewFriendEntry(data, TIME_BEFORE_IDLE), "friends-online");
                else if (data)
                    insertUser(getNewFriendEntry({username: name}, TIME_BEFORE_IDLE), "friends-offline");
                else {
                    insertUser(getNewFriendEntry({username: name}, TIME_BEFORE_IDLE), "friends-pending");
                    $("#friends-pending-label").show();
                }
                
                //If there was a friend request from added friend, update
                //requests tab appropriately.
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
/**
 * Adds given user to blocked list.
 * @param {String} name Username of user to add.
 * @return
 */
function addNewBlockedUser(name) {
    if(name !== user_name) {
        blockUser({username:name}, function(err) {
            if(!err) {
                //If blocked user is currently a friend, remove them from friends list.
    			var $user = $("#friendsList").find("#u_" + name);
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
/**
 * Removes given user from friends list.
 * @param {String} name Username of user to remove.
 * @return
 */
function deleteFriend(name) {
    removeFriend({username:name}, function(err) {
        if(!err) {
            $("#friendsList").find("#u_" + name).remove();
            if($("#friends-pending").children().length == 0)
                $("#friends-pending-label").hide();
        }
        else
            console.log("Error removing friend: " + err);
    });
}
/**
 * Removes given user from blocked list.
 * @param {String} name Username of user to remove.
 * @return
 */
function deleteBlockedUser(name) {
    unblockUser({username:name}, function(err) {
        var i;
        if(!err) {
            $("#BlockedList").find("#u_" + name).remove();
            console.log("Before: " + gBlockedUsers.length);
            if((i = isBlocked(name)) >= 0) {
                gBlockedUsers.splice(i,1);
                console.log("After: " + gBlockedUsers.length);
            }
        }
        else
            console.log("Error unblocking user: " + err);
    });
}

/**
 * Updates moves a friends list element to the appropriate section of the
 * list, changing the style and menu options accordingly.
 * @param {String} username Username of friend whose status changed.
 * @param {String} status Friend's new status.  Must be "active," "idle," or "offline."
 * @return
 **/
function statusChange(username, status) {
    var $userEntry = $("#friendsList").find("#u_" + username ),
        prevStatus;
    if($userEntry.parent().attr("id") !== "friends-pending" 
        && $userEntry.parent().attr("id") !== "blocked-users") {
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
                $userEntry = $("#friendsList").find("#u_" + username ).remove();
                insertUser(getNewFriendEntry({username:username, status:status}),"friends-offline");
            }
            else if((status === "active" || status === "idle") && prevStatus ==="offline") {
            //User came online, so delete old list element and create a new one
                $userEntry = $("#friendsList").find("#u_" + username ).remove();
                insertUser(getNewFriendEntry({username:username, status:status}),"friends-online");
            }
            else if(status === "active" || status === "idle") {
            //User went from active to idle or vice versa.  Just change the style.
                $userEntry.removeClass(prevStatus).addClass(status);
            }
        }
    }
}

/**
 * Updates displayed friend, blocked user, and friend request lists to reflect
 * changes in user relationships.
 * @param {String} username Username of friend whose status changed.
 * @param {String} status Action taken towards this user by the given user.  Must be 
 * "add," "remove," or "block."
 **/
function friendChange(username, status) {
    var $user = $("#friendsList").find("#u_" + username),
        isFriend = false;
    if($user.length != 0 && $user.parent().attr("id") !== "blocked-users")
        isFriend = true
    if(status === "add") {
        if(isFriend) {
			$user.remove();
            insertUser(getNewFriendEntry({username: username, status: "active"}),"friends-online");
            if($("#friends-pending").children().length == 0)
                $("#friends-pending-label").hide();
        }
        else {  //User is not friend's list, so add to requests tab.
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
        else {  //User is not a friend, so delete the incoming friend request.
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
        else {  //User is not a friend, so delete the incoming friend request.
            $("#r_" + username).remove();
            if($("#friend-requests").children().length == 0)
                $("#requestsTab").hide();
        }
    }
    //else if(status === "unblock") {}
}
/**
 * Inserts the given JQuery object into the DOM element with id listID.
 * @param {Object} $user A JQuery object for the user object to be inserted.
 * @param {String} listID The id of the DOM element to which the user object shoul be inserted.
 * @return
 */
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