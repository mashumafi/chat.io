var socket = io.connect('http://chat_io.mashumafi.c9.io/');

function login(credentials, callback) {
    socket.emit('login', credentials, callback);
}

function register(credentials, callback) {
    socket.emit('register', credentials, callback);
}

// this will be called by an event from the gui
function startChatFromClient(details, callback) {
    details = {
        room: "" // default room everyone is in
    };
    sendChatRequestToServer(details, callback);
}

// this will be called on the other end from the server
function startChatFromServer(details, callback) {
    // TODO: dan
    // TODO: just open a dialog and if the user accepts the request then callback
}

function sendChatRequestToServer(details, callback) {
    // TODO: the callback here is for dan, whenever a message arrives
    socket.emit("joinChat", details, function(result) {
        createDialog(result, function(message, callback) {
            // TODO: check message
            // TODO: the callback here is a result of the message, most likely an exception
            socket.emit("say", message, callback);
        });
    });
}

function createDialog(details, callback) {
    $(document.createElement("form")).dialog({
        buttons: {
            Send: function() {
                var message = {
                    room: "",
                    msg: ""
                };
                callback(message, function() {
                    // handle the result
                });
            }
        }
    });
}

/*
The idea:
    User wants to chat, they do something in the UI
        choose who to chat with
    Dan calls a function with a callback
        the callback will be how he handles messages
    Logan goes to the server and connects the users
        he emits a function to the other user
    On the other user machine logan calls a function to start chat
        the function passes a callback
        dan uses the callback to send messages
        dan calls the same function he did before but opposite
            similar gui event from before, they accept chat
        everything cascades back to the other side to open the original user's dialog
            make sure it is not infinite loop
*/