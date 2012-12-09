//https://github.com/LearnBoost/socket.io/wiki
//http://socket.io/#how-to-use

var chatdb = require('./chatdb');

var g_io, g_chat, g_user, g_friends, g_canvas;
module.exports = function(io) {
    g_io = io;
    io.configure(function() {
        io.set('transports', ['xhr-polling']);
        io.set('log level', 2);
    });
    io.set('authorization', function (handshakeData, callback) {
        /*handshakeData = {
            headers: req.headers       // <Object> the headers of the request
            , time: (new Date) +''       // <String> date time of the connection
            , address: socket.address()  // <Object> remoteAddress and remotePort object
            , xdomain: !!headers.origin  // <Boolean> was it a cross domain request?
            , secure: socket.secure      // <Boolean> https connection
            , issued: +date              // <Number> EPOCH of when the handshake was created
            , url: request.url          // <String> the entrance path of the request
            , query: data.query          // <Object> the result of url.parse().query or a empty object
        }*/
        // first argument is string or anything else
        callback(null, true); // error first callback style 
    });
    g_chat = io.of("/chat").on('connection', chatConnection);
    g_user = io.of("/user").on("connection", userConnection);
    g_friends = io.of("/friends").on("connection", friendsConnection);
    g_canvas = io.of("/canvas").on("connection", canvasConnection)
};
/**
 * The supplied '/chat' socket will be notified about chat interactions
 * @param {Socket} the socket that will listen for these events
 * @returns
 */
function chatConnection(socket) {
    socket
        .on("send", send)
        .on("joinRoom", joinRoom)
        .on("leaveRoom", leaveRoom)
        .on("getUsersInRoom", getUsersInRoom);
}

/**
 * The supplied '/user' socket will be notified about user interactions
 * @param {Socket} the socket that will listen for these events
 * @returns
 */
function userConnection(socket) {
    socket
        .on("login", login)
        .on("register", register)
        .on("disconnect", disconnect)
        .on("addFriend", addFriend)
        .on("blockUser", blockUser)
        .on("unblockUser", unblockUser)
        .on("removeFriend", removeFriend)
        .on("logout", logout)
        .on("denyFriend", denyFriend);
}

/**
 * The supplied '/canvas' socket will be notified about canvas interactions
 * @param {Socket} the socket that will listen for these events
 * @returns
 */
function canvasConnection(socket) {
    socket.on("updateCanvas", function(data) {
        g_canvas.in(data.room).emit("updateCanvas", data);
    });
    socket.on("joinCanvas", function(room, callback) {
        g_canvas.in(room).emit("requestCanvas", room); //EXTREMELY INNEFFICIENT
        this.join(room);
        callback();
    });
}

/**
 * Denies a friend request and invokes the supplied callback on completion
 * @param {Object} the associated user data
 * @param {Function} invoked on completion
 * @returns
 */
function denyFriend(data, callback) {
    data.session = this.id;
    chatdb.denyFriend(data, callback);
    friendChange.call(this, data.username, "remove", "leave");
}

/**
 * Logs the current user of the application
 * @param {Function} invoked on completion
 * @returns
 */
function logout(callback) {
    var data = {session:this.id}, 
        username = getSocketUsername(this),
        rooms = g_io.sockets.manager.roomClients[this.id], 
        me_chat = getSocketAsOther(this, g_chat);
    sendStatus.call(this, "offline");
    console.info("user is leaving rooms");
    console.info("    " + username);
    for(var i in rooms) {
        if(i.indexOf("/chat/") === 0) {
            i = i.substring(6);
            console.info("    " + i);
            leaveRoom.call(me_chat, i);
        }
    }
    this.leave(username);
    chatdb.logout(data, callback);
}


/**
 * The supplied '/friend' socket will be notified about friend interactions
 * @param {Socket} the socket that will listen for these events
 * @returns
 */
function friendsConnection(socket) {
    socket
        .on("sendStatus", sendStatus);
}

/**
 * Standard socket.io disconnect handler
 * @returns
 */
function disconnect() {
    logout.call(this, function() {});
}

/**
 * Add a friend to your friends list
 * @param {Object} the associate friend and user data
 * @param {Function} invoked on completion
 * @returns
 */
function addFriend(data, callback) {
    data.session = this.id;
    chatdb.addFriend(data, callback);
    friendChange.call(this, data.username, "add", "join");
}


/**
 * Block a user
 * @param {Object} the associate friend and user data
 * @param {Function} invoked on completion
 * @returns
 */
function blockUser(data, callback) {
    data.session = this.id;
    chatdb.blockUser(data, callback);
    friendChange.call(this, data.username, "block", "leave");
}

/**
 * Unblock a user
 * @param {Object} the associate friend and user data
 * @param {Function} invoked on completion
 * @returns
 */
