var http = require('http');
var Mongolian = require("mongolian");
var uuid = require('node-uuid');
var server = new Mongolian;
var knox = require('knox');
var fs = require('fs');
var im = require('imagemagick');
var client = knox.createClient({
    key: 'AKIAJSCSCE45OUFCBTIA',
    secret: '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',
    bucket: 'popix'
});
var app = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end();
});
var io = require('socket.io').listen(app);
io.enable('browser client minification');
io.enable('browser client etag');
io.enable('browser client gzip');
io.set('log level', 1);
var db = server.db("popix");
var posts = db.collection("posts");
var votes = db.collection("votes");
io.sockets.on('connection', function(socket) {
    socket.on('ClientSendImage', function(msg){
        var UUID = uuid.v1();
        posts.insert({
            ID: UUID,
            User: msg.Author,
            Created: new Date,
            ImageFull: 'https://s3.amazonaws.com/popix/imgposts/full/' + UUID + '.jpg',
            ImageThumb: 'https://s3.amazonaws.com/popix/imgposts/thumb/' + UUID + '.jpg',
            Votes: 0,
            Caption: msg.Caption,
            HashTag: msg.HashTag,
            Anonymous: msg.Anonymous
        });
        var dataBuffer = new Buffer(msg.Image, 'base64');
        im.resize({
            srcData: dataBuffer,
            width:  640,
            height: 857
        }, function(err, stdout, stderr){
            var imgBuffer = new Buffer(stdout, 'binary');
            if (err) throw err;
            var req = client.put('/imgposts/full/' + UUID + '.jpg', {
                'Content-Length': stdout.length,
                'Content-Type': 'image/jpeg'
            });
            req.end(imgBuffer);
        });
        im.resize({
            srcData: dataBuffer,
            width:  160,
            height: 240
        }, function(err, stdout, stderr){
            var imgBuffer = new Buffer(stdout, 'binary');
            if (err) throw err;
            var req = client.put('/imgposts/thumb/' + UUID + '.jpg', {
                'Content-Length': stdout.length,
                'Content-Type': 'image/jpeg'
            });
            req.on('response', function(){
                io.sockets.emit('NewImage', {
                    ImageThumb: 'https://s3.amazonaws.com/popix/imgposts/thumb/' + UUID + '.jpg',
                    ImageFull: 'https://s3.amazonaws.com/popix/imgposts/full/' + UUID + '.jpg',
                    Sender: msg.Author,
                    Caption: msg.Caption,
                    ID: UUID
                });
            });
            req.end(imgBuffer);
        });

    });
    socket.on('disconnect', function () {
    });
    socket.on('GetUserImages', function (msg) {
        posts.find({User: msg}, {ImageFull:1, ImageThumb:1, Caption:1, Votes:1, ID:1}).toArray(function (err, array) {
            for(var i = 0; i < array.length; i++){
                socket.emit('UserImages',JSON.stringify({
                    ImageFull: array[i].ImageFull,
                    ImageThumb: array[i].ImageThumb,
                    ID: array[i].ID,
                    Caption: array[i].Caption,
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
                    ImageFull: array[i].ImageFull,
                    ImageThumb: array[i].ImageThumb,
                    ID: array[i].ID,
                    Caption: array[i].Caption,
                    Votes: array[i].Votes
                }));
            }
        })
    });
});
app.listen(8989);