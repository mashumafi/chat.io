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

//status = active, idle, logout
friends.on("statusChange", function(username, status) {
    console.info(username + "'s status changed to " + status);
    statusChange(username, status);
});
  
//status = add, block, unblock, remove  
user.on("friendChange", function(username, status) {
    console.info(username + " changed their friend status to " + status);
    friendChange(username, status);
});

/**
 * Handled automatically
 */ 
function sendIdle() {
    sendStatus(status = "idle");
}

function denyFriend(data, callback) {
    user.emit("denyFriend", data, callback);
}

function login(credentials, callback) {
    user.emit('login', credentials, function(err, data) {
        if(!err) {
            status = "active";
            timeout = setTimeout(sendIdle, TIME_BEFORE_IDLE);
        }
        callback(err, data);
    });
}

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
 */ 
function joinRoom(room, callback) {
    chat.emit("joinRoom", room, callback);
}

function leaveRoom(room) {
    chat.emit("leaveRoom", room);
}
 
/**
 * Handled automatically
 */ 
function sendStatus(status) {
    friends.emit("sendStatus", status);
}

function addFriend(data, callback) {
    user.emit("addFriend", data, callback);
}

function blockUser(data, callback) {
    user.emit("blockUser", data, callback);
}

function unblockUser(data, callback) {
    user.emit("unblockUser", data, callback);
}

function removeFriend(data, callback) {
    user.emit("removeFriend", data, callback);
}

function logout(callback) {
    clearTimeout(timeout);
    user.emit("logout", callback);
}

function getUsersInRoom(room, callback) {
    chat.emit("getUsersInRoom", room, function(users) {
        callback(users);
    });
}

chat.on("userJoinsLeaves", function(username, joins_or_leaves, room) {
    console.log("The user " + username + " " + joins_or_leaves + " the room " + room);
    userJoinsLeaves(username, joins_or_leaves, room); 
});