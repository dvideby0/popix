var http = require('http');
var Mongolian = require("mongolian");
var server = new Mongolian;
var app = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end();
});
var Users = 0;
var io = require('socket.io').listen(app);
io.set('log level', 1);
var db = server.db("popix");
var posts = db.collection("posts");
io.sockets.on('connection', function(socket) {
    Users = Users + 1;
    io.sockets.emit('UserCount', Users);
    socket.on('ClientSendImage', function(msg){
        socket.broadcast.emit('NewImage', {
            Image: msg.Image,
            Sender: msg.Author,
            HashTag: msg.HashTag
        });
        posts.insert({
            User: msg.Author,
            Created: new Date,
            Image: msg.Image,
            Votes: 0,
            HashTag: msg.HashTag,
            Anonymous: msg.Anonymous
        });
    });
    socket.on('disconnect', function () {
        Users = Users - 1;
        socket.broadcast.emit('UserCount', Users);
    });
    socket.on('GetUserImages', function (msg) {
        posts.find({User: msg}, {Image:1, HashTag:1}).toArray(function (err, array) {
            for(var i = 0; i < array.length; i++){
                socket.emit('UserImages',JSON.stringify(array[i]));
            }
        });
    });
});
app.listen(8989);