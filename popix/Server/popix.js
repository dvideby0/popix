var http = require('http');
var Mongolian = require("mongolian");
var uuid = require('node-uuid');
var server = new Mongolian;
var app = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end();
});
var Users = 0;
var io = require('socket.io').listen(app);
io.enable('browser client minification');
io.enable('browser client etag');
io.enable('browser client gzip');
io.set('log level', 1);
var db = server.db("popix");
var posts = db.collection("posts");
var votes = db.collection("votes");
io.sockets.on('connection', function(socket) {
    Users = Users + 1;
    io.sockets.emit('UserCount', Users);
    socket.on('ClientSendImage', function(msg){
        var UUID = uuid.v1();
        socket.broadcast.emit('NewImage', {
            Image: msg.Image,
            Sender: msg.Author,
            HashTag: msg.HashTag,
            ID: UUID
        });
        posts.insert({
            ID: UUID,
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
        posts.find({User: msg}, {Image:1, HashTag:1, Votes:1, ID:1}).toArray(function (err, array) {
            for(var i = 0; i < array.length; i++){
                socket.emit('UserImages',JSON.stringify({
                    Image: array[i].Image,
                    ID: array[i].ID,
                    HashTag: array[i].HashTag,
                    Votes: array[i].Votes
                }));
            }
        });
    });
    socket.on('VoteUp', function (msg) {
        votes.findOne({ID: msg.UserID}, function(err, post){
            if(post){
                votes.findOne({$and: [{ID: msg.UserID},{ImageID: msg.ImageID}]}, function(err, post){
                    if(post){
                        socket.emit('Error', 'You have already voted for this image!');
                    }
                    else{
                        posts.findOne({ID: msg.ImageID}, function(err, post){
                            post.Votes = post.Votes + 1;
                            posts.save(post);
                        });
                        votes.update({ID: msg.UserID}, {"$addToSet": { ImageID : msg.ImageID } });
                    }
                });
            }
            else{
                votes.insert({ID: msg.UserID, ImageID: [msg.ImageID]});
                posts.findOne({ID: msg.ImageID}, function(err, post){
                    post.Votes = post.Votes + 1;
                    posts.save(post);
                });
            }
        });
    });
    socket.on('GetTopImages', function(){
        posts.find().sort({Votes: -1}).limit(20).toArray(function (err, array) {
            for(var i = 0; i < array.length; i++){
                socket.emit('TopImages',JSON.stringify({
                    Image: array[i].Image,
                    ID: array[i].ID,
                    HashTag: array[i].HashTag,
                    Votes: array[i].Votes
                }));
            }
        })
    });
});
app.listen(8989);