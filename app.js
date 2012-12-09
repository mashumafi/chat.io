var express = require('express'),
    http = require('http'),
    path = require('path'),
    chatserver = require('./chatserver');

var app = express();

app.configure(function() {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    //app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
    app.use(express.errorHandler());
});

app.get('/test', function(req, res) {
    res.render('test', {
        title: 'chat.io'
    });
});

app.get('/', function(req, res) {
    res.render('index', {
        title: 'chat.io'
    });
});

var appServer = http.createServer(app);
appServer.listen(app.get('port'), function() {
    console.log("Express server listening on port " + app.get('port'));
});

var io = require('socket.io').listen(appServer);
chatserver(io);