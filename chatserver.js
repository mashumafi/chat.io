var chatdb = require('./chatdb');

module.exports = function(io) {
    io.configure(function() {
        io.set('transports', ['xhr-polling']);
    });
    io.sockets.on('connection', function(socket) {
        socket.on("login", login);
        socket.on("register", register);
    });
};

function login(credentials, callback) {
    if(validate(credentials, callback)) {
        chatdb.login(credentials, callback);
    }
}

function register(credentials, callback) {
    if(validate(credentials, callback, true)) {
        chatdb.register(credentials, callback);
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
        if(!(/.+/).test(credentials.email)) { ////// [^@]+@[^\.]+\..+
            err.email = "Invalid email.";
        }
        delete credentials.emailCfm;
        delete credentials.passwordCfm;
    }
    return Object.keys(err).length === 0 || callback({err : err});
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