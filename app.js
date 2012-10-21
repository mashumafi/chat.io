var express = require('express'), http = require('http'), path = require('path');
  
var mongo = require('mongodb'), Server = mongo.Server, Db = mongo.Db;
var serverOptions = {
  'auto_reconnect': true,
  'poolSize': 1
};
var server = new Server("alex.mongohq.com", 10011, serverOptions);
var db = new Db("chat-io", server);

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', function(req, res){
    res.render('index', { title: 'chat.io' });
});

var appServer = http.createServer(app);
appServer.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

var io = require('socket.io').listen(appServer);
io.configure(function () {
    // io.set('transports', ['websocket', 'flashsocket', 'xhr-polling']);
    io.set('transports', ['xhr-polling']);
});
io.sockets.on('connection', function (socket) {
  socket.on("login", function(credentials) {
    db.open(function(err, db) {
        db.authenticate("chat-io-admin", "pass", function(err, result) {
            if(!err) {
                db.collection("users", function(err, collection) {
                    if(!err) {
                        collection.find({username:"mashumafi"}).toArray(function(err, items) {
                            if(err == null) {
                                socket.emit('login', items[0]);
                            } else {
                                res.send(err);
                            }
                            db.close();
                        });
                    } else {
                        res.send(err);
                    }
                });
            } else {
                res.send(err);
            }
        });
    });
  });
});


