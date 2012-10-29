//https://github.com/LearnBoost/socket.io/wiki
//http://socket.io/#how-to-use

var chatdb = require('./chatdb');

var g_chat, g_user;
module.exports = function(io) {
    io.configure(function() {
        io.set('transports', ['xhr-polling']);
        io.set('log level', 4);
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
};

function chatConnection(socket) {
    socket.on("send", send).on("joinRoom", joinRoom).on("leaveRoom", leaveRoom);
}

function userConnection(socket) {
    socket.on("login", login).on("register", register);
}

/**
 * Joins the data.room or a new room and sends the data to all connections in that room 
 * (data.username will be added to this room)
 */ 
function send(data, callback) {
    joinRoom.call(this, data.room, function(room) { 
        data.room = room; 
        if(data.username) {
            var sid = g_user.clients(data.username);
            if(sid.length) {
                var socket = g_chat.socket(sid[0]);
                if(socket) {
                    socket.join(room);
                }
            }
        }
        g_chat.in(data.room).emit('receiver', data);
        callback(data);
    });
}

/**
 * Joins the specified room or creates a new one if none is specified, returns the room to the caller
 */ 
function joinRoom(room, callback) {
    this.join((room = (room || new Date)));
    callback(room);
}

function leaveRoom(room) {
    this.leave(room);
}

function login(credentials, callback) {
    if(validate(credentials, callback, false)) {
        var me = this;
        credentials.session = me.id;
        chatdb.login(credentials, function(err, data) {
            if(!err) {
                me.join(data.username);
                chatdb.listFriends({session:me.id}, function(err, friends) {
                    if(!err) {
                        data.friends = friends;
                        callback(err, data);
                        for(var i = 0; i < friends.length; i++) {
                            var sid = g_user.clients(friends[i].username);
                            if(sid.length) {
                                var socket = g_user.socket(sid[0]);
                                if(socket) {
                                    socket.emit("onFriendLogin", data.username);
                                    me.emit("onFriendLogin", friends[i].username);
                                }
                            }
                            
                        }
                    } else {
                        callback(err, friends);
                    }
                });
            } else {
                callback(err, data);
            }
        });
    }
}

function register(credentials, callback) {
    if(validate(credentials, callback, true)) {
        var me = this;
        credentials.session = me.id;
        chatdb.register(credentials, function(err, data) {
            if(!err) {
                me.join(data.username);
            }
            callback(err, data);
        });
    }
}

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