function unblockUser(data, callback) {
    data.session = this.id;
    chatdb.unblockUser(data, callback);
    friendChange.call(this, data.username, "unblock", false);
}

/**
 * Remove a friend from your friends list
 * @param {Object} the associate friend and user data
 * @param {Function} invoked on completion
 * @returns
 */
function removeFriend(data, callback) {
    data.session = this.id;
    chatdb.removeFriend(data, callback);
    friendChange.call(this, data.username, "remove", "leave");
}


/**
 * Gets the specified socket's associated username
 * @param {Socket} socket whose associated username is desired
 * @returns {String} the socket's associated username
 */
function getSocketUsername(socket) {
    var usernames = g_io.sockets.manager.roomClients[socket.id]; //get the username associated with this socket
    for(var i in usernames) {
        if(i.indexOf("/user/") === 0) {
            return i.replace("/user/", "");
        }
    }
}

/**
 * Gets the supplied socket within another scope
 * @param {Socket} the socket to cast
 * @param {Scope} the scope to obtain
 * @returns a socket rescoped to other
 */
function getSocketAsOther(socket, other) {
    return other.socket(socket.id);
}

/**
 * Gets the current list of usernames in a room
 * @param {String} the name of the chat room to get the list of users for
 * @param {Function} invoked on completion
 */
function getUsersInRoom(room, callback) {
    var users = g_chat.clients(room);
    console.info("Getting users from room " + room + " : " + users.length);
    for(var i = 0; users && i < users.length; i++) {
        users[i] = getSocketUsername(g_user.socket(users[i].id));
    }
    callback(users);
}

/**
 * Changes the friend status of the specified users
 * @param {String} the username whose status is being changed
 * @param {String} the new friendship status
 * @param {String} determines if the other user should join this users associated friend scope
 * @returns
 */
function friendChange(to, status, join_or_leave) {    
    var username = getSocketUsername(this);
    var other_socket = g_user.clients(to)[0]; //get the other users socket
    if(other_socket && join_or_leave) { //if your friend is logged in
        g_user.in(to).emit("friendChange", username, status); //tell your friend the change
        getSocketAsOther(this, g_friends)[join_or_leave](to); //join or leave the room
        //getSocketAsOther(other_socket, g_friends)[join_or_leave](username);
        console.info(username + " changed their friend status to " + status + " with " + to + " : " + join_or_leave);
    }
}

/**
 * Sends a user status to all logged in friends
 * @param {String} the status to be sent
 * @returns
 */
function sendStatus(status) {
    var username = getSocketUsername(this);
    g_friends.in(username).emit("statusChange", username, status); //emit to all your friends    
    var clients = g_friends.clients(username);    
    var s = status + " sent to clients in room /friends/" + username;
    for(var i in clients) {
        s += "\n    " + getSocketUsername(g_friends.socket(clients[i].id));
    }
    console.info(s);
}

/**
 * Turns an object into a readable string
 * @param {Object} object to be stringified
 * @param {String} the total accumulated tabbing
 * @returns
 */
function print_r(r, t) {
    var s = "", to;
    t = t || "    ";
    for(var i in r) {
        try {
            to = typeof(r[i]);
            if(to != "object" && to != "function") {
                s += t + i + " : " + r[i] + "\n";
            }
        } catch(e) {
        }
    }
    return s;
}

/**
 * Sends a message to all users in the specified room
 * Joins the data.room or a new room and sends the data to all connections in that room 
 * (data.username will be added to this room)
 * @param {Object} data to be sent
 * @param {Function} invoked on completion
 * @returns
 */
function send(data, callback) {
    joinRoom.call(this, data.room, function(room) { //joins the specified chat room
        data.from = getSocketUsername(this);
        data.room = room; //this is the official room name
        if(data.username) { //if this message is meant for a specific user name
            var sid = g_user.clients(data.username); //get the user scope socket
            if(sid.length) { //if there is a user socket
                var socket = g_chat.socket(sid[0].id); //get the chat scope socket
                if(socket) { //if there is a chat scope socket
                    joinRoom.call(socket, room, function(){}); //make that socket join this chat                    
                }
            }
        }
        g_chat.in(room).emit('receiver', data); //emit the data to all users in the room
        callback(data);
        
        var clients = g_chat.clients(room);
        var s = data.msg + " sent to clients to room /chat/" + room;
        for(var i in clients) {
            s += "\n    " + getSocketUsername(g_chat.socket(clients[i].id));
        }
        console.info(s);
    });
}

/**
 * Joins the specified chat room
 * @param {String} name of the room to be joined
 * @param {Function} invoked on completion
 * @returns
 */
function joinRoom(room, callback) {
    this.join(room = (room || new Date().getTime())); //joins the specified room or creates a new one
    g_chat.in(room).emit("userJoinsLeaves", getSocketUsername(this), "join", room);
    callback.call(this, room); //passes the room name back to the caller
}

