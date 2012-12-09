var timeout, 
    TIME_BEFORE_IDLE = 1000 * 60, // 60 seconds before idling
    status; 
    
var surl = "/",
    user = io.connect(surl + "user"),
    chat = io.connect(surl + "chat"),
    friends = io.connect(surl + "friends");        

chat.on("receiver", function(data) {
    console.info(data.from + " sent the message '" + data.msg + "' to " + data.username + " using the room " + data.room);
    receive(data);
});

//status = active, idle, offline
friends.on("statusChange", function(username, status) {
    console.info(username + "'s status changed to " + status);
    statusChange(username, status);
});
  
//status = add, remove, block, unblock
user.on("friendChange", function(username, status) {
    console.info(username + " changed their friend status to " + status);
    friendChange(username, status);
});

/**
 * Handled automatically. Sends an idle status to all friends logged in
 * @returns
 */ 
function sendIdle() {
    sendStatus(status = "idle");
}

/**
 * Denies the supplied friend request
 * @param {Object} friend request to be denied
 * @param {Function} invoked on completion
 */ 
function denyFriend(data, callback) {
    user.emit("denyFriend", data, callback);
}
/**
 * Log in using the provided credentials
 * @param {Object} credentials to be tested
 * @param {Function} invoked on completion
 */ 
function login(credentials, callback) {
    user.emit('login', credentials, function(err, data) {
        if(!err) {
            status = "active";
            timeout = setTimeout(sendIdle, TIME_BEFORE_IDLE);
        }
        callback(err, data);
    });
}

/**
 * Log in using the provided credentials
 * @param {Object} credentials to be tested
 * @param {Function} invoked on completion
 */ 
function register(credentials, callback) {
    user.emit('register', credentials, function(err, data) {
            if(!err) {
                status = "active";
                timeout = setTimeout(sendIdle, TIME_BEFORE_IDLE);
            }
            callback(err, data);
        });
}

/**
 * Sends data to data.room, adding data.username to the room
 * @param {Object} message to be sent
 * @param {Function} invoked on completion
 */  
function send(data, callback) {
    chat.emit("send", data, callback);
    if(timeout) {
        clearTimeout(timeout);
    }
    if(status == "idle") {
        sendStatus(status = "active");
    }
    timeout = setTimeout(sendIdle, TIME_BEFORE_IDLE);
}

/**
 * Joins the specified room or creates a new room if no argument is supplied, 
 * returns the room to the caller
 * @param {String} name of the chat room to be joined
 * @param {Function} invoked on completion
 */ 
function joinRoom(room, callback) {
    chat.emit("joinRoom", room, callback);
}

/**
 * Leaves the specified chat room
 * @param {String} name of the room to be left
 */ 
function leaveRoom(room) {
    chat.emit("leaveRoom", room);
}
 
/**
 * Handled automatically - sends the specified status to all logged in friends
 */ 
function sendStatus(status) {
    friends.emit("sendStatus", status);
}

/**
 * Adds the specified user
 * @param {Object} friend associated data
 * @param {Function} invoked on completion
 */ 
function addFriend(data, callback) {
    user.emit("addFriend", data, callback);
}

/**
 * Blocks the specified user
 * @param {Object} friend associated data
 * @param {Function} invoked on completion
 */ 
function blockUser(data, callback) {
    user.emit("blockUser", data, callback);
}

/**
 * Unblocks the specified user
 * @param {Object} friend associated data
 * @param {Function} invoked on completion
 */ 
function unblockUser(data, callback) {
    user.emit("unblockUser", data, callback);
}

/**
 * Removes the specified friend
 * @param {Object} friend associated data
 * @param {Function} invoked on completion
 */ 
function removeFriend(data, callback) {
    user.emit("removeFriend", data, callback);
}

/**
 * Logs the user out
 * @param {Function} invoked on completion
 */ 
function logout(callback) {
    clearTimeout(timeout);
    user.emit("logout", callback);
}

/**
 * Gets an array of usernames in a certain room
 * @param {String} name of the room
 * @param {Function} invoked on completion
 */ 
function getUsersInRoom(room, callback) {
    chat.emit("getUsersInRoom", room, function(users) {
        callback(users);
    });
}

chat.on("userJoinsLeaves", function(username, joins_or_leaves, room) {
    console.log("The user " + username + " " + joins_or_leaves + " the room " + room);
    userJoinsLeaves(username, joins_or_leaves, room); 
});