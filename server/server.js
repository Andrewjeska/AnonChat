var url = require("url");
var express = require("express");
var bodyParser = require("body-parser");
var path = require('path');
var app = express();
var server = require('http').createServer(app);

// var server = app.listen(80, function() {
//     console.log("Server started.");
// });

var io = require('socket.io')(server);

app.use(express.static(path.resolve("polymer")));

//console.log(path.resolve("polymer"))

var gameStates = {};

var port = process.env.PORT || 3000;

server.listen(port, function () {
    console.log('Server listening at port %d', port);
});


app.use(bodyParser.json());
app.use(express.static(path.resolve("../polymer")));


app.get("/", function (req,res){
    //res.render('polymer/index')
    res.sendFile("index.html",{ root: __dirname + "/../polymer" });
});

app.get("/[a-z]{4}/", function(req,res,next){

    var room = get_url(req.url);
    res.send("Accessing chat room with id: " + room)
});

var numUsers=0;

io.on('connection', function (socket) {

    var username;
    var addedUser = false;

    // when the client emits 'new message', this listens and executes
    socket.on('new message', function (data) {

        // we tell the client to execute 'new message'
        socket.broadcast.emit('new message', {
            username: socket.username,
            message: data
        });
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add user', function () {

        username = generate_username();

        if (addedUser) return;

        // we store the username in the socket session for this client
        ++numUsers;
        addedUser = true;
        socket.emit('login', {
            numUsers: numUsers
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', {
            username: username,
            numUsers: numUsers
        });
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', function () {
        socket.broadcast.emit('typing', {
            username: username
        });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', function () {
        socket.broadcast.emit('stop typing', {
            username: username
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function () {
        if (addedUser) {
            --numUsers;

            // echo globally that this client has left
            socket.broadcast.emit('user left', {
                username: username,
                numUsers: numUsers
            });
        }
    });
});

var get_url = function(x) {
    var path = url.parse(x).pathname;
    return path.split("/")[1];
};

var cur_user = 0

var generate_username = function (){
    cur_user++

    return cur_user;
};


