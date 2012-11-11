var timeout, 
    TIME_BEFORE_IDLE = 30000, // 30 seconds before idling
    status; 
    
var surl = "http://chat_io.mashumafi.c9.io/",
    user = io.connect(surl + "user"),
    chat = io.connect(surl + "chat"),
    friends = io.connect(surl + "friends");        

chat.on("receiver", function(data) {
    receive(data);
});

//status = active, idle, logout
friends.on("statusChange", function(username, status) {
    statusChange(username, status);
});
  
//status = add, block, unblock, remove  
user.on("friendChange", function(username, status) {
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