/**
 * Leaves the specified chat room
 * @param {String} name of the room to be left
 * @returns
 */
function leaveRoom(room) {
    g_chat.in(room).emit("userJoinsLeaves", getSocketUsername(this), "leave", room);
    this.leave(room); //leave the specified chat room
}

/**
 * Log in using the specified credentials
 * @param {Object} credentials to be tested
 * @param {Function} invoked on completion
 * @returns
 */
function login(credentials, callback) { //this is a user scoped socket
    if(validate(credentials, callback, false)) { //if the login credentials are valid
        var l_user = this, //refernece to this as a local user scoped socket
            l_friend = g_friends.socket(credentials.session = this.id); //get this as a friend scoped socket, this socket id represents the session        
        chatdb.login(credentials, function(err, data) { //login with these credentials
            if(!err) { //if there is not an error
                l_user.join(data.username); //join your personal user room
                chatdb.listFriends({session:l_user.id}, function(err, users) { //get a list of your friends
                    if(!err) { //if there was no error                  
                        for(var i = 0; i < users.friends.length; i++) { //connect to all of your friends
                            if(users.friends[i]._id) {
                                var sid = g_user.clients(users.friends[i].username); //get your friends user scope socket
                                if(sid.length) { //if that friend is logged in
                                    var socket = g_friends.socket(sid[0].id); //get your friends friend scope socket
                                    if(socket) {
                                        socket.join(data.username); //your friend joins your friend list
                                        l_friend.join(users.friends[i].username); //you join your friend's friend list
                                    }
                                }
                            }
                        }
                        sendStatus.call(l_friend, "active");
                        data.friends = users; //add the friends list to the data
                        callback(err, data); //give the client all of the important data      
                    } else { //if there was an error with listFriends
                        callback(err, users);
                    }
                });
            } else { //if there was an error with login
                callback(err, data);
            }
        });
    }
}

/**
 * Register using the specified credentials
 * @param {Object} credentials to be tested
 * @param {Function} invoked on completion
 * @returns
 */
function register(credentials, callback) { //this is a user scoped socket
    if(validate(credentials, callback, true)) { //if the registration credentials are valid
        var me = this; //store a reference to this for later
        credentials.session = me.id; //give the socket id as the session to the db     
        chatdb.register(credentials, function(err, data) { //register the account
            if(!err) { //if there was a not an error
                me.join(data.username); //join a personal user room
            }
            callback(err, data); //callback to the client
        });
    }
}

/**
 * Validates the specified credentials
 * @param {Object} credentials to be tested
 * @param {Function} invoked on completion
 * @param {Boolean} determines if this function should use additional logic that is used for registering an account
 * @returns
 */
function validate(credentials, callback, isRegistering) {
    var err = {}, u = credentials.username, p = credentials.password;
    if(!u) {
        err.username = "Cannot be blank.";
    } else if(u.length < 3) {
        err.username = "Must be 3 or more characters.";
    } else if(u.length > 12) {
        err.username = "Must be 10 or less characters.";
    }
    if(!p) {
        err.password = "Cannot be blank.";
    } else if(p.length < 4) {
        err.password = "Must be 4 or more characters.";
    } else if(p.length > 12) {
        err.password = "Must be 10 or less characters.";
    } else {
        err.password = hasSymbols(p);
        if(!err.password) delete err.password;
    }
    if(isRegistering) {
        if(credentials.email !== credentials.emailCfm) {
            err.emailCfm = "Email must match.";
        }
        if(credentials.password !== credentials.passwordCfm) {
            err.passwordCfm = "Password must match.";
        }
        if(!(/.+/).test(credentials.email)) { // [^@]+@[^\.]+\..+
            err.email = "Invalid email.";
        }
        delete credentials.emailCfm;
        delete credentials.passwordCfm;
    }
    return Object.keys(err).length === 0 || callback(err, null);
}

/**
 * Validates the specified password
 * @param {String} used for testing passwords for certain character containment
 * @return
 */ 
function hasSymbols(p) {
    var u, l, s, n, c, i = 0;
    for(; i < p.length && !(u && l && s && n);) {
        c = p[i++];
        if('a' <= c && c <= 'z') {
            l = 1;
        } else if('A' <= c && c <= 'Z') {
            u = 1;
        } else if('0' <= c && c <= '9') {
            n = 1;
        } else {
            s = 1;
        }
    }
    if(!u) {
        return "Must contain at least one uppercase letter.";
    } else if(!l) {
        return "Must contain at least one lowercase letter.";
    } else if(!s) {
        return "Must contain at least one symbol.";
    } else if(!n) {
        return "Must contain at least one number.";
    }
}