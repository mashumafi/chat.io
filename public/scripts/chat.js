var socket = io.connect('http://chat_io.mashumafi.c9.io/');
function login(credentials, callback) {    
    socket.emit('login', credentials, callback);
}

function register(credentials, callback) {
    socket.emit('register', credentials, callback);
}