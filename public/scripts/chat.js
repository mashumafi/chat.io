var surl = "http://chat_io.mashumafi.c9.io/",
    user = io.connect(surl + "user"),
    chat = io.connect(surl + "chat");

function login(credentials, callback) {
    user.emit('login', credentials, callback);
}

function register(credentials, callback) {
    user.emit('register', credentials, callback);
}

/**
 * Sends data to data.room, adding data.username to the room
 */ 
function send(data, callback) {
    chat.emit("send", data, callback);
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

chat.on("receiver", function(data) {
    receive(data);
});

user.on("onFriendLogIn", function(username) {
    onFriendLogin(username);
});