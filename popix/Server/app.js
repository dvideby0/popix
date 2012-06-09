var http = require('http');
var app = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end();
});
var Users = 0;
var io = require('socket.io').listen(app);
io.set('log level', 1);
io.set('transports', ['websocket']);
io.sockets.on('connection', function(socket) {
    Users = Users + 1;
    io.sockets.emit('UserCount', Users);
    socket.on('ClientSendImage', function(msg){
        socket.broadcast.emit('NewImage', msg);
    });
    socket.on('disconnect', function () {
        Users = Users - 1;
        socket.broadcast.emit('UserCount', Users);
    });
});
app.listen(8989);