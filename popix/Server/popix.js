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
            Image: msg,
            Sender: socket.id
        });
        posts.insert({
            User: socket.id,
            Created: new Date,
            Image: msg
        });
    });
    socket.on('disconnect', function () {
        Users = Users - 1;
        socket.broadcast.emit('UserCount', Users);
    });
});
app.listen(8